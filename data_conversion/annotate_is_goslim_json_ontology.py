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

    print(json.dumps(annotated_panther_slim, indent=4))