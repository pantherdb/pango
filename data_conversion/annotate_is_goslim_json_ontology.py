#!/usr/bin/python3

import argparse
import json


parser = argparse.ArgumentParser()
parser.add_argument('-g', '--goslim_term_list', help="Single-col file list of terms in goslim_generic")
parser.add_argument('-p', '--panther_slim_json')


if __name__ == "__main__":
    args = parser.parse_args()

    goslim_terms = set()
    with open(args.goslim_term_list) as gtl:
        for l in gtl.readlines():
            goslim_terms.add(l.rstrip())

    with open(args.panther_slim_json) as psj:
        panther_slim_terms = json.load(psj)

    annotated_panther_slim = []
    for t in panther_slim_terms:
        if "LABEL" not in t or "hasOBONamespace" not in t:
            continue
        if t["ID"] in goslim_terms:
            t["is_goslim"] = True
        else:
            t["is_goslim"] = False
        t["LABEL"] = t["LABEL"][0]
        t["hasOBONamespace"] = t["hasOBONamespace"][0]
        annotated_panther_slim.append(t)

    other_terms = [
        {
            "ID": "OTHER:0001",
            "LABEL": "Other molecular function",
            "hasOBONamespace": "molecular_function",
            "is_goslim": True
        },
        {
            "ID": "OTHER:0002",
            "LABEL": "Other biological process",
            "hasOBONamespace": "biological_process",
            "is_goslim": True
        },
        {
            "ID": "OTHER:0003",
            "LABEL": "Other cellular component",
            "hasOBONamespace": "cellular_component",
            "is_goslim": True
        },
    ]

    unknown_terms = [
        {
            "ID": "UNKNOWN:0001",
            "LABEL": "Unknown molecular function",
            "hasOBONamespace": "molecular_function",
            "is_goslim": False
        },
        {
            "ID": "UNKNOWN:0002",
            "LABEL": "Unknown biological process",
            "hasOBONamespace": "biological_process",
            "is_goslim": False
        },
        {
            "ID": "UNKNOWN:0003",
            "LABEL": "Unknown cellular component",
            "hasOBONamespace": "cellular_component",
            "is_goslim": False
        },
    ]

    annotated_panther_slim = annotated_panther_slim + other_terms + unknown_terms

    print(json.dumps(annotated_panther_slim, indent=4))