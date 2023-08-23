from src.config.es import es
import logging

annotations_dir = ''
logging.basicConfig(
    handlers=[logging.FileHandler('logfile.log', 'w', 'utf-8')],
    format='%(levelname)s: %(message)s',
    datefmt='%m-%d %H:%M',
    level=logging.INFO
)


def main():
    add_template()


def add_template():

    template = {
        "index_patterns": [
            "pango-*"
        ],
        "settings": {
            "number_of_shards": 1,
            "number_of_replicas": 0,
            "analysis": {
                "analyzer": {
                    "autocomplete": {
                        "tokenizer": "autocomplete",
                        "filter": [
                            "lowercase",
                            "asciifolding"
                        ]
                    },
                    "autocomplete_search": {
                        "tokenizer": "lowercase",
                        "filter": [
                            "asciifolding"
                        ]
                    }
                },
                "tokenizer": {
                    "autocomplete": {
                        "type": "edge_ngram",
                        "min_gram": 2,
                        "max_gram": 10,
                        "token_chars": [
                            "letter"
                        ]
                    }
                }
            }
        },
        "mappings": {
            "properties": {
                "name_suggest": {
                    "type": "completion"
                },
            }
        }
    }

    es.indices.put_template(name='pango_keyword_template', body=template)


if __name__ == "__main__":
    main()
