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
    it('3.1 node URL로 http 및 ws 접속이 되어야 한다.', async () => {
      const l2ChainId = (await l3_prov.getNetwork()).chainId;
      console.log(
        `3.1 node URL로 http 및 ws 접속이 되어야 한다. \n  예상 결과 - Chain ID: ${ENV.L3_CHAIN_ID} \n  ${ansi.Green}실제 결과 - Chain ID: ${l2ChainId}${ansi.reset}`,
      );
      expect(l2ChainId).toEqual(ENV.L3_CHAIN_ID);
    });

    it('3.2 node에서 new block 생성 진행되어야 한다.', async () => {
      const bn = await l3_prov.getBlockNumber();
      const bn_lastest = await l3_prov.getBlock(bn);
      const bn_before = await l3_prov.getBlock(bn - 1);
      console.log(
        `3.2 node에서 new block 생성 진행되어야 한다. \n  예상 결과 - 블록 번호가 증가하는것 확인 \n  ${ansi.Green}실제 결과 - \n    before  BlockNumber: ${bn_before?.number}, Timestamp: ${bn_before?.timestamp} \n    lastest BlockNumber: ${bn_lastest?.number}, Timestamp: ${bn_lastest?.timestamp}${ansi.reset}`,
      );
      expect(bn_lastest.number - 1).toEqual(bn_before.number);
    });

    it('3.3 node로 transaction 발행 시 block에 포함되어야 한다.', async () => {
      const devAddr = devWallet.w.address;
      const sendTx = await devWallet.sendTransaction(devAddr, '0.01');
      const txRes = await sendTx.wait();
      const txHash = txRes.transactionHash;
      const bn = txRes.blockNumber;
      const block = await l3_prov.getBlock(bn);
      console.log(
        `3.3 node로 transaction 발행 시 block에 포함되어야 한다. \n  예상 결과 - Tx Hash: ${txHash} \n  ${ansi.Green}실제 결과 - block.transactions: ${block.transactions}${ansi.reset}`,
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
      console.log(`L3 SendTransaction Hash: ${l3TxHash}`);
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
                const res = await l2_prov.getTransaction(tx);
                if (res.data.startsWith('0x8f111f3c')) {
                  l2RollupTx = tx;
                  const parsedCallData = await parseCalldata(res.data);
                  const decodeCallData = parsedCallData?.params['data(bytes)'];
                  const rollupData = await parseRollupData(decodeCallData.substring(2));
                  for (const tx of rollupData) {
                    if (l3TxHash === tx.hash) {
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
        `3.4 롤업 트랜잭션이 정상적으로 L1에 보내짐을 확인해야 한다. \n  예상 결과 - L3 Txhash: ${l3TxHash} in (${l3BN}) Block \n  실제 결과 - \n    L2 Block Numbder: ${l2BN} \n    L2 Rollup Txhash: ${l2RollupTx}  \n    ${ansi.Green}Find L3 Txhash in L2 Block Rollup Tx: ${findL3Tx}${ansi.reset}`,
      );
      l2_ws_prov.destroy();
      expect(l3TxHash).toEqual(findL3Tx);
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
