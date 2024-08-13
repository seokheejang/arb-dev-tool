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
  });

  describe('블록 생성 관련', () => {
    it('1.1 --execution.sequencer.max-block-speed 0.25s / 5s', async () => {
      const count = 5;

      // await l3_3_w.sendTransaction(l3_2_w.w.address, '0.01');
      for (let i = 1; i <= count; i++) {
        const tx = await l3_2_w.sendTransaction(l3_2_w.w.address, '0.01');
        await tx.wait();
        const bn = (await l3_2_seq.getBlock(tx.blockHash as string)).number;
        console.log(
          `${ansi.Yellow}L3B tx${i}${ansi.reset} hash: ${
            tx.hash
          }, tx receipt BN: ${bn}, ${getTime()}`,
        );
      }

      // await l3_3_w.sendTransaction(l3_3_w.w.address, '0.01');
      for (let i = 1; i <= count; i++) {
        const tx = await l3_3_w.sendTransaction(l3_3_w.w.address, '0.01');
        await tx.wait();
        const bn = (await l3_3_seq.getBlock(tx.blockHash as string)).number;
        console.log(
          `${ansi.Green}L3C tx${i}${ansi.reset} hash: ${
            tx.hash
          }, tx receipt BN: ${bn}, ${getTime()}`,
        );
      }

      expect(true).toEqual(true);
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
