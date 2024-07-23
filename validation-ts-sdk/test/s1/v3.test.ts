import {
  ENV,
  HttpProvider,
  TypeHttpProvider,
  Wallet,
  sleep,
  WsProvider,
  TypeWsProvider,
  ansi,
  parseCalldata,
  parseRollupData,
} from '@src/index';

describe('1_STORY', () => {
  let l2_ws_prov: TypeWsProvider;
  let l2_prov: TypeHttpProvider;
  let l3_prov: TypeHttpProvider;
  let dev_key: string;
  let devWallet: Wallet;

  beforeAll(async () => {
    dev_key = ENV.DEV_PRIV_KEY;
    l2_ws_prov = new WsProvider(ENV.L2_WS_URL).prov;
    l2_prov = new HttpProvider(ENV.L2_HTTP_URL).prov;
    l3_prov = new HttpProvider(ENV.L3_HTTP_URL).prov;
    devWallet = new Wallet(dev_key, l3_prov);
  });

  describe('Layer3 Sequencer Build (251)', () => {
    console.log(
      `${ansi.Yellow}조회 방법 - ethers.js(5.7.2) Http JsonRpcProvider로 api method 조회 (eth_chainId, eth_getBlock, eth_getTransaction...)${ansi.reset}`,
    );
    it('3.1 node URL로 http 및 ws 접속이 되어야 한다.', async () => {
      const l2ChainId = (await l3_prov.getNetwork()).chainId;
      console.log(
        `3.1 node URL로 http 및 ws 접속이 되어야 한다. \n  예상 결과 - L3 Chain ID: ${ENV.L3_CHAIN_ID} \n  실제 결과 - L3 Chain ID: ${ansi.Green}${l2ChainId}${ansi.reset}`,
      );
      expect(l2ChainId).toEqual(ENV.L3_CHAIN_ID);
    });

    it('3.2 node에서 new block 생성 진행되어야 한다.', async () => {
      const bn = await l3_prov.getBlockNumber();
      const bn_before = await l3_prov.getBlock(bn);
      const devAddr = devWallet.w.address;
      const sendTx = await devWallet.sendTransaction(devAddr, '0.01');
      const txRes = await sendTx.wait();
      const txHash = txRes.transactionHash;
      const bn_lastest = await l3_prov.getBlock(txRes.blockNumber);

      const sendTx2 = await devWallet.sendTransaction(devAddr, '0.01');
      const txRes2 = await sendTx2.wait();
      const txHash2 = txRes2.transactionHash;
      const bn_lastest2 = await l3_prov.getBlock(txRes2.blockNumber);
      console.log(
        `3.2 node에서 new block 생성 진행되어야 한다. 트랜잭션을 발생시키면 block이 약 0~1초 사이에 생성됨을 확인한다. \n  예상 결과 - 1개 블록간 0~1초 차이 \n  실제 결과 - \n    before  BlockNumber: ${bn_before?.number}, Timestamp: ${bn_before?.timestamp} \n    Tx 발생: ${txHash}, 적힌 블록: ${txRes.blockNumber}\n    ${ansi.Green}lastest BlockNumber: ${bn_lastest?.number}, Timestamp: ${bn_lastest?.timestamp}${ansi.reset}\n    Tx 발생: ${txHash2}, 적힌 블록: ${txRes2.blockNumber}\n    ${ansi.Blue}lastest BlockNumber: ${bn_lastest2?.number}, Timestamp: ${bn_lastest2?.timestamp}${ansi.reset}`,
      );
      expect(bn_lastest.number).toBeGreaterThan(bn_before.number);
    });

    it('3.3 node로 transaction 발행 시 block에 포함되어야 한다.', async () => {
      const devAddr = devWallet.w.address;
      const sendTx = await devWallet.sendTransaction(devAddr, '0.01');
      const txRes = await sendTx.wait();
      const txHash = txRes.transactionHash;
      const bn = txRes.blockNumber;
      const block = await l3_prov.getBlock(bn);
      console.log(
        `3.3 node로 transaction 발행 시 block에 포함되어야 한다. \n  예상 결과 - 발생 시킨 Tx Hash: ${txHash} \n  실제 결과 - ${bn} 블록에 포함된 Txs: ${ansi.Green}${block.transactions}${ansi.reset}`,
      );
      expect(block.transactions.includes(txHash)).toEqual(true);
    });

    it('3.4 롤업 트랜잭션이 정상적으로 L1에 보내짐을 확인해야 한다.', async () => {
      const devAddr = devWallet.w.address;
      const sendTx = await devWallet.sendTransaction(devAddr, '0.01');
      const l3TxRes = await sendTx.wait();
      const l3TxHash = l3TxRes.transactionHash;
      const l3BN = l3TxRes.blockNumber;
      let l2BN;
      let l2RollupTx;
      let findL3Tx;
      let rollupTx: any;
      let parsedL2CallData: any;
      let parsedL3CallData: any;
      let originL3tx;
      console.log(
        `3.4 롤업 확인을 위해 L3에서 트랜잭션을 발생: ${ansi.Yellow}${l3TxHash}${ansi.reset}`,
      );
      const blockPromise = new Promise((resolve, reject) => {
        l2_ws_prov.on('block', async (blockNumber: number) => {
          try {
            // blockNumber = 95941;
            const block = await l2_prov.getBlock(blockNumber);
            const txs = block.transactions;
            console.log(
              `Rollup Tx Searching ... L2 new block! ${blockNumber}, tx size: ${txs.length}`,
            );
            if (txs.length > 0) {
              for (const tx of txs) {
                rollupTx = await l2_prov.getTransaction(tx);
                if (rollupTx.data.startsWith('0x8f111f3c')) {
                  l2RollupTx = tx;
                  parsedL2CallData = await parseCalldata(rollupTx.data);
                  const callData = parsedL2CallData?.params['data(bytes)'];
                  parsedL3CallData = await parseRollupData(callData.substring(2));
                  for (const tx of parsedL3CallData) {
                    if (l3TxHash === tx.hash) {
                      originL3tx = tx;
                      l2BN = blockNumber;
                      findL3Tx = tx.hash;
                      resolve(true);
                    }
                  }
                }
              }
            }
          } catch (error) {
            reject(error);
          }
        });
      });
      await blockPromise;
      console.log(
        `3.4 롤업 트랜잭션이 정상적으로 L1에 보내짐을 확인해야 한다. \n  예상 결과 - L3 Txhash: ${
          ansi.Yellow
        }${l3TxHash}${ansi.reset} in (${l3BN}) Block \n  실제 결과 - \n    L2 블록: ${
          ansi.Cyan
        }${l2BN}${ansi.reset} \n    L2 블록안에 L3의 내용이 포함된 Rollup Txhash: ${
          ansi.Cyan
        }${l2RollupTx}${ansi.reset}  \n\n    Rollup Tx의 input 값: ${ansi.Cyan}${rollupTx.data}${
          ansi.reset
        } \n\n    Rollup Tx의 input 값의 파싱 결과: ${ansi.Cyan}${JSON.stringify(
          parsedL2CallData,
          null,
          2,
        )}${ansi.reset} \n    Rollup Tx의 input 값의 data(bytes)를 디코딩 결과: ${
          ansi.Cyan
        }${JSON.stringify(parsedL3CallData)}${
          ansi.reset
        } \n\n    Rollup Tx의 input 값의 디코딩 결과에서 L3 Tx를 뽑아내기: ${
          ansi.Cyan
        }${JSON.stringify(originL3tx, null, 2)}${ansi.reset} \n\n    ${
          ansi.Green
        }L2 블록에서 찾은 L3의 Txhash: ${findL3Tx}${ansi.reset}`,
      );
      await l2_ws_prov.destroy();
      expect(l3TxHash).toEqual(findL3Tx);
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
