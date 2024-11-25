import load_env
import time
import logging
from elasticsearch import helpers
import ijson
import argparse
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
    
    try:
        with open(j_file, 'r', encoding="utf8") as open_file:
            parser = ijson.parse(open_file)
            for value in ijson.items(parser, 'item'):
                yield value
                
    except Exception as e:
        logger.error(f"Error loading JSON file {j_file}: {str(e)}")
        raise
    
    finally:
        duration = time.time() - start_time
        logger.info(f"JSON loading took {duration:.2f} seconds")

def bulk_load(j_file: str, index_name: str) -> Tuple[int, list]:
    """
    Bulk load data into Elasticsearch index.
    
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
            request_timeout=200
        )
        logger.info(f"Successfully loaded {success} documents into {index_name}")
        return success, errors
    
    except helpers.BulkIndexError as e:
        logger.error(f"Bulk loading error for {index_name}: {str(e.errors)}")
        return 0, e.errors
    except Exception as e:
        logger.error(f"Unexpected error during bulk loading: {str(e)}")
        raise


def main() -> None:
    
    try:
        args = parse_arguments()
        
        # Create and load annotations index
        annotations_index = create_index(TableAggType.ANNOTATIONS.value, args.index_prefix)
    
        success, errors = bulk_load(args.annotations_file, annotations_index)
        if errors:
            logger.warning(f"Annotations loading had {len(errors)} errors")
        
        # Create and load genes index
        genes_index = create_index(TableAggType.GENES.value, args.index_prefix)
        
        success, errors = bulk_load(args.genes_file, genes_index)
        if errors:
            logger.warning(f"Genes loading had {len(errors)} errors")
            
    except Exception as e:
        logger.error(f"Fatal error in main execution: {str(e)}")
        raise

if __name__ == "__main__":
    main()