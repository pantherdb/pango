host="http://localhost:9200"

curl -XPUT -H "Content-Type: application/json" $host/_cluster/settings -d '{ "transient": { "cluster.routing.allocation.disk.threshold_enabled": false } }'
curl -XPUT -H "Content-Type: application/json" $host/_all/_settings -d '{"index.blocks.read_only_allow_delete": null}'

curl -X PUT $host/pango-annotations -H 'Content-Type: application/json' -d'
{
  "settings": {
    "number_of_shards": 2
  }
}
'