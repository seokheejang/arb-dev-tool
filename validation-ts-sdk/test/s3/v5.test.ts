import {
  ENV,
  sleep,
  ansi,
  reqApiPost,
  TypeHttpProvider,
  TypeWsProvider,
  HttpProvider,
  WsProvider,
  weiToEther,
  TypeWallet,
  CustomWallet,
  getMultiplePrivateKeys,
  parseCalldata,
  parseRollupData,
  getTime,
} from '@src/index';

describe('3_STORY', () => {
  let api_url: string;
  let l2_seq: TypeWsProvider;
  let l3_1_seq: TypeHttpProvider;
  let l3_2_seq: TypeHttpProvider;
  let l3_3_seq: TypeHttpProvider;
  let l3_1_w: CustomWallet;
  let l3_2_w: CustomWallet;
  let l3_3_w: CustomWallet;
  let l3_3_w_bl: CustomWallet;

  const l3_1_funnel = '0xFeBFd4D91F0a2D47790327F03F26B9A8358fEEb5';
  const l3_2_funnel = '0x3b609fF037EF31e5c377A2FF73c5d72655e68656';
  const l3_3_funnel = '0x851686a67ADE2d65a12d999c8ff0f077301f2952';
  const toAddr = '0x0414AAC259bE3474Ec1789Da23b6cE3836B0fEC8';

  beforeAll(async () => {
    api_url = ENV.TX_SIMULATOR_URL;
    l3_1_seq = new HttpProvider(ENV.L3_TEST_1_HTTP_URL).prov;
    l3_2_seq = new HttpProvider(ENV.L3_TEST_2_HTTP_URL).prov;
    l3_3_seq = new HttpProvider(ENV.L3_TEST_3_HTTP_URL).prov;
    l3_1_w = new CustomWallet(getMultiplePrivateKeys(ENV.L3_TEST_1_MNEMONIC)[0], l3_1_seq);
    l3_2_w = new CustomWallet(getMultiplePrivateKeys(ENV.L3_TEST_2_MNEMONIC)[0], l3_2_seq);
    l3_3_w = new CustomWallet(getMultiplePrivateKeys(ENV.L3_TEST_3_MNEMONIC)[0], l3_3_seq);
    l3_3_w_bl = new CustomWallet(getMultiplePrivateKeys(ENV.L3_TEST_3_MNEMONIC)[9], l3_3_seq);
  });

  describe('허가형 블록체인 개발 여부', () => {
    let errorMessage = '';
    const whitelist = `0x851686a67ADE2d65a12d999c8ff0f077301f2952,0xcDbd82Fa99C3a0524A81C4A8345a9D4226c759C2,0x09E06f5ae83A6f19FFeB341Fc3D654b712a70298,0x3EaCb30f025630857aDffac9B2366F953eFE4F98`;
    it('1.1 --execution.sequencer.sender-whitelist', async () => {
      const tx1 = await l3_3_w.sendTransaction(l3_3_w_bl.w.address, '0.001');
      const tx1_res = await l3_3_seq.getTransactionReceipt(tx1.hash);

      let tx2: any;
      try {
        tx2 = await l3_3_w_bl.sendTransaction(l3_3_w.w.address, '0.0001');
      } catch (error: any) {
        errorMessage = error;
      }

      console.log(
        `WhiteList Address: [${whitelist}]\n\nWhiteList Send Tx "${l3_3_w.w.address}" =💰=> "${l3_3_w_bl.w.address}" \n  TxHash: ${tx1.hash}, status: ${tx1_res.status} \n\nNon-WhiteList Send Tx "${l3_3_w_bl.w.address}" =💰=> "${l3_3_w.w.address}" \n  ${errorMessage}`,
      );

      expect(true).toEqual(true);
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
