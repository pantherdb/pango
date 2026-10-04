"""Data facts about one dataset, computed from its input and output files.

A step in all.sh (after generate_gene_annotations, so a build whose indexing fails
still has its report) and a standalone CLI:

    python -m src.data_report -i <dataset input dir> -o <dataset output dir> [-art <articles json>]

It writes nothing but its build record: counters the dashboard compares between builds,
breakdowns it charts, and report sections it shows. The 400 MB annotation outputs are
streamed with ijson, never loaded whole.

With --backfill a report over outputs made before build records existed becomes a build
of its own, dated by the outputs' modification time, so the next build has something to
be compared with.
"""

import argparse
import heapq
import json
import os
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional

import ijson

from src.build_record import NULL_RUN, current_run, file_fingerprint, record_run
from src.build_record.paths import iso
from src.config.base import dir_path, file_path

UNKNOWN_TERMS = {'UNKNOWN:0001', 'UNKNOWN:0002', 'UNKNOWN:0003'}
TOP = 25        # rows in a "top" table
LISTED = 200    # rows in a list of problems
NO_GROUP = 'NO GROUP'
PROGRESS_EVERY = 1000

INPUT_FILES = {
    'terms': 'full_go_annotated.json',
    'annotations': 'human_iba_annotations.json',
    'genes': 'human_iba_gene_info.json',
    'taxon': 'taxon_lkp.json',
    'hierarchy': 'go_hierarchy.json',
}
OUTPUT_FILES = {
    'clean_annotations': 'human_iba_annotations_clean.json',
    'clean_genes': 'human_iba_genes_clean.json',
}

# Histogram buckets as (label, low, high); high None is open-ended.
TERMS_PER_GENE = [('1', 1, 1), ('2-5', 2, 5), ('6-10', 6, 10), ('11-20', 11, 20),
                  ('21-50', 21, 50), ('51-100', 51, 100), ('101+', 101, None)]
EVIDENCE_PER_ANNOTATION = [('0', 0, 0), ('1', 1, 1), ('2', 2, 2), ('3', 3, 3), ('4-5', 4, 5),
                           ('6-10', 6, 10), ('11+', 11, None)]

NUMBER = 'number'

# Always written, 0 included, so builds compare figure by figure. Counters that need an
# input the run may not have (the articles file) are left out when it's missing:
# absent means "not checked", never 0.
REPORT_COUNTERS = (
    'input_terms', 'input_goslim_terms', 'input_genes', 'input_genes_duplicated', 'input_taxa',
    'input_hierarchy_edges', 'input_annotations', 'evidence', 'references', 'references_non_pmid',
    'with_genes', 'with_genes_unresolved', 'groups', 'annotations', 'annotations_known_term',
    'annotations_unknown_term', 'annotations_gene_unresolved', 'annotations_without_symbol',
    'references_null', 'genes_annotated', 'go_terms', 'genes', 'genes_named', 'genes_unnamed',
    'genes_with_unknown_terms', 'gene_terms', 'slim_terms', 'consistency_checks',
    'consistency_failed',
)


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Data facts about one dataset, for its build record')
    parser.add_argument('-i', dest='input_dir', required=True, type=dir_path,
                        help='The dataset input folder (a folder under all.sh -i)')
    parser.add_argument('-o', dest='output_dir', required=True, type=dir_path,
                        help='The dataset output folder, with the clean annotations and genes')
    parser.add_argument('-art', dest='articles_fp', type=file_path,
                        help='The articles JSON (all.sh -a); without it PMIDs are not checked')
    parser.add_argument('--dataset', help='Dataset id; default PANGO_DATASET, else the input folder name')
    parser.add_argument('--backfill', action='store_true',
                        help='A report over existing outputs: its own build, dated by the outputs')
    return parser.parse_args()


def load(path: Any) -> Any:
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def stream(path: Path, run=NULL_RUN, label: Optional[str] = None) -> Iterator[dict]:
    """The items of a top-level JSON array, one at a time, reporting progress by bytes."""
    if label:
        run.progress(0, path.stat().st_size, label=label, unit='bytes')
    with open(path, 'rb') as f:
        for count, item in enumerate(ijson.items(f, 'item', use_float=True), 1):
            yield item
            if label and count % PROGRESS_EVERY == 0:
                run.progress(f.tell())
        if label:
            run.progress(f.tell())


