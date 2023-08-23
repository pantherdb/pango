curl  -X PUT http://localhost:9200/pango-annotations/_mapping \
-H "Content-Type: application/json" \
--data '
{
    "properties": {
        "keyword": {
            "type": "keyword"
        },
        "list_rowuid": {
            "type": "long"
        },
        "list_type_sid": {
            "type": "long"
        }
    }
}'
