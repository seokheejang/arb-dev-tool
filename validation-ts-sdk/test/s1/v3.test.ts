import {
  ENV,
  HttpProvider,
  TypeHttpProvider,
  Wallet,
  TypeWallet,
  sleep,
  generateWallet,
  weiToEther,
} from '@src/index';

describe('1_STORY', () => {
  let l3_prov: TypeHttpProvider;
  let dev_key: string;
  let devWallet: Wallet;

  beforeAll(async () => {
    dev_key = ENV.DEV_PRIV_KEY;
    l3_prov = new HttpProvider(ENV.L3_HTTP_URL).prov;
    devWallet = new Wallet(dev_key, l3_prov);
  });

  describe('Layer3 Sequencer Build (251)', () => {
    it('3.1 node URL로 http 및 ws 접속이 되어야 한다.', async () => {
      const l2ChainId = (await l3_prov.getNetwork()).chainId;
      console.log(
        `3.1 node URL로 http 및 ws 접속이 되어야 한다. \n  예상 결과 - Chain ID: ${ENV.L3_CHAIN_ID} \n  실제 결과 - Chain ID: ${l2ChainId}`,
      );
      expect(l2ChainId).toEqual(ENV.L3_CHAIN_ID);
    });

    it('3.2 node에서 new block 생성 진행되어야 한다.', async () => {
      const bn = await l3_prov.getBlockNumber();
      const bn_lastest = await l3_prov.getBlock(bn);
      const bn_before = await l3_prov.getBlock(bn - 1);
      console.log(
        `3.2 node에서 new block 생성 진행되어야 한다. \n  예상 결과 - 블록 번호가 증가하는것 확인 \n  실제 결과 - \n    before  BlockNumber: ${bn_before?.number}, Timestamp: ${bn_before?.timestamp} \n    lastest BlockNumber: ${bn_lastest?.number}, Timestamp: ${bn_lastest?.timestamp}`,
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
        `3.3 node로 transaction 발행 시 block에 포함되어야 한다. \n  예상 결과 - Tx Hash: ${txHash} \n  실제 결과 - block.transactions: ${block.transactions}`,
      );
      expect(block.transactions.includes(txHash)).toEqual(true);
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
