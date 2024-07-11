URL=$1
METHOD=$2

curl ${URL} \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"method":"'${METHOD}'","params":[],"id":1,"jsonrpc":"2.0"}'
