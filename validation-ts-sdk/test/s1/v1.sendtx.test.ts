import {
  ENV,
  HttpProvider,
  TypeHttpProvider,
  CustomWallet,
  sleep,
  generateWallet,
} from '@src/index';

describe('1_STORY', () => {
  let l1_prov: TypeHttpProvider;
  let dev_key: string;
  let other_key: string;
  let devWallet: CustomWallet;
  let otherWallet: CustomWallet;

  beforeAll(async () => {
    dev_key = ENV.DEV_PRIV_KEY;
    l1_prov = new HttpProvider(ENV.L1_HTTP_URL).prov;
    devWallet = new CustomWallet(dev_key, l1_prov);
    other_key = generateWallet();
    otherWallet = new CustomWallet(other_key, l1_prov);
  });

  describe('Layer 1 구축 (244)', () => {
    it('send Transaction', async () => {
      const devAddr = devWallet.w.address;
      const sendTx = await devWallet.sendTransaction(devAddr, '0.01');
      console.log('Send Transaction !');
      const txRes = await sendTx.wait();
      const txHash = txRes.transactionHash;
      console.log('txHash:', txHash);

      expect(1).toEqual(1);
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
