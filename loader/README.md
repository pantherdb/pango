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

install requirements.tx
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
python3 -m src.get_articles -a ./data/test_data/sample_human_iba_annotations.json -o /download/articles.json
```

## Pre-process Annotations data before indexing to Elasticsearch

This will :

- Replace term ids with term metadata
- Gene Ids with gene Metadata
- Pmids with article metadata
- determine if an annotation wis direct or homology
- ...


python3 -m src.clean_annotations 
  -a ANNOTATIONS_FP     Annotations Json
  -t TERMS_FP           Terms Json
  -art ARTICLES_FP      Articles Json
  -g GENES_FP           Genes Json
  -o CLEAN_ANNOTATIONS_FP
                        Output of Clean Annotation


## Creating Index

src/index_es.py will take 1 argument
  -a ANNOTATIONS_FP  processed human iba annotations.json filepath

```bash
python3 -m src.index_es -a $clean_annotations
```
