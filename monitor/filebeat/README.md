# filebeat

## build

```bash
# .env 파일의 BUILD_ARGS에 명시했다면
./exec.sh build

# 컨테이너 이름들 직접 넘겨주기
./exec.sh build nw-node-build-script-l3node-1 nw-node-build-script-validation_node-1 nw-node-build-script-sequencer-1

# 모든 컨테이너 로그 볼륨들 가져오기
./exec.sh build --all
./exec.sh build -a
```

## run

```bash
./exec.sh up
```

## down & clean

```bash
./exec.sh down

# build로 생성된 compose 파일 삭제
./exec.sh clean
```
