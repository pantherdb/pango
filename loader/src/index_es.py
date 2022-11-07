import load_env
import time
from elasticsearch import helpers
import ijson
import argparse
from src.config.es import es
import logging

from src.config.base import TableAggType, file_path
from src.create_index import create_index

annotations_dir = ''
logging.basicConfig(
    handlers=[logging.FileHandler('logfile.log', 'w', 'utf-8')],
    format='%(levelname)s: %(message)s',
    datefmt='%m-%d %H:%M',
    level=logging.INFO
)

def main():
    parser = parse_arguments()
    ann_file = parser.annotations_file
    term_file = parser.terms_file
   
    annotations_index = create_index(TableAggType.ANNOTATION.value)
    terms_index = create_index(TableAggType.TERM.value)

    bulk_load(ann_file, annotations_index)    
    bulk_load(term_file, terms_index)


def parse_arguments():
    parser = argparse.ArgumentParser(description='Loads annotations',
                                     epilog='It works!')
    parser.add_argument('-a', dest='annotations_file', required=True,
                        type=file_path, help='Annotations Json')
    parser.add_argument('-t', dest='terms_file', required=True,
                        type=file_path, help='Cleaned terms file')

    return parser.parse_args()


def load_json(j_file):
    start_time = time.time()
    
    print("- %s seconds ---" % (time.time() - start_time))
    with open(j_file, 'r') as open_file:
        parser = ijson.parse(open_file)
        for value in ijson.items(parser, 'item'):
            yield value


def bulk_load(j_file, index_name):

    helpers.bulk(es, load_json(j_file), index=index_name,
                 chunk_size=10000, request_timeout=200)



if __name__ == "__main__":
    main()


# python3 -m src.index_es -a ./data/annotations.json -t ./data/clean-terms.json