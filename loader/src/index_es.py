import load_env
import os
import sys
import time
import logging
from elasticsearch import helpers
import ijson
import argparse
from src.build_record import current_run, record_run
from src.config.es import es
from src.config.base import TableAggType, file_path
from src.create_index import create_index
from typing import Generator, Tuple, Any

# Configure logging
logging.basicConfig(
    handlers=[logging.FileHandler('logfile.log', 'w', 'utf-8')],
    format='%(asctime)s - %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    level=logging.INFO
)

logger = logging.getLogger(__name__)

# Every failed document is counted; this many are also logged one by one.
MAX_LOGGED_ERRORS = 20
# How often (in documents) load_json reports how far through its file it is.
PROGRESS_EVERY = 1000

def parse_arguments() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Load data into Elasticsearch indices')
    parser.add_argument(
        '-a',
        dest='annotations_file',
        required=True,
        type=file_path,
        help='Path to annotations JSON file'
    )
    parser.add_argument(
        '-g',
        dest='genes_file',
        required=True,
        type=file_path,
        help='Path to genes JSON file'
    )
    parser.add_argument(
        '-p',
        dest='index_prefix',
        default='',
        type=str,
        help='Prefix for index names (optional)'
    )

    return parser.parse_args()

def load_json(j_file: str) -> Generator[dict, None, None]:
    """
    Load and yield items from a JSON file using streaming parser.

    Args:
        j_file: Path to JSON file

    Yields:
        Dictionary containing each JSON item
    """
    start_time = time.time()
    run = current_run()

    try:
        # Binary mode: ijson reads bytes, and text mode is deprecated (it warns it will become an error).
        with open(j_file, 'rb') as open_file:
            for count, value in enumerate(ijson.items(open_file, 'item'), 1):
                yield value
                if count % PROGRESS_EVERY == 0:
                    run.progress(open_file.tell())
            run.progress(open_file.tell())

    except Exception as e:
        logger.error(f"Error loading JSON file {j_file}: {str(e)}")
        raise

    finally:
        duration = time.time() - start_time
        logger.info(f"JSON loading took {duration:.2f} seconds")

def bulk_load(j_file: str, index_name: str) -> Tuple[int, list]:
    """
    Bulk load data into Elasticsearch index.

    Every document is sent. With raise_on_error left at its default, the first chunk
    holding a failed document raised and the rest of the file was never sent.

    Args:
        j_file: Path to JSON file
        index_name: Name of the Elasticsearch index

    Returns:
        Tuple of (number of successful operations, list of errors)
    """
    try:
        success, errors = helpers.bulk(
            es,
            load_json(j_file),
            index=index_name,
            chunk_size=100,
            request_timeout=200,
            raise_on_error=False
        )
        logger.info(f"Successfully loaded {success} documents into {index_name}")
        if errors:
            logger.error(f"{len(errors)} documents failed to load into {index_name}")
        return success, errors

    except helpers.BulkIndexError as e:
        logger.error(f"Bulk loading error for {index_name}: {str(e.errors)}")
        return 0, e.errors
    except Exception as e:
        logger.error(f"Unexpected error during bulk loading: {str(e)}")
        raise


def describe_error(item: Any) -> str:
    """One failed document from helpers.bulk, in a line: its id, status and reason."""
    action = next(iter(item.values()), {}) if isinstance(item, dict) and item else {}
    action = action if isinstance(action, dict) else {}
    error = action.get('error')
    if isinstance(error, dict):
        reason = f"{error.get('type', 'error')}: {error.get('reason', '')}".rstrip(': ')
    else:
        reason = str(error) if error else 'error'
    return f"document {action.get('_id', '?')} (status {action.get('status', '?')}): {reason}"


def record_server(run) -> None:
    """The cluster this run writes to, for the build record."""
    if not run.enabled:
        return
    try:
        info = es.info()
        run.es_server({
            'name': info.get('name'),
            'cluster': info.get('cluster_name'),
            'version': (info.get('version') or {}).get('number'),
        })
    except Exception as e:
        logger.warning(f"Could not read the Elasticsearch server info: {e}")


def load_index(run, index_type: str, j_file: str, prefix: str, name: str) -> int:
    """Recreate one index and load a file into it. Returns how many documents failed."""
    with run.phase(index_type) as phase:
        started = time.perf_counter()
        index_name = create_index(index_type, prefix)
        run.es_op('recreate_index', index=index_name, duration_s=time.perf_counter() - started)

        run.progress(0, os.path.getsize(j_file), label=index_type, unit='bytes')
        started = time.perf_counter()
        success, errors = bulk_load(j_file, index_name)
        run.es_op('bulk', index=index_name, status='failed' if errors else 'ok', count=success,
                  errors=len(errors), duration_s=time.perf_counter() - started)
        phase.count('docs_indexed', success, by=index_type)
        phase.count('bulk_errors', len(errors), by=index_type)
        if errors:
            logger.warning(f"{name} loading had {len(errors)} errors")
            for item in errors[:MAX_LOGGED_ERRORS]:
                logger.error(f"{index_name}: {describe_error(item)}")
            phase.fail(f"{len(errors)} documents failed to load")
    return len(errors)


def main() -> None:
    run = current_run()

    try:
        args = parse_arguments()
        run.set_config(vars(args), dataset=args.index_prefix or None)
        record_server(run)

        # Create and load annotations index
        failed = load_index(run, TableAggType.ANNOTATIONS.value, args.annotations_file,
                            args.index_prefix, 'Annotations')

        # Create and load genes index
        failed += load_index(run, TableAggType.GENES.value, args.genes_file,
                             args.index_prefix, 'Genes')

    except Exception as e:
        logger.error(f"Fatal error in main execution: {str(e)}")
        raise

    if failed:
        # Before, a failed load still exited 0, and all.sh reported success.
        sys.exit(f"{failed} documents failed to load, so the indexes are incomplete; see logfile.log")

if __name__ == "__main__":
    with record_run(step='index_es'):
        main()
