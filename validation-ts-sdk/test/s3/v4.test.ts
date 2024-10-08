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

  describe('보안 관련 (anti-ddos)', () => {
    it('1.1 --execution.sequencer.max-revert-gas-reject 31000 assert', async () => {
      const beforeBal = BigInt((await l3_2_seq.getBalance(l3_2_w.w.address)).toString());
      const req = `${api_url}/storage/revertTx`;
      const res = await reqApiPost(`${req}`, {
        provider: ENV.L3_TEST_2_HTTP_URL,
        privatekey: getMultiplePrivateKeys(ENV.L3_TEST_2_MNEMONIC)[0],
        ca: '0x8B991a0092842F9F2F9ad3Ab43C097c60e3d58Db',
        slots: 40,
      });
      const status = (await l3_2_seq.getTransactionReceipt(res.result)).status;
      const afterBal = BigInt((await l3_2_seq.getBalance(l3_2_w.w.address)).toString());

      console.log(
        `L3B Node max-revert-gas-reject 디폴트 옵션값 (31000) 설정 시, 소모 가스 400000 이상 Tx 생성 결과\n` +
          `  txhash: ${res.result}, status:  ${status}\n\n` +
          `  ${
            l3_2_w.w.address
          } 주소의 Tx 실패 이전 잔액 : ${beforeBal}, Tx 실패 이후 잔액: ${afterBal}, 전후 차이: ${
            ansi.Green
          }${beforeBal - afterBal}${ansi.reset}`,
      );
    });

    it('1.1 --execution.sequencer.max-revert-gas-reject 31000 assert', async () => {
      const beforeBal = BigInt((await l3_2_seq.getBalance(l3_2_w.w.address)).toString());
      const req = `${api_url}/storage/revertTx`;
      const res = await reqApiPost(`${req}`, {
        provider: ENV.L3_TEST_2_HTTP_URL,
        privatekey: getMultiplePrivateKeys(ENV.L3_TEST_2_MNEMONIC)[0],
        ca: '0x8B991a0092842F9F2F9ad3Ab43C097c60e3d58Db',
        slots: 0,
      });
      const status = (await l3_2_seq.getTransactionReceipt(res.result)).status;
      const afterBal = BigInt((await l3_2_seq.getBalance(l3_2_w.w.address)).toString());

      console.log(
        `L3B Node max-revert-gas-reject 디폴트 옵션값 (31000) 설정 시, 소모 가스 400000 미만 Tx 생성 결과\n` +
          `  txhash: ${res.result}, status: ${status}\n\n` +
          `  ${
            l3_2_w.w.address
          } 주소의 Tx 실패 이전 잔액 : ${beforeBal}, Tx 실패 이후 잔액: ${afterBal}, 전후 차이: ${
            ansi.Green
          }${beforeBal - afterBal}${ansi.reset}`,
      );
    });

    it('1.1 --execution.sequencer.max-revert-gas-reject 400000 assert', async () => {
      const beforeBal = BigInt((await l3_3_seq.getBalance(l3_3_w.w.address)).toString());
      const req = `${api_url}/storage/revertTx`;
      const res = await reqApiPost(`${req}`, {
        provider: ENV.L3_TEST_3_HTTP_URL,
        privatekey: getMultiplePrivateKeys(ENV.L3_TEST_3_MNEMONIC)[0],
        ca: '0x655403cf10ee99ccfa3bc84cb3f79c76868d4efc',
        slots: 40,
      });
      const status = (await l3_3_seq.getTransactionReceipt(res.result)).status;
      const afterBal = BigInt((await l3_3_seq.getBalance(l3_3_w.w.address)).toString());

      console.log(
        `L3C Node max-revert-gas-reject 400000 옵션값 설정 시, 소모 가스 400000 이상 Tx 생성 결과\n` +
          `  txhash: ${res.result}, status: ${status}\n\n` +
          `  ${
            l3_3_w.w.address
          } 주소의 Tx 실패 이전 잔액 : ${beforeBal}, Tx 실패 이후 잔액: ${afterBal}, 전후 차이: ${
            ansi.Green
          }${beforeBal - afterBal}${ansi.reset}`,
      );
    });

    it('1.1 --execution.sequencer.max-revert-gas-reject 400000 revert', async () => {
      const beforeBal = BigInt((await l3_3_seq.getBalance(l3_3_w.w.address)).toString());
      const req = `${api_url}/storage/revertTx`;
      const res = await reqApiPost(`${req}`, {
        provider: ENV.L3_TEST_3_HTTP_URL,
        privatekey: getMultiplePrivateKeys(ENV.L3_TEST_3_MNEMONIC)[0],
        ca: '0x655403cf10ee99ccfa3bc84cb3f79c76868d4efc',
        slots: 10,
      });

      const afterBal = BigInt((await l3_3_seq.getBalance(l3_3_w.w.address)).toString());

      console.log(
        `L3C Node max-revert-gas-reject 400000 옵션값 설정 시, 소모 가스 400000 미만 Tx 생성 결과\n` +
          `  result: ${ansi.Red}${res.result}${ansi.reset}, status: X\n\n` +
          `  ${
            l3_3_w.w.address
          } 주소의 Tx 실패 이전 잔액 : ${beforeBal}, Tx 실패 이후 잔액: ${afterBal}, 전후 차이: ${
            ansi.Green
          }${beforeBal - afterBal}${ansi.reset}`,
      );
    });

    it('1.2 --execution.sequencer.max-tx-data-size 85000', async () => {
      l2_seq = new WsProvider(ENV.L2_WS_URL).prov;
      let triesCnt = 1;
      let res_l3Txs: any[] = [];
      let l2RollupTxs: string[] = [];
      let finalCnt = 0;
      let rollupTx: any;
      let parsedL2CallData: any;
      let parsedL3CallData: any;
      let originL3txs: any[] = [];
      let startTime1: number;
      let endTime1 = 0;
      let errorMessage = '';
      // const beforeBlockPromise = new Promise((resolve, reject) => {
      //   console.log('L2 Rollup Tx Searching ...');
      //   l2_seq.on('block', async (blockNumber: number) => {
      //     try {
      //       if (finalCnt >= triesCnt) {
      //         resolve(true);
      //       }
      //       const block = await l2_seq.getBlock(blockNumber);
      //       const txs = block.transactions;
      //       if (txs.length > 0) {
      //         for (const tx of txs) {
      //           rollupTx = await l2_seq.getTransaction(tx);
      //           if (rollupTx.data !== '0x' && rollupTx.data.startsWith('0x8f111f3c')) {
      //             l2RollupTxs.push(tx);
      //             parsedL2CallData = await parseCalldata(rollupTx.data);
      //             const callData = parsedL2CallData?.params['data(bytes)'];
      //             parsedL3CallData = await parseRollupData(callData.substring(2));
      //             console.log('block', block, '\nrollup tx:', tx);
      //             // console.log('getTransaction()', rollupTx);
      //             // console.log('parsedL2CallData', parsedL2CallData);
      //             // console.log('parsedL3CallData', parsedL3CallData);
      //             for (const tx of parsedL3CallData) {
      //               originL3txs.push(tx.hash);
      //             }
      //           }
      //         }
      //       }
      //     } catch (error) {
      //       reject(error);
      //     }
      //   });
      // });
      startTime1 = Date.now();
      const tx1_data = '0x' + 'ff'.repeat(80000);
      const tx1 = await l3_1_w.sendTransaction(l3_1_w.w.address, '0.01', tx1_data);
      console.log('L3A Node 에서 Tx1 발생:', tx1.hash, getTime());
      res_l3Txs.push(tx1.hash);
      const tx2_data = '0x' + 'ff'.repeat(100000);
      let tx2: any;

      try {
        console.log('L3A Node 에서 Tx2 발생:', getTime());
        tx2 = await l3_1_w.sendTransaction(l3_1_w.w.address, '0.01', tx2_data);
      } catch (error: any) {
        errorMessage =
          '{"jsonrpc":"2.0","id":53,"error":{"code":-32000,"message":"oversized data"}}';
      }
      // const afterBlockPromise = new Promise(async (resolve, reject) => {
      //   try {
      //     while (1) {
      //       if (finalCnt >= triesCnt) {
      //         resolve(true);
      //       }
      //       finalCnt = 0;
      //       for (const tx of res_l3Txs) {
      //         if (originL3txs.includes(tx)) {
      //           if (tx === tx1.hash) endTime1 = Date.now();
      //           finalCnt++;
      //         }
      //       }
      //       await sleep(300);
      //     }
      //   } catch (error) {
      //     reject(error);
      //   }
      // });

      // await beforeBlockPromise;
      // await afterBlockPromise;
      // const timeDifference1 = (endTime1 - startTime1) / 1000;

      console.log(
        `L3A Node 옵션값 max-tx-data-size 85000 에서 Tx1 Size 80000 발생 성공: ${tx1.hash}\n` +
          `L3A Node 옵션값 max-tx-data-size 85000 에서 Tx2 Size 100000 발생 실패: Error - ${ansi.Red}${errorMessage}${ansi.reset}\n`,
      );
      await l2_seq.destroy();
      expect(true).toEqual(true);
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
