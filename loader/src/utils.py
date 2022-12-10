import json

def write_to_json(json_data, output_file, indent=None, cls=None):
    with open(output_file, 'w', encoding='utf-8') as outfile:
        json.dump(json_data, outfile, cls=cls, ensure_ascii=False, indent=indent)

def load_json(filepath):
    with open(filepath, encoding='utf-8') as f:
        return json.load(f)

        
def get_pd_row(df, k):
    return dict(df.loc[k].dropna())

def get_pd_row_key(df, k):
    try:
        return dict(df.loc[k].dropna())
    except KeyError:
        return None