def bucket(value: int, buckets: list) -> str:
    for label, low, high in buckets:
        if value >= low and (high is None or value <= high):
            return label
    return str(value)


def histogram(counts: Counter, buckets: list) -> Dict[str, int]:
    """Every bucket, in order, zeros included, so builds line up."""
    return {label: counts.get(label, 0) for label, _, _ in buckets}


def evidence_groups(evidence: dict) -> Iterator[str]:
    """Contributing groups, counted as src/analysis/analyze_groups.py counts them: an entry
    holding several groups is split on commas, and a blank one is NO GROUP."""
    groups = evidence.get('groups', [''])
    for group in groups if groups is not None else ['']:
        for part in str(group).split(','):
            yield part.strip() or NO_GROUP


def table(table_id: str, title: str, columns: list, rows: list,
          total_rows: Optional[int] = None) -> dict:
    return {
        'id': table_id,
        'title': title,
        'columns': [{'key': key, 'label': label, **({'kind': kind} if kind else {})}
                    for key, label, kind in columns],
        'rows': rows,
        'total_rows': len(rows) if total_rows is None else total_rows,
    }


def counted_rows(counts: Dict[str, int], key: str, value: str) -> List[dict]:
    return [{key: name, value: n} for name, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))]


def outputs_modified_at(output_dir: Any) -> Optional[str]:
    """When the outputs were last written: the date a backfilled report describes."""
    times = [(Path(output_dir) / name).stat().st_mtime
             for name in OUTPUT_FILES.values() if (Path(output_dir) / name).is_file()]
    return iso(datetime.fromtimestamp(max(times), timezone.utc)) if times else None


def build_report(input_dir: Any, output_dir: Any, articles_fp: Optional[Any] = None,
                 run=NULL_RUN) -> dict:
    """Counters, breakdowns and report sections for one dataset."""
    inputs = {role: Path(input_dir) / name for role, name in INPUT_FILES.items()}
    outputs = {role: Path(output_dir) / name for role, name in OUTPUT_FILES.items()}
    c: Counter = Counter({name: 0 for name in REPORT_COUNTERS})
    breakdowns: Dict[str, Dict[str, int]] = {}

    with run.phase('inputs'):
        terms = load(inputs['terms'])
        c['input_terms'] = len(terms)
        c['input_goslim_terms'] = sum(1 for term in terms if term.get('is_goslim'))
        gene_counts = Counter(gene.get('gene') for gene in load(inputs['genes']))
        gene_ids = set(gene_counts)
        c['input_genes'] = sum(gene_counts.values())
        c['input_genes_duplicated'] = sum(1 for n in gene_counts.values() if n > 1)
        c['input_taxa'] = len(load(inputs['taxon']))
        c['input_hierarchy_edges'] = len(load(inputs['hierarchy']))
        pmids = None
        if articles_fp:
            pmids = {article.get('pmid') for article in load(articles_fp)}
            c['input_articles'] = len(pmids)
        files = [file_fingerprint(path, role=role) for role, path in inputs.items()]
        if articles_fp:
            files.append(file_fingerprint(articles_fp, role='articles'))
        # The outputs' checksums are in clean_annotations' and generate_gene_annotations' records.
        files += [file_fingerprint(path, role=role, sha256=False) for role, path in outputs.items()]

    with run.phase('evidence'):
        references, with_genes = set(), set()
        evidence_by_group: Counter = Counter()
        annotations_by_group: Counter = Counter()
        for record in stream(inputs['annotations'], run, 'annotations in'):
            c['input_annotations'] += 1
            if record.get('gene') not in gene_ids:
                c['annotations_gene_unresolved'] += 1
            groups = set()
            for evidence in record.get('evidence') or []:
                c['evidence'] += 1
                references.update(evidence.get('references') or [])
                if evidence.get('with_gene_id'):
                    with_genes.add(evidence['with_gene_id'])
                for group in evidence_groups(evidence):
                    evidence_by_group[group] += 1
                    groups.add(group)
            annotations_by_group.update(groups)
        c['references'] = len(references)
        c['references_non_pmid'] = sum(1 for ref in references if not str(ref).startswith('PMID:'))
        unresolved_refs = None
        if pmids is not None:
            unresolved_refs = sorted(ref for ref in references
                                     if str(ref).startswith('PMID:') and ref not in pmids)
            c['references_unresolved'] = len(unresolved_refs)
        unresolved_with = sorted(with_genes - gene_ids)
        c['with_genes'] = len(with_genes)
        c['with_genes_unresolved'] = len(unresolved_with)
        c['groups'] = len(evidence_by_group)

    with run.phase('annotations'):
        aspects, evidence_types, term_types = Counter(), Counter(), Counter()
        evidence_sizes: Counter = Counter()
        genes_annotated = set()
        term_annotations: Counter = Counter()
        term_info: Dict[str, tuple] = {}
        with_genes_by_taxon = defaultdict(set)
        annotations_taxon_type = None
        for record in stream(outputs['clean_annotations'], run, 'annotations'):
            c['annotations'] += 1
            aspects[record.get('aspect') or 'none'] += 1
            evidence_types[record.get('evidence_type') or 'none'] += 1
            term_types[record.get('term_type') or 'none'] += 1
            genes_annotated.add(record.get('gene'))
            if record.get('gene_symbol') is None:
                c['annotations_without_symbol'] += 1
            term = record.get('term') or {}
            if record.get('term_type') == 'unknown':
                c['annotations_unknown_term'] += 1
            elif term.get('id'):
                c['annotations_known_term'] += 1
                term_annotations[term['id']] += 1
                term_info.setdefault(term['id'], (term.get('label'), term.get('aspect')))
            evidence = record.get('evidence') or []
            evidence_sizes[bucket(len(evidence), EVIDENCE_PER_ANNOTATION)] += 1
            for item in evidence:
                c['references_null'] += sum(1 for ref in item.get('references') or [] if ref is None)
                with_gene = item.get('with_gene_id')
                if isinstance(with_gene, dict) and with_gene.get('gene'):
                    with_genes_by_taxon[with_gene.get('taxon_label') or 'unknown'].add(with_gene['gene'])
            if annotations_taxon_type is None and 'taxon_id' in record:
                annotations_taxon_type = type(record['taxon_id']).__name__
        c['genes_annotated'] = len(genes_annotated)
        c['go_terms'] = len(term_annotations)

    with run.phase('genes'):
        terms_per_gene: Counter = Counter()
        slim_genes: Counter = Counter()
        slim_info: Dict[str, tuple] = {}
        gene_sizes = []
        unknown_genes = []
        genes_taxon_type = None
        for record in stream(outputs['clean_genes'], run, 'genes'):
            c['genes'] += 1
            c['genes_named' if record.get('named_gene') else 'genes_unnamed'] += 1
            terms = record.get('terms') or []
            count = record.get('term_count', len(terms))
            c['gene_terms'] += count
            terms_per_gene[bucket(count, TERMS_PER_GENE)] += 1
            gene_sizes.append((count, record.get('gene'), record.get('gene_symbol'), record.get('gene_name')))
            unknown = [term.get('id') for term in terms if term.get('id') in UNKNOWN_TERMS]
            if unknown:
                c['genes_with_unknown_terms'] += 1
                if len(unknown_genes) < LISTED:
                    unknown_genes.append({'gene': record.get('gene'), 'symbol': record.get('gene_symbol'),
                                          'unknown_terms': ', '.join(unknown)})
            for slim in record.get('slim_terms') or []:
                if slim.get('id'):
                    slim_genes[slim['id']] += 1
                    slim_info.setdefault(slim['id'], (slim.get('label'), slim.get('aspect')))
            if genes_taxon_type is None and 'taxon_id' in record:
                genes_taxon_type = type(record['taxon_id']).__name__
        c['slim_terms'] = len(slim_genes)

    # -- checks between the files ----------------------------------------------------
    checks = [
        ('Every input annotation is in the clean output, once', c['input_annotations'], c['annotations']),
        ('Every annotated gene has a gene record', c['genes_annotated'], c['genes']),
        ('Gene ids are unique in the gene info', 0, c['input_genes_duplicated']),
        ('Every annotated gene is in the gene info', 0, c['annotations_gene_unresolved']),
        ('Every with-gene is in the gene info', 0, c['with_genes_unresolved']),
    ]
    check_rows = [{'check': name, 'expected': expected, 'actual': actual, 'ok': expected == actual}
                  for name, expected, actual in checks]
    c['consistency_checks'] = len(check_rows)
    c['consistency_failed'] = sum(1 for row in check_rows if not row['ok'])
    taxon_note = None
    if annotations_taxon_type and genes_taxon_type:
        c['taxon_id_types_differ'] = int(annotations_taxon_type != genes_taxon_type)
        if c['taxon_id_types_differ']:
            taxon_note = (f'taxon_id is a {annotations_taxon_type} in the annotations and a '
                          f'{genes_taxon_type} in the genes (pd.read_json re-infers it), a known issue.')

    breakdowns['annotations_by_aspect'] = dict(aspects)
    breakdowns['annotations_by_evidence_type'] = dict(evidence_types)
    breakdowns['annotations_by_term_type'] = dict(term_types)
    breakdowns['annotations_by_evidence'] = histogram(evidence_sizes, EVIDENCE_PER_ANNOTATION)
    breakdowns['evidence_by_group'] = dict(evidence_by_group)
    breakdowns['annotations_by_group'] = dict(annotations_by_group)
    breakdowns['with_genes_by_taxon'] = {taxon: len(genes) for taxon, genes in with_genes_by_taxon.items()}
    breakdowns['genes_by_terms'] = histogram(terms_per_gene, TERMS_PER_GENE)

    top_terms = [{'id': term_id, 'label': term_info[term_id][0], 'aspect': term_info[term_id][1],
                  'annotations': n} for term_id, n in term_annotations.most_common(TOP)]
    top_slims = [{'id': slim_id, 'label': slim_info[slim_id][0], 'aspect': slim_info[slim_id][1],
                  'genes': n} for slim_id, n in slim_genes.most_common(TOP)]
    top_genes = [{'gene': gene, 'symbol': symbol, 'name': name, 'terms': count}
                 for count, gene, symbol, name in heapq.nlargest(TOP, gene_sizes, key=lambda g: (g[0], g[1] or ''))]
    mean_terms = round(c['gene_terms'] / c['genes'], 1) if c['genes'] else 0

    sections = [
        {
            'section_id': 'inputs',
            'title': 'Inputs',
            'headline': {'GO terms': c['input_terms'], 'GO slim terms': c['input_goslim_terms'],
                         'Genes in gene info': c['input_genes'], 'Taxa': c['input_taxa'],
                         'Hierarchy edges': c['input_hierarchy_edges'],
                         'Annotations in': c['input_annotations'],
                         **({'Articles': c['input_articles']} if articles_fp else {})},
            'tables': [table('files', 'Files', [('role', 'Role', None), ('path', 'File', None),
                                                ('bytes', 'Bytes', NUMBER),
                                                ('modified_at', 'Modified', None),
                                                ('sha256', 'SHA-256', None)],
                             [{**f, 'sha256': (f['sha256'] or '')[:12] or None} for f in files])],
        },
        {
            'section_id': 'annotations',
            'title': 'Annotations',
            'headline': {'Annotations': c['annotations'], 'Genes annotated': c['genes_annotated'],
                         'GO terms': c['go_terms'], 'Unknown-term annotations': c['annotations_unknown_term'],
                         'Genes not in gene info': c['annotations_gene_unresolved']},
            'tables': [
                table('by_aspect', 'By aspect', [('aspect', 'Aspect', None), ('annotations', 'Annotations', NUMBER)],
                      counted_rows(aspects, 'aspect', 'annotations')),
                table('by_evidence_type', 'By evidence type',
                      [('evidence_type', 'Evidence type', None), ('annotations', 'Annotations', NUMBER)],
                      counted_rows(evidence_types, 'evidence_type', 'annotations')),
                table('top_terms', f'Top {TOP} GO terms',
                      [('id', 'Term', None), ('label', 'Label', None), ('aspect', 'Aspect', None),
                       ('annotations', 'Annotations', NUMBER)], top_terms, len(term_annotations)),
            ],
        },
        {
            'section_id': 'evidence',
            'title': 'Evidence and references',
            'headline': {'Evidence lines': c['evidence'], 'References': c['references'],
                         **({'PMIDs without an article': c['references_unresolved']} if pmids is not None else {}),
                         'Non-PMID references': c['references_non_pmid'], 'With-genes': c['with_genes'],
                         'With-genes not in gene info': c['with_genes_unresolved'],
                         'Contributing groups': c['groups']},
            'tables': [
                table('groups', 'Contributing groups',
                      [('group', 'Group', None), ('evidence', 'Evidence lines', NUMBER),
                       ('annotations', 'Annotations', NUMBER)],
                      [{'group': g, 'evidence': n, 'annotations': annotations_by_group[g]}
                       for g, n in sorted(evidence_by_group.items(), key=lambda kv: (-kv[1], kv[0]))]),
                table('with_gene_taxa', 'With-genes by taxon',
                      [('taxon', 'Taxon', None), ('with_genes', 'With-genes', NUMBER)],
                      counted_rows(breakdowns['with_genes_by_taxon'], 'taxon', 'with_genes')),
                table('evidence_per_annotation', 'Evidence lines per annotation',
                      [('evidence', 'Evidence lines', None), ('annotations', 'Annotations', NUMBER)],
                      [{'evidence': k, 'annotations': v} for k, v in breakdowns['annotations_by_evidence'].items()]),
                *([table('unresolved_pmids', 'PMIDs without an article',
                         [('reference', 'Reference', None)],
                         [{'reference': ref} for ref in unresolved_refs[:LISTED]], len(unresolved_refs))]
                  if unresolved_refs else []),
                *([table('unresolved_with_genes', 'With-genes not in gene info',
                         [('gene', 'With-gene', None)],
                         [{'gene': gene} for gene in unresolved_with[:LISTED]], len(unresolved_with))]
                  if unresolved_with else []),
            ],
        },
        {
            'section_id': 'genes',
            'title': 'Genes',
            'headline': {'Genes': c['genes'], 'Named': c['genes_named'], 'Unnamed': c['genes_unnamed'],
                         'With unknown terms': c['genes_with_unknown_terms'],
                         'Terms per gene (mean)': mean_terms, 'Slim terms': c['slim_terms']},
            'tables': [
                table('terms_per_gene', 'Terms per gene',
                      [('terms', 'Terms', None), ('genes', 'Genes', NUMBER)],
                      [{'terms': k, 'genes': v} for k, v in breakdowns['genes_by_terms'].items()]),
                table('top_slim_terms', f'Top {TOP} slim terms by genes',
                      [('id', 'Slim term', None), ('label', 'Label', None), ('aspect', 'Aspect', None),
                       ('genes', 'Genes', NUMBER)], top_slims, len(slim_genes)),
                table('top_genes', f'Top {TOP} genes by terms',
                      [('gene', 'Gene', None), ('symbol', 'Symbol', None), ('name', 'Name', None),
                       ('terms', 'Terms', NUMBER)], top_genes, c['genes']),
                *([table('unknown_term_genes', 'Genes with unknown terms',
                         [('gene', 'Gene', None), ('symbol', 'Symbol', None),
                          ('unknown_terms', 'Unknown terms', None)],
                         unknown_genes, c['genes_with_unknown_terms'])] if unknown_genes else []),
            ],
        },
        {
            'section_id': 'consistency',
            'title': 'Consistency between the files',
            'headline': {'Checks': c['consistency_checks'], 'Failed': c['consistency_failed']},
            'tables': [table('checks', 'Checks', [('check', 'Check', None), ('expected', 'Expected', NUMBER),
                                                   ('actual', 'Actual', NUMBER), ('ok', 'OK', None)],
                             check_rows)],
            'text': taxon_note,
        },
    ]
    return {'counters': dict(c), 'breakdowns': breakdowns, 'sections': sections}


