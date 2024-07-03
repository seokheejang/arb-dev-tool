#!/bin/bash

set -e

ENV_FILE=".config"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' $ENV_FILE | xargs)
else
  echo "$ENV_FILE not find file."
  exit 1
fi

SCRIPT_DIR=$(readlink -f $(dirname "$0"))
CUR_DIR=$(basename "$SCRIPT_DIR")
EXEC_NPM=$(which npm)

press_enter()
{
  echo
  read -p "Next Check. Press Enter..."
  echo
}

check_list=(func_1 func_2 func_3)

func_1()
{
  echo == Test 1 : Curl JSON-RPC
JSON_DATA=$(cat <<EOF
{
  "jsonrpc":"2.0",
  "method":"eth_getBalance",
  "params":["0x940e3cb4F37ae0259499E71F3A558b5De0471fa0", "latest"],
  "id":1
}
EOF
)
  curl -s -X POST -H "Content-Type: application/json" --data "${JSON_DATA}" ${ETH_HTTP_URL}
}

func_2()
{
  echo == Test 2 : TS
  $EXEC_NPM --prefix $SCRIPT_DIR/ts run test
}

func_3()
{
  echo == test 3 : C

}




echo == Start
for func in "${check_list[@]}"; do
  $func
  press_enter
done
echo == Finish