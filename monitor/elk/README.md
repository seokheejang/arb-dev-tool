# elk

## run

```bash
docker compose up
```

## index optimize

```bash
docker cp ./bin/optimize_index.sh elasticsearch:/usr/share/elasticsearch/optimize_index.sh

docker exec -it elasticsearch /bin/bash /usr/share/elasticsearch/optimize_index.sh
```
