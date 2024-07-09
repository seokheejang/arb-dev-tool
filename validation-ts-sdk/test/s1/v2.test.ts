import {
  ENV,
  HttpProvider,
  TypeHttpProvider,
  Wallet,
  sleep,
  TypeWsProvider,
  TypeWallet,
  weiToEther,
  WsProvider,
} from '@src/index';

describe('1_STORY', () => {
  let l1_prov: TypeHttpProvider;
  let l2_prov: TypeHttpProvider;
  let l1_ws_prov: TypeWsProvider;
  let dev_key: string;
  let devWallet: Wallet;

  beforeAll(async () => {
    dev_key = ENV.DEV_PRIV_KEY;
    l1_prov = new HttpProvider(ENV.L1_HTTP_URL).prov;
    l2_prov = new HttpProvider(ENV.L2_HTTP_URL).prov;
    l1_ws_prov = new WsProvider(ENV.L1_WS_URL).prov;
    devWallet = new Wallet(dev_key, l2_prov);
  });

  describe('Layer 2 구축 (244)', () => {
    it('2.1 node URL로 http 및 ws 접속이 되어야 한다.', async () => {
      const l2ChainId = (await l2_prov.getNetwork()).chainId;
      console.log(
        `2.1 node URL로 http 및 ws 접속이 되어야 한다. \n  예상 결과 - Chain ID: ${ENV.L2_CHAIN_ID} \n  실제 결과 - Chain ID: ${l2ChainId}`,
      );
      expect(l2ChainId).toEqual(ENV.L2_CHAIN_ID);
    });

    it('2.2 node에서 new block 생성 진행되어야 한다.', async () => {
      const bn = await l2_prov.getBlockNumber();
      const bn_lastest = await l2_prov.getBlock(bn);
      const bn_before = await l2_prov.getBlock(bn - 1);
      console.log(
        `2.2 node에서 new block 생성 진행되어야 한다. \n  예상 결과 - 블록 번호가 증가하는것 확인 \n  실제 결과 - \n    before  BlockNumber: ${bn_before?.number}, Timestamp: ${bn_before?.timestamp} \n    lastest BlockNumber: ${bn_lastest?.number}, Timestamp: ${bn_lastest?.timestamp}`,
      );
      expect(bn_lastest.number - 1).toEqual(bn_before.number);
    });

    it('2.3 node로 transaction 발행 시 block에 포함되어야 한다.', async () => {
      const devAddr = devWallet.w.address;
      const sendTx = await devWallet.sendTransaction(devAddr, '0.01');
      const txRes = await sendTx.wait();
      const txHash = txRes.transactionHash;
      const bn = txRes.blockNumber;
      const block = await l2_prov.getBlock(bn);
      console.log(
        `2.3 node로 transaction 발행 시 block에 포함되어야 한다. \n  예상 결과 - Tx Hash: ${txHash} \n  실제 결과 - block.transactions: ${block.transactions}`,
      );
      expect(block.transactions.includes(txHash)).toEqual(true);
    });

    it('2.4 롤업 트랜잭션이 정상적으로 L1에 보내짐을 확인해야 한다.', async () => {
      const devAddr = devWallet.w.address;
      const sendTx = await devWallet.sendTransaction(devAddr, '0.01');
      const txRes = await sendTx.wait();
      const txHash = txRes.transactionHash;
      const bn = txRes.blockNumber;
      const block = await l2_prov.getBlock(bn);

      const blockPromise = new Promise((resolve, reject) => {
        l1_ws_prov.on('block', async (blockNumber: number) => {
          try {
            const block = await l1_prov.getBlock(blockNumber);
            const txs = block.transactions;
            console.log(`L1 new block! ${blockNumber}, txs.length: ${txs.length}`);
            if (txs.length > 0) {
              for (const tx of txs) {
                const res = await l1_prov.getTransaction(tx);
                if (res.data.startsWith('0x8f111f3c')) {
                  console.log(`트랜잭션 데이터의 첫 10자리가 '0x8f111f3c'인 트랜잭션 발견!`);
                }
              }
              // resolve(true);
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      await blockPromise;

      console.log(
        `2.3 롤업 트랜잭션이 정상적으로 L1에 보내짐을 확인해야 한다. \n  예상 결과 - Tx Hash: ${txHash} \n  실제 결과 - block.transactions: ${block.transactions}`,
      );
      expect(block.transactions.includes(txHash)).toEqual(true);
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
