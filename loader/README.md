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

```
cp .env-example .env
```

## Creating Index

An example keyword file will is located in data/keyword_search_list_links.csv

To run create-index.py to create index called panther-annotations

## ElasticSearch Wrapper API

You don't wanna expose elasticsearch to the public. The flask api will talk to the es.

run app.py to get the services running

Services will run on http://localhost:5006

Example 

```
curl -X GET http://localhost:5006/keywords
```

To get a certain keyword by keyyword_id

```
curl -X GET http://localhost:5006/keyword?q=157082394
```

example query is in models/panther_keyword.py


## Deleting Index

To start over, use the 
```
sh delete-index.sh
```