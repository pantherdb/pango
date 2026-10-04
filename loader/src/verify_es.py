"""Checks that a dataset's two Elasticsearch indexes hold what its output files say.

A step in all.sh (after index_es) and a standalone CLI:

    python -m src.verify_es -a <clean annotations> -g <clean genes> -p <index prefix> [--strict]

It compares document counts with the files, the live mappings with
data/es_settings/*_mappings.json, the analyzer, a sample of genes, and (inside a build)
whether the index was created by this build's index_es run. It changes nothing but a
`_refresh` of the two indexes, so the counts include index_es's last writes.

Every check goes into the build record. A failed one is printed and recorded, and exits
0 unless --strict: the build process is to be revisited as a whole, so this step doesn't
stop a build yet.
"""

import load_env
import argparse
import json
import random
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import ijson

from src.build_record import NULL_RUN, current_run, find_runs, record_run
from src.build_record.build import parse_iso
from src.build_record.paths import build_id_from_env, iso
from src.config.base import TableAggType, file_path
from src.config.es import es
from src.create_index import get_index_base_name

ES_SETTINGS_DIR = Path(__file__).resolve().parents[1] / 'data' / 'es_settings'
SAMPLE_SIZE = 20
# How far outside the index_es run an index's creation time may fall and still be its own.
CREATION_SLACK_S = 5
LISTED = 30


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Check a dataset's Elasticsearch indexes against its output files")
    parser.add_argument('-a', dest='annotations_file', required=True, type=file_path,
                        help='The clean annotations JSON that was indexed')
    parser.add_argument('-g', dest='genes_file', required=True, type=file_path,
                        help='The clean genes JSON that was indexed')
    parser.add_argument('-p', dest='index_prefix', default='', type=str,
                        help='The index prefix index_es used (the dataset name)')
    parser.add_argument('--sample', type=int, default=SAMPLE_SIZE,
                        help=f'How many genes to look up one by one (default {SAMPLE_SIZE})')
    parser.add_argument('--strict', action='store_true', help='Exit 1 when a check fails')
    return parser.parse_args()


def index_name(index_type: str, prefix: str) -> str:
    base = get_index_base_name(index_type)
    return f'{prefix}-{base}' if prefix else base


def mapped_fields(properties: Optional[dict], prefix: str = '') -> Dict[str, Optional[str]]:
    """{dotted field: type} for a mapping, nested properties and multi-fields included."""
    fields: Dict[str, Optional[str]] = {}
    for name, spec in (properties or {}).items():
        path = f'{prefix}{name}'
        fields[path] = spec.get('type', 'object')
        if spec.get('properties'):
            fields.update(mapped_fields(spec['properties'], f'{path}.'))
        for sub, sub_spec in (spec.get('fields') or {}).items():
            fields[f'{path}.{sub}'] = sub_spec.get('type')
    return fields


def compare_mapping(declared: dict, live: dict) -> Tuple[List[str], List[str], List[str]]:
    """(declared fields missing live, declared fields typed differently, fields only live)."""
    want = mapped_fields(declared.get('properties'))
    have = mapped_fields(live.get('properties'))
    missing = sorted(field for field in want if field not in have)
    mismatched = sorted(f'{field}: {want[field]} declared, {have[field]} live'
                        for field in want if field in have and have[field] != want[field])
    extra = sorted(field for field in have if field not in want)
    return missing, mismatched, extra


def read_genes(path: Any, sample_size: int) -> Tuple[int, Dict[str, Any]]:
    """The genes file's record count, and a sample of {gene: term_count}.

    The sample is a reservoir seeded by the file's size, so the same file gives the
    same genes on every run.
    """
    rng = random.Random(Path(path).stat().st_size)
    sample: List[Tuple[str, Any]] = []
    count = 0
    with open(path, 'rb') as f:
        for gene in ijson.items(f, 'item', use_float=True):
            count += 1
            entry = (gene.get('gene'), gene.get('term_count'))
            if len(sample) < sample_size:
                sample.append(entry)
            else:
                slot = rng.randrange(count)
                if slot < sample_size:
                    sample[slot] = entry
    return count, dict(sample)


def count_annotations(path: Any, genes: set) -> Tuple[int, Dict[str, int]]:
    """The annotations file's record count, and how many annotations each sampled gene has.

    Reads only each record's `gene` (ijson prefix item.gene), which is much faster than
    building the 400 MB of records.
    """
    count = 0
    per_gene = {gene: 0 for gene in genes}
    with open(path, 'rb') as f:
        for gene in ijson.items(f, 'item.gene'):
            count += 1
            if gene in per_gene:
                per_gene[gene] += 1
    return count, per_gene


