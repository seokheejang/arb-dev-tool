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
  generateRandomHex,
  getByteFromData,
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

  describe('롤업 제어', () => {
    it('1.1 --node.batch-poster.max-delay 30s / 1m', async () => {
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
                  console.log('getTransaction()', rollupTx);
                  console.log('parsedL2CallData', parsedL2CallData);
                  console.log('parsedL3CallData', parsedL3CallData);
                  for (const tx of parsedL3CallData) {
                    originL3txs.push(tx.hash);
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
      console.log('L3 A Node 에서 30초 롤업 테스트를 위한 Tx 발생:', tx1.hash, getTime());
      res_l3Txs.push(tx1.hash);
      const tx2 = await l3_2_w.sendTransaction(l3_2_w.w.address, '0.01');
      console.log('L3 B Node 에서 60초 롤업 테스트를 위한 Tx 발생:', tx2.hash, getTime());
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
        'Time difference:',
        timeDifference1,
        '/',
        timeDifference2,
        'seconds \nL2 rollup txs: \n',
        originL3txs,
        'L3 txs',
        res_l3Txs,
      );
      await l2_seq.destroy();
      expect(true).toEqual(true);
    });

    it('1.2 --node.batch-poster.max-size 90000', async () => {
      l2_seq = new WsProvider(ENV.L2_WS_URL).prov;
      let triesCnt = 5;
      let res_l3Txs: any[] = [];
      let l2RollupTxs: string[] = [];
      let l2RollupTxsDatalen: number[] = [];
      let finalCnt = 0;
      let rollupTx: any;
      let parsedL2CallData: any;
      let parsedL3CallData: any;
      let originL3txs: any[] = [];
      let startTime: number[] = [];
      let endTime: number[] = new Array(triesCnt).fill(0);
      let doneTx: boolean[] = new Array(triesCnt).fill(false);
      const beforeBlockPromise = new Promise((resolve, reject) => {
        console.log('L2 Rollup Tx Searching ...');
        l2_seq.on('block', async (blockNumber: number) => {
          try {
            // console.log(
            //   `Rollup Tx Searching ... L2 block: ${ansi.BrightCyan}${blockNumber}${ansi.reset}, find tx: ${finalCnt}/${triesCnt}`,
            // );
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
                  l2RollupTxsDatalen.push(getByteFromData(rollupTx.data));
                  console.log('block', block, '\nrollup tx:', tx);
                  console.log('getTransaction()', rollupTx);
                  // console.log('parsedL2CallData', parsedL2CallData);
                  // console.log('parsedL3CallData', parsedL3CallData);
                  for (const tx of parsedL3CallData) {
                    originL3txs.push(tx.hash);
                    // console.log(
                    //   `Block(${blockNumber}) - 🎣 GETCHA Tx! ${ansi.Blue}${tx.hash}${ansi.reset}, ${ansi.BrightCyan}${tx.nonce}${ansi.reset}`,
                    // );
                  }
                }
              }
            }
          } catch (error) {
            reject(error);
          }
        });
      });
      startTime = new Array(triesCnt).fill(0).map(() => Date.now());

      const dataSize = 60000;
      for (let i = 0; i < triesCnt; i++) {
        const tx_data = generateRandomHex(dataSize);
        const tx = await l3_1_w.sendTransaction(l3_1_w.w.address, '0.01', tx_data);
        console.log(
          `L3 A Node 에서 max-size(90000) 롤업 테스트를 위한 Tx 발생 ${i + 1}:`,
          tx.hash,
          getTime(),
        );
        res_l3Txs.push(tx.hash);
      }

      const afterBlockPromise = new Promise(async (resolve, reject) => {
        try {
          while (finalCnt < triesCnt) {
            for (const tx of res_l3Txs) {
              const txIndex = res_l3Txs.indexOf(tx);
              if (originL3txs.includes(tx) && !doneTx[txIndex]) {
                doneTx[txIndex] = true;
                endTime[txIndex] = Date.now();
                finalCnt++;
              }
            }
            await sleep(300);
          }
          resolve(true);
        } catch (error) {
          reject(error);
        }
      });

      await beforeBlockPromise;
      await afterBlockPromise;

      const timeDifferences = endTime.map((end, index) => (end - startTime[index]) / 1000);

      console.log('Time differences for all transactions:', timeDifferences, 'seconds');
      console.log(
        `L2 Rollup transactions list\n` +
          `[ ${originL3txs} ]\n\n` +
          `L3 transactions list:\n` +
          `[ ${res_l3Txs} ]\n\n` +
          `Node 옵션 batch-poster max-size(90000)를 기본 설정값에 L3 TX(${dataSize}) ${triesCnt}개 생성 후 L2 Rollup TXs Data length: ${l2RollupTxsDatalen}`,
      );
      await l2_seq.destroy();
      expect(true).toEqual(true);
    });

    it('1.2 --node.batch-poster.max-size 20000', async () => {
      l2_seq = new WsProvider(ENV.L2_WS_URL).prov;
      let triesCnt = 5;
      let res_l3Txs: any[] = [];
      let l2RollupTxs: string[] = [];
      let l2RollupTxsDatalen: number[] = [];
      let finalCnt = 0;
      let rollupTx: any;
      let parsedL2CallData: any;
      let parsedL3CallData: any;
      let originL3txs: any[] = [];
      let startTime: number[] = [];
      let endTime: number[] = new Array(triesCnt).fill(0);
      let doneTx: boolean[] = new Array(triesCnt).fill(false);
      const beforeBlockPromise = new Promise((resolve, reject) => {
        console.log('L2 Rollup Tx Searching ...');
        l2_seq.on('block', async (blockNumber: number) => {
          try {
            // console.log(
            //   `Rollup Tx Searching ... L2 block: ${ansi.BrightCyan}${blockNumber}${ansi.reset}, find tx: ${finalCnt}/${triesCnt}`,
            // );
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
                  l2RollupTxsDatalen.push(getByteFromData(rollupTx.data));
                  console.log('block', block, '\nrollup tx:', tx);
                  console.log('getTransaction()', rollupTx);
                  // console.log('parsedL2CallData', parsedL2CallData);
                  // console.log('parsedL3CallData', parsedL3CallData);
                  for (const tx of parsedL3CallData) {
                    originL3txs.push(tx.hash);
                    // console.log(
                    //   `Block(${blockNumber}) - 🎣 GETCHA Tx! ${ansi.Blue}${tx.hash}${ansi.reset}, ${ansi.BrightCyan}${tx.nonce}${ansi.reset}`,
                    // );
                  }
                }
              }
            }
          } catch (error) {
            reject(error);
          }
        });
      });
      startTime = new Array(triesCnt).fill(0).map(() => Date.now());

      const dataSize = 10000;
      for (let i = 0; i < triesCnt; i++) {
        const tx_data = generateRandomHex(dataSize);
        const tx = await l3_2_w.sendTransaction(l3_2_w.w.address, '0.01', tx_data);
        console.log(
          `L3 B Node 에서 max-size(20000) 롤업 테스트를 위한 Tx 발생 ${i + 1}:`,
          tx.hash,
          getTime(),
        );
        res_l3Txs.push(tx.hash);
      }

      const afterBlockPromise = new Promise(async (resolve, reject) => {
        try {
          while (finalCnt < triesCnt) {
            for (const tx of res_l3Txs) {
              const txIndex = res_l3Txs.indexOf(tx);
              if (originL3txs.includes(tx) && !doneTx[txIndex]) {
                doneTx[txIndex] = true;
                endTime[txIndex] = Date.now();
                finalCnt++;
              }
            }
            await sleep(300);
          }
          resolve(true);
        } catch (error) {
          reject(error);
        }
      });

      await beforeBlockPromise;
      await afterBlockPromise;

      const timeDifferences = endTime.map((end, index) => (end - startTime[index]) / 1000);

      console.log('Time differences for all transactions:', timeDifferences, 'seconds');
      console.log(
        `L2 Rollup transactions list\n` +
          `[ ${originL3txs} ]\n\n` +
          `L3 transactions list:\n` +
          `[ ${res_l3Txs} ]\n\n` +
          `Node 옵션 batch-poster max-size(20000)를 설정하고 L3 TX(${dataSize}) ${triesCnt}개 생성 후 L2 Rollup TXs Data length: ${l2RollupTxsDatalen}`,
      );
      expect(true).toEqual(true);
      await l2_seq.destroy();
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
