import time
from os import path as ospath
import json
import argparse
import pandas as pd
from sys import path
from src.config.base import file_path


def main():
    parser = parse_arguments()
    terms_file =  parser.terms_fp
    out_file =  parser.out_fp

    load_terms(terms_file, out_file)


def parse_arguments():
    parser = argparse.ArgumentParser(description='Loads terms',
                                     epilog='It works!')
    parser.add_argument('-t', dest='terms_fp', required=True,
                        type=file_path, help='Term Ids and labels file')

    parser.add_argument('-o', dest='out_fp', required=True,
                         help='Cleaned Term Ids and labels file')

    return parser.parse_args()


def load_terms(fp: path, out_fp: path):

    start_time = time.time()

    df = pd.read_json(fp)
    df = df.rename(columns={'ID': 'id', 'LABEL': 'label', 'hasOBONamespace':'aspect'})
    json_chunk = df.to_json(orient="records", default_handler=None)
    json_str = json.loads(json_chunk)

    write_to_json(json_str, ospath.join(out_fp))

    print( f" processed. Total time taken {time.time() - start_time}s")


def write_to_json(json_data, output_file):
    with open(output_file, 'w', encoding='utf-8') as outfile:
        json.dump(json_data, outfile,  ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()


# python3 -m src.clean_terms  -t ./data/terms.json -o ./data/clean-terms.json