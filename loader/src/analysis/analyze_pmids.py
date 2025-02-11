import argparse
import json

def get_unique_pmid_count(data_array: list) -> int:
   unique_pmids = set()
   for data in data_array:
      for evidence in data['evidence']:
        unique_pmids.update(ref.strip() for ref in evidence['references'] if ref.strip().startswith("PMID"))
    
   return len(unique_pmids)

def main():
   parser = argparse.ArgumentParser()
   parser.add_argument('json_file')
   args = parser.parse_args()    
   
   with open(args.json_file, 'r') as f:
       data = json.load(f)
   print(get_unique_pmid_count(data))
       
if __name__ == "__main__":
   main()