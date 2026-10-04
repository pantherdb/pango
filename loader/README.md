# Elasticsearch loader for PAN-GO Humana Functionome site

Make sure Docker is installed

## Start Elasticsearch and Kibana using Docker Compose

```
docker-compose up -d 
```

Elasticsearch node will startup and you can reach it at
http://localhost:9200/ and Kibana should be running at http://localhost:5601.

To shut down Elasticsearch and Kibana run:

```bash
docker-compose down
```

## Setup

Install [uv](https://docs.astral.sh/uv/getting-started/installation/), then create `.venv` with
Python 3.13 (pinned in `.python-version`) and the locked dependencies:

```bash
uv sync
```

Run the commands below through uv (`uv run python -m src...`, `uv run bash scripts/all.sh ...`)
or with `.venv` activated.

Add .env as given in shown in .env-example

```bash
cp .env-example .env
```

## Getting Articles Metadata from PubMed

First step is to get the unique PMIDs in the human_iba_annotations.json file and call NCBI eutils api to get the article metadata we need

```JavaScript
{
  pmid: string
  title: string
  authors: string[]
}
```

Note that the NCBI eUtils API has restrictions for frequency and timing of the Requests. More on https://www.ncbi.nlm.nih.gov/books/NBK25497/ . Therefore, this code will take few minutes as it sleeps and sends 100 PMIDs at a time


get_articles.py will take 2 arguments
  -a ANNOTATIONS_FP  human iba annotations.json filepath
  -o OUT_FP          output filepath articles.json filepath

ex

```bash
uv run python -m src.get_articles -a ./data/test_data/sample_human_iba_annotations.json -o /download/articles.json
```

## Pre-process Annotations data before indexing to Elasticsearch

This will :

- Replace term ids with term metadata
- Gene Ids with gene Metadata
- Pmids with article metadata
- determine if an annotation wis direct or homology
- ...


uv run python -m src.clean_annotations 
  -a ANNOTATIONS_FP     Annotations Json
  -t TERMS_FP           Terms Json
  -art ARTICLES_FP      Articles Json
  -g GENES_FP           Genes Json
  -o CLEAN_ANNOTATIONS_FP
                        Output of Clean Annotation


## Creating Index

src/index_es.py takes the clean annotations and genes and an index prefix (the dataset name):

```bash
uv run python -m src.index_es -a $clean_annotations -g $clean_genes -p pango-2
```

Every document is sent. If any fail to load, their errors are logged and the script exits 1:
until 2026-10 the first failed chunk stopped the load and the script still exited 0.

## Build records and the dashboard

`scripts/all.sh` records each build as it runs into `builds/` (gitignored): every step's timings,
the inputs with checksums, data figures and consistency checks (`src/data_report.py`), NCBI calls,
Elasticsearch operations, and a check of the live indexes after loading (`src/verify_es.py`).
`../build-dashboard/` shows them. Name a build with `PANGO_BUILD_LABEL`; turn recording off with
`PANGO_RECORD=0`. The format is [docs/build-record.md](docs/build-record.md).

To compare a first new build with outputs made before recording existed, report on them once:

```bash
uv run python -m src.data_report -i downloads/input/pango-2 -o downloads/output/pango-2 -art downloads/clean-articles.json --backfill
```
