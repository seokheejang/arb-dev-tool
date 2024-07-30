#!/bin/bash

# Elasticsearch URL
ELASTICSEARCH_URL="http://localhost:9200"

# Index 이름을 가져옵니다.
INDEX_LIST=$(curl -s "$ELASTICSEARCH_URL/_cat/indices?h=index" | grep -v '^\.geoip_databases$')

# 인덱스마다 forcemerge를 수행합니다.
for INDEX in $INDEX_LIST; do
  echo "Optimizing index: $INDEX"
  curl -X POST "$ELASTICSEARCH_URL/$INDEX/_forcemerge?max_num_segments=1"
done