def index_es_window(prefix: str) -> Optional[Tuple[datetime, datetime]]:
    """When this build's index_es run for the dataset ran, if this is a recorded build."""
    build_id = build_id_from_env()
    if not build_id:
        return None
    runs = find_runs(build_id, step='index_es', dataset=prefix or None)
    if not runs:
        return None
    run = runs[-1]
    started = parse_iso(run.get('started_at'))
    ended = parse_iso(run.get('finished_at') or run.get('updated_at'))
    return (started, ended) if started and ended else None


class Checks:
    """The checks made so far, as rows of the verification table."""

    def __init__(self):
        self.rows: List[dict] = []

    def add(self, index: Optional[str], check: str, expected: Any, actual: Any,
            ok: Optional[bool] = None, detail: Optional[str] = None) -> bool:
        """Record one check. ok defaults to expected == actual; None means informational."""
        if ok is None and expected is not None:
            ok = expected == actual
        self.rows.append({'index': index, 'check': check, 'expected': expected, 'actual': actual,
                          'ok': ok, 'detail': detail})
        mark = {True: 'ok', False: 'FAILED', None: 'info'}[ok]
        print(f"[{mark}] {index or 'cluster'}: {check}: expected {expected}, got {actual}"
              + (f' ({detail})' if detail and ok is False else ''))
        return bool(ok)

    @property
    def failed(self) -> List[dict]:
        return [row for row in self.rows if row['ok'] is False]


def check_index(checks: Checks, run, index_type: str, index: str, expected_docs: int,
                window: Optional[Tuple[datetime, datetime]]) -> Optional[int]:
    """Existence, document count, mapping, analyzer and creation time of one index."""
    if not checks.add(index, 'Index exists', True, bool(es.indices.exists(index=index))):
        return None
    es.indices.refresh(index=index)
    run.es_op('refresh', index=index)
    live_docs = es.count(index=index)['count']
    run.es_op('count', index=index, count=live_docs)
    checks.add(index, 'Documents match the output file', expected_docs, live_docs)

    with open(ES_SETTINGS_DIR / f'{index_type}_mappings.json', encoding='utf-8') as f:
        declared = json.load(f)
    live_mapping = es.indices.get_mapping(index=index)[index]['mappings']
    missing, mismatched, extra = compare_mapping(declared, live_mapping)
    problems = [f'missing {field}' for field in missing] + mismatched
    checks.add(index, 'Declared fields are mapped as declared', 0, len(problems),
               detail='; '.join(problems[:LISTED]) or None)
    checks.add(index, 'Fields added by dynamic mapping', None, len(extra), ok=None,
               detail=', '.join(extra[:LISTED]) + (f', and {len(extra) - LISTED} more' if len(extra) > LISTED else '')
               if extra else None)

    settings = es.indices.get_settings(index=index)[index]['settings']['index']
    analyzers = (settings.get('analysis') or {}).get('analyzer') or {}
    checks.add(index, 'ngram_analyzer is defined', True, 'ngram_analyzer' in analyzers)

    created = datetime.fromtimestamp(int(settings['creation_date']) / 1000, timezone.utc)
    if window:
        started, ended = window
        within = (started.timestamp() - CREATION_SLACK_S <= created.timestamp()
                  <= ended.timestamp() + CREATION_SLACK_S)
        checks.add(index, "Created by this build's index_es run", True, within,
                   detail=f'created {iso(created)}; index_es ran {iso(started)} to {iso(ended)}')
    else:
        checks.add(index, 'Created at', None, iso(created), ok=None)
    return live_docs


def check_samples(checks: Checks, run, genes_index: str, annotations_index: str,
                  term_counts: Dict[str, Any], annotation_counts: Dict[str, int]) -> None:
    """Look up each sampled gene: one gene document with the file's term_count, and as
    many annotation documents as the file has."""
    bad_genes, bad_annotations = [], []
    for gene, term_count in term_counts.items():
        hits = es.search(index=genes_index, query={'term': {'gene.keyword': gene}}, size=2,
                         source_includes=['gene', 'term_count'])['hits']['hits']
        if len(hits) != 1 or hits[0]['_source'].get('term_count') != term_count:
            found = [hit['_source'].get('term_count') for hit in hits]
            bad_genes.append(f'{gene}: term_count {term_count} in the file, {found or "no document"} in the index')
        live = es.count(index=annotations_index, query={'term': {'gene.keyword': gene}})['count']
        if live != annotation_counts.get(gene, 0):
            bad_annotations.append(f'{gene}: {annotation_counts.get(gene, 0)} in the file, {live} in the index')
    run.es_op('sample_lookups', index=genes_index, count=len(term_counts) * 2)
    sampled = len(term_counts)
    checks.add(genes_index, f'Sampled genes match ({sampled})', sampled, sampled - len(bad_genes),
               detail='; '.join(bad_genes[:LISTED]) or None)
    checks.add(annotations_index, f"Sampled genes' annotation counts match ({sampled})", sampled,
               sampled - len(bad_annotations), detail='; '.join(bad_annotations[:LISTED]) or None)


