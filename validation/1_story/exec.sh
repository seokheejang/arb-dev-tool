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
  printf "\n"
  read -p "Next Check. Press Enter..."
  printf "\n"
}

hex2decimal()
{
  local hex_value=$1
  local decimal_value=$(printf "%d\n" "$hex_value")
  echo "$decimal_value"
}

check_list=(v1 v2 v3)

v1()
{
  printf "== Layer1 구축\n"
JSON_DATA_1=$(cat <<EOF
{
  "id":1,
  "jsonrpc":"2.0",
  "method":"eth_chainId",
  "params":[]
}
EOF
)
  v1_1_res=`curl -s -X POST -H "Content-Type: application/json" --data "${JSON_DATA_1}" ${ETH_HTTP_URL}`
  printf "==== node URL로 http 및 ws 접속이 되어야 한다.\n"
  printf "==== 예상 값 : 4693\n"
  printf "==== 결과 값 : %d\n" "$(echo $v1_1_res | jq -r .result)"

JSON_DATA_2=$(cat <<EOF
{
  "id":1,
  "jsonrpc":"2.0",
  "method":"eth_blockNumber",
  "params":[]
}
EOF
)
  v1_2_res_1=`curl -s -X POST -H "Content-Type: application/json" --data "${JSON_DATA_2}" ${ETH_HTTP_URL}`
  printf "==== node에서 new block 생성 진행되어야 한다.\n"
  printf "==== 예상 값 : 마지막 블록 생성 번호\n"
  printf "==== 결과 값 : %d\n" "$(echo $v1_2_res_1 | jq -r .result)"
  printf "==== ... 다음 블록 12초 대기\n"
  # sleep 12
  v1_2_res_2=`curl -s -X POST -H "Content-Type: application/json" --data "${JSON_DATA_2}" ${ETH_HTTP_URL}`
  last_blocknumer=$(echo $v1_2_res_2 | jq -r .result)
  printf "==== 결과 값 : %d\n" "$last_blocknumer"
  
JSON_DATA_3=$(cat <<EOF
{
  "id":1,
  "jsonrpc":"2.0",
  "method":"eth_getBlockByNumber",
  "params":["$last_blocknumer", false]
}
EOF
)
  sleep 1
  v1_3_res=`curl -s -X POST -H "Content-Type: application/json" --data "${JSON_DATA_3}" ${ETH_HTTP_URL}`
  difficulty=$(echo $v1_3_res | jq -r '.result.difficulty')
  printf "==== block 정보의 difficulty 값이 0임을 확인한다. (pos 합의)\n"
  printf "==== 예상 값 : 0\n"
  printf "==== 결과 값 : %d\n" "$difficulty"

  nonce=$(echo $v1_3_res | jq -r '.result.nonce')
  printf "==== block 정보의 nonce 값이 0x0000000000000000임을 확인한다. (pos 합의)\n"
  printf "==== 예상 값 : 0x0000000000000000\n"
  printf "==== 결과 값 : %s\n" "$nonce"

  #send Tx
}

v2()
{
  echo == Test 2 : TS
  # $EXEC_NPM --prefix $SCRIPT_DIR/ts run test
}

v3()
{
  echo == test 3 : C

}


echo == Start

for func in "${check_list[@]}"; do
  $func
  press_enter
done
sleep 1
echo == Finish