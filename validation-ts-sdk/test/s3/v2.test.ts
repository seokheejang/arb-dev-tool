import {
  ENV,
  sleep,
  ansi,
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
  weiToGwei,
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

  describe('배치포스터 관련 (롤업 수수료)', () => {
    it('1.1 --node.batch-poster.data-poster.max(min)-tip-cap-gwei', async () => {
      const l3_1_seq_address = '0x820d033cbad28F1c1439339D1ac66828d6C8619e';
      const l3_2_seq_address = '0x2704f3ebf23cF9bADa16aEAA5D3d307a24C934a1';
      l2_seq = new WsProvider(ENV.L2_WS_URL).prov;
      let triesCnt = 2;
      let res_l3Txs: any[] = [];
      let l2RollupTxs: string[] = [];
      let finalCnt = 0;
      let rollupTx: any;
      let parsedL2CallData: any;
      let parsedL3CallData: any;
      let originL3txs: any[] = [];
      let startTime1: number;
      let endTime1 = 0;
      let startTime2: number;
      let endTime2 = 0;
      let rollupTx1: any;
      let rollupTx2: any;
      const beforeBlockPromise = new Promise((resolve, reject) => {
        console.log('L2 Rollup Tx Searching ...');
        l2_seq.on('block', async (blockNumber: number) => {
          try {
            if (finalCnt >= triesCnt) {
              resolve(true);
            }
            const block = await l2_seq.getBlock(blockNumber);
            const txs = block.transactions;
            if (txs.length > 0) {
              for (const tx of txs) {
                rollupTx = await l2_seq.getTransaction(tx);
                if (rollupTx.data !== '0x' && rollupTx.data.startsWith('0x8f111f3c')) {
                  l2RollupTxs.push(tx);
                  parsedL2CallData = await parseCalldata(rollupTx.data);
                  const callData = parsedL2CallData?.params['data(bytes)'];
                  parsedL3CallData = await parseRollupData(callData.substring(2));
                  console.log('block', block, '\nrollup tx:', tx);
                  // console.log('getTransaction()', rollupTx);
                  // console.log('parsedL2CallData', parsedL2CallData);
                  // console.log('parsedL3CallData', parsedL3CallData);
                  for (const tx of parsedL3CallData) {
                    originL3txs.push(tx.hash);
                    if (tx.hash === tx1.hash) {
                      rollupTx1 = rollupTx;
                    } else if (tx.hash === tx2.hash) {
                      rollupTx2 = rollupTx;
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
      startTime1 = Date.now();
      startTime2 = Date.now();
      let doneTx1 = false;
      let doneTx2 = false;
      const tx1 = await l3_1_w.sendTransaction(l3_1_w.w.address, '0.01');
      console.log('L3 A Node 에서 롤업 수수료 & 발행자 확인을 위한 Tx 발생:', tx1.hash, getTime());
      res_l3Txs.push(tx1.hash);
      const tx2 = await l3_2_w.sendTransaction(l3_2_w.w.address, '0.01');
      console.log('L3 B Node 에서 롤업 수수료 & 발행자 확인을 위한 Tx 발생:', tx2.hash, getTime());
      res_l3Txs.push(tx2.hash);
      const afterBlockPromise = new Promise(async (resolve, reject) => {
        try {
          while (1) {
            if (finalCnt >= triesCnt) {
              resolve(true);
            }
            finalCnt = 0;
            for (const tx of res_l3Txs) {
              if (originL3txs.includes(tx)) {
                if (tx === tx1.hash && !doneTx1) {
                  doneTx1 = true;
                  endTime1 = Date.now();
                } else if (tx === tx2.hash && !doneTx2) {
                  doneTx2 = true;
                  endTime2 = Date.now();
                }
                finalCnt++;
              }
            }
            await sleep(100);
          }
        } catch (error) {
          reject(error);
        }
      });

      await beforeBlockPromise;
      await afterBlockPromise;

      const timeDifference1 = (endTime1 - startTime1) / 1000;
      const timeDifference2 = (endTime2 - startTime2) / 1000;
      console.log(
        `롤업 발생 주기: ${timeDifference1}, ${timeDifference2}\n` +
          `L3 transactions lists:\n` +
          `[ ${originL3txs} ]`,
      );
      console.log(
        `L3A Node 시퀀서 설정 옵션 주소: ${ansi.Green}${l3_1_seq_address}${ansi.reset} = 롤업 Tx receipt 안에 발행자 주소: ${ansi.Green}${rollupTx1.from}${ansi.reset}\n` +
          `L3B Node 시퀀서 설정 옵션 주소: ${ansi.Green}${l3_2_seq_address}${ansi.reset} = 롤업 Tx receipt 안에 발행자 주소: ${ansi.Green}${rollupTx2.from}${ansi.reset}`,
      );
      console.log(`L3A Node가 발생시킨 롤업 Tx Receipt:`, rollupTx1);
      console.log(`L3B Node가 발생시킨 롤업 Tx Receipt:`, rollupTx2);

      const label1 = 'L3A Node가 발생시킨 롤업 Tx Receipt 내 maxPriorityFeePerGas :';
      const label2 = 'L3B Node가 발생시킨 롤업 Tx Receipt 내 maxPriorityFeePerGas :';
      const maxLabelLength = Math.max(label1.length, label2.length);
      console.log(
        `Result\n` +
          `  ${label1.padEnd(maxLabelLength)} ${weiToGwei(rollupTx1.maxPriorityFeePerGas)
            .toString()
            .padStart(15)}\n` +
          `  ${label2.padEnd(maxLabelLength)} ${ansi.Green}${weiToGwei(
            rollupTx2.maxPriorityFeePerGas,
          )
            .toString()
            .padStart(15)}${ansi.reset}\n`,
      );

      await l2_seq.destroy();
      expect(true).toEqual(true);
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