def verify(annotations_file: Any, genes_file: Any, prefix: str, sample_size: int = SAMPLE_SIZE,
           run=NULL_RUN) -> Tuple[Checks, dict]:
    """Run every check. Returns the checks and the counters for the build record."""
    checks = Checks()
    counters: Dict[str, int] = {}
    annotations_index = index_name(TableAggType.ANNOTATIONS.value, prefix)
    genes_index = index_name(TableAggType.GENES.value, prefix)

    with run.phase('cluster'):
        try:
            info = es.info()
        except Exception as e:
            checks.add(None, 'Elasticsearch answers', True, False, detail=str(e))
            return checks, counters
        version = (info.get('version') or {}).get('number')
        run.es_server({'name': info.get('name'), 'cluster': info.get('cluster_name'), 'version': version})
        checks.add(None, 'Elasticsearch answers', True, True, detail=f'version {version}')

    with run.phase('files'):
        genes_expected, term_counts = read_genes(genes_file, sample_size)
        annotations_expected, annotation_counts = count_annotations(annotations_file, set(term_counts))
        counters.update(annotations_expected=annotations_expected, genes_expected=genes_expected)

    window = index_es_window(prefix)
    with run.phase('annotations'):
        live = check_index(checks, run, TableAggType.ANNOTATIONS.value, annotations_index,
                           annotations_expected, window)
        if live is not None:
            counters['annotations_in_index'] = live
    with run.phase('genes'):
        live = check_index(checks, run, TableAggType.GENES.value, genes_index, genes_expected, window)
        if live is not None:
            counters['genes_in_index'] = live
    if 'annotations_in_index' in counters and 'genes_in_index' in counters and term_counts:
        with run.phase('samples'):
            check_samples(checks, run, genes_index, annotations_index, term_counts, annotation_counts)

    counters['checks'] = sum(1 for row in checks.rows if row['ok'] is not None)
    counters['checks_failed'] = len(checks.failed)
    return checks, counters


def main() -> None:
    args = parse_arguments()
    run = current_run()
    run.set_config(vars(args), dataset=args.index_prefix or None)

    checks, counters = verify(args.annotations_file, args.genes_file, args.index_prefix, args.sample, run)

    run.set_counters(counters)
    by_index: Dict[str, int] = {}
    for row in checks.failed:
        by_index[row['index'] or 'cluster'] = by_index.get(row['index'] or 'cluster', 0) + 1
    run.set_breakdown('checks_failed', by_index)
    run.section(
        'verification',
        'Elasticsearch check',
        headline={
            'Checks': counters['checks'],
            'Failed': counters['checks_failed'],
            **({'Annotations in index': counters['annotations_in_index']} if 'annotations_in_index' in counters else {}),
            **({'Genes in index': counters['genes_in_index']} if 'genes_in_index' in counters else {}),
        },
        tables=[{
            'id': 'checks',
            'title': 'Checks',
            'columns': [{'key': 'index', 'label': 'Index'}, {'key': 'check', 'label': 'Check'},
                        {'key': 'expected', 'label': 'Expected'}, {'key': 'actual', 'label': 'Actual'},
                        {'key': 'ok', 'label': 'OK'}, {'key': 'detail', 'label': 'Detail'}],
            'rows': checks.rows,
        }],
    )
    for row in checks.failed:
        run.log('error', f"{row['index'] or 'cluster'}: {row['check']}: expected {row['expected']}, got {row['actual']}",
                logger='verify_es')

    print(f"{counters['checks'] - counters['checks_failed']} of {counters['checks']} checks passed")
    if checks.failed and args.strict:
        sys.exit(f"{len(checks.failed)} Elasticsearch checks failed")


if __name__ == '__main__':
    with record_run(step='verify'):
        main()