def main(args: Optional[argparse.Namespace] = None) -> None:
    args = args or parse_arguments()
    run = current_run()
    dataset = args.dataset or os.environ.get('PANGO_DATASET') or Path(args.input_dir).name
    run.set_config(vars(args), dataset=dataset)
    run.set_dataset_dirs(input_dir=str(args.input_dir), output_dir=str(args.output_dir))
    if args.backfill:
        as_of = outputs_modified_at(args.output_dir)
        if as_of:
            run.set_as_of(as_of)

    report = build_report(args.input_dir, args.output_dir, args.articles_fp, run)
    run.set_counters(report['counters'])
    for name, values in report['breakdowns'].items():
        run.set_breakdown(name, values)
    for section in report['sections']:
        run.section(section.pop('section_id'), section.pop('title'), **section)

    counters = report['counters']
    print(f"Report for {dataset}: {counters['annotations']:,} annotations, {counters['genes']:,} genes, "
          f"{counters['go_terms']:,} GO terms; {counters['consistency_failed']} of "
          f"{counters['consistency_checks']} consistency checks failed")


if __name__ == '__main__':
    arguments = parse_arguments()
    with record_run(step='report', build_script='backfill' if arguments.backfill else 'adhoc',
                    dataset=arguments.dataset or os.environ.get('PANGO_DATASET')
                    or Path(arguments.input_dir).name):
        main(arguments)
