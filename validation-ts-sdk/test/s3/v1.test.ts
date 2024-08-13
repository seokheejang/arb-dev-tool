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
    it('1.1 --node.batch-poster.max-delay 30s', async () => {
      l2_seq = new WsProvider(ENV.L2_WS_URL).prov;
      let triesTotalCnt = 15;
      let res_l3Txs: any[] = [];
      let l2RollupTxs: string[] = [];
      let l2RollupTxsDatalen: number[] = [];
      let finalCnt = 0;
      let rollupTx: any;
      let parsedL2CallData: any;
      let parsedL3CallData: any;
      let originL3txs: any[] = [];
      let startTime: number[] = new Array(triesTotalCnt).fill(0);
      let endTime: number[] = new Array(triesTotalCnt).fill(0);
      let doneTx: boolean[] = new Array(triesTotalCnt).fill(false);
      const beforeBlockPromise = new Promise((resolve, reject) => {
        console.log('L2 Rollup Tx Searching ...');
        l2_seq.on('block', async (blockNumber: number) => {
          try {
            // console.log(
            //   `Rollup Tx Searching ... L2 block: ${ansi.BrightCyan}${blockNumber}${ansi.reset}, find tx: ${finalCnt}/${triesTotalCnt}`,
            // );
            if (finalCnt >= triesTotalCnt) {
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
                  console.log('parsedL2CallData', parsedL2CallData);
                  console.log('parsedL3CallData', parsedL3CallData);
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

      startTime = new Array(triesTotalCnt).fill(0).map(() => Date.now());

      const dataSize = 0;
      const intervalTime = 5000;
      let tryInCnt = 0;

      const sendTransaction = async () => {
        if (tryInCnt >= triesTotalCnt) {
          return; // 모든 트랜잭션을 보낸 후 종료
        }
        const tx_data = generateRandomHex(dataSize);
        const tx = await l3_1_w.sendTransaction(l3_1_w.w.address, '0.01', tx_data);
        console.log(
          `L3 A Node | 롤업 옵션 max-delay(30s) max-size(90000) | Tx 발생 ${
            tryInCnt + 1
          }/${triesTotalCnt}: ${tx.hash} | ${getTime()}`,
        );
        res_l3Txs.push(tx.hash);
        tryInCnt++;
        setTimeout(sendTransaction, intervalTime);
      };
      sendTransaction();

      const afterBlockPromise = new Promise(async (resolve, reject) => {
        try {
          while (finalCnt < triesTotalCnt) {
            for (const tx of res_l3Txs) {
              const txIndex = res_l3Txs.indexOf(tx);
              if (originL3txs.includes(tx) && !doneTx[txIndex]) {
                doneTx[txIndex] = true;
                endTime[txIndex] = Date.now();
                finalCnt++;
              }
            }
            await sleep(100);
          }
          resolve(true);
        } catch (error) {
          reject(error);
        }
      });

      await beforeBlockPromise;
      await afterBlockPromise;

      const timeDifferences = endTime.map((end, index) => (end - startTime[index]) / 1000);

      console.log(
        `L3 transactions list(${originL3txs.length}):\n` +
          `  [ ${originL3txs.join(', ')} ]\n\n` +
          `L3 A Node 롤업 제어 기본 설정값에 L3 Tx data(${dataSize}) byte size의 ${triesTotalCnt}개 생성 후 L2 롤업 Tx data size 확인 결과: ${
            ansi.Cyan
          }${l2RollupTxsDatalen.join(', ')}${ansi.reset}\n\n` +
          `롤업 발생 주기: ${ansi.Green}${timeDifferences.join(', ')}${ansi.reset}`,
      );
      await l2_seq.destroy();
      expect(true).toEqual(true);
    });

    it('1.2 --node.batch-poster.max-delay 1m', async () => {
      l2_seq = new WsProvider(ENV.L2_WS_URL).prov;
      let triesTotalCnt = 20;
      let res_l3Txs: any[] = [];
      let l2RollupTxs: string[] = [];
      let l2RollupTxsDatalen: number[] = [];
      let finalCnt = 0;
      let rollupTx: any;
      let parsedL2CallData: any;
      let parsedL3CallData: any;
      let originL3txs: any[] = [];
      let startTime: number[] = new Array(triesTotalCnt).fill(0);
      let endTime: number[] = new Array(triesTotalCnt).fill(0);
      let doneTx: boolean[] = new Array(triesTotalCnt).fill(false);
      const beforeBlockPromise = new Promise((resolve, reject) => {
        console.log('L2 Rollup Tx Searching ...');
        l2_seq.on('block', async (blockNumber: number) => {
          try {
            // console.log(
            //   `Rollup Tx Searching ... L2 block: ${ansi.BrightCyan}${blockNumber}${ansi.reset}, find tx: ${finalCnt}/${triesTotalCnt}`,
            // );
            if (finalCnt >= triesTotalCnt) {
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

      startTime = new Array(triesTotalCnt).fill(0).map(() => Date.now());

      const dataSize = 0;
      const intervalTime = 5000;
      let tryInCnt = 0;

      const sendTransaction = async () => {
        if (tryInCnt >= triesTotalCnt) {
          return; // 모든 트랜잭션을 보낸 후 종료
        }
        const tx_data = generateRandomHex(dataSize);
        const tx = await l3_2_w.sendTransaction(l3_2_w.w.address, '0.01', tx_data);
        console.log(
          `L3 B Node | 롤업 옵션 max-delay(60s) max-size(90000) | Tx 발생 ${
            tryInCnt + 1
          }/${triesTotalCnt}: ${tx.hash} | ${getTime()}`,
        );
        res_l3Txs.push(tx.hash);
        tryInCnt++;
        setTimeout(sendTransaction, intervalTime);
      };
      sendTransaction();

      const afterBlockPromise = new Promise(async (resolve, reject) => {
        try {
          while (finalCnt < triesTotalCnt) {
            for (const tx of res_l3Txs) {
              const txIndex = res_l3Txs.indexOf(tx);
              if (originL3txs.includes(tx) && !doneTx[txIndex]) {
                doneTx[txIndex] = true;
                endTime[txIndex] = Date.now();
                finalCnt++;
              }
            }
            await sleep(100);
          }
          resolve(true);
        } catch (error) {
          reject(error);
        }
      });

      await beforeBlockPromise;
      await afterBlockPromise;

      const timeDifferences = endTime.map((end, index) => (end - startTime[index]) / 1000);

      console.log(
        `L3 transactions list(${originL3txs.length}):\n` +
          `  [ ${originL3txs.join(', ')} ]\n\n` +
          `L3 B Node 롤업 제어 max-delay(60s) max-size(90000) 설정값에 L3 Tx data(${dataSize}) byte size의 ${triesTotalCnt}개 생성 후 L2 롤업 Tx data size 확인 결과: ${
            ansi.Cyan
          }${l2RollupTxsDatalen.join(', ')}${ansi.reset}\n\n` +
          `롤업 발생 주기: ${ansi.Green}${timeDifferences.join(', ')}${ansi.reset}`,
      );
      await l2_seq.destroy();
      expect(true).toEqual(true);
    });

    it('1.3 --node.batch-poster.max-delay 1m', async () => {
      l2_seq = new WsProvider(ENV.L2_WS_URL).prov;
      let triesTotalCnt = 10;
      let res_l3Txs: any[] = [];
      let l2RollupTxs: string[] = [];
      let l2RollupTxsDatalen: number[] = [];
      let finalCnt = 0;
      let rollupTx: any;
      let parsedL2CallData: any;
      let parsedL3CallData: any;
      let originL3txs: any[] = [];
      let startTime: number[] = new Array(triesTotalCnt).fill(0);
      let endTime: number[] = new Array(triesTotalCnt).fill(0);
      let doneTx: boolean[] = new Array(triesTotalCnt).fill(false);
      const beforeBlockPromise = new Promise((resolve, reject) => {
        console.log('L2 Rollup Tx Searching ...');
        l2_seq.on('block', async (blockNumber: number) => {
          try {
            // console.log(
            //   `Rollup Tx Searching ... L2 block: ${ansi.BrightCyan}${blockNumber}${ansi.reset}, find tx: ${finalCnt}/${triesTotalCnt}`,
            // );
            if (finalCnt >= triesTotalCnt) {
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

      startTime = new Array(triesTotalCnt).fill(0).map(() => Date.now());

      const dataSize = 14000;
      const intervalTime = 1000;
      let tryInCnt = 0;

      const sendTransaction = async () => {
        if (tryInCnt >= triesTotalCnt) {
          return; // 모든 트랜잭션을 보낸 후 종료
        }
        const tx_data = generateRandomHex(dataSize);
        const tx = await l3_3_w.sendTransaction(l3_3_w.w.address, '0.01', tx_data);
        console.log(
          `L3 C Node | 롤업 옵션 max-delay(60s) max-size(20000) | Tx(${dataSize}) 발생 ${
            tryInCnt + 1
          }/${triesTotalCnt}: ${tx.hash} | ${getTime()}`,
        );
        res_l3Txs.push(tx.hash);
        tryInCnt++;
        setTimeout(sendTransaction, intervalTime);
      };
      sendTransaction();

      const afterBlockPromise = new Promise(async (resolve, reject) => {
        try {
          while (finalCnt < triesTotalCnt) {
            for (const tx of res_l3Txs) {
              const txIndex = res_l3Txs.indexOf(tx);
              if (originL3txs.includes(tx) && !doneTx[txIndex]) {
                doneTx[txIndex] = true;
                endTime[txIndex] = Date.now();
                finalCnt++;
              }
            }
            await sleep(100);
          }
          resolve(true);
        } catch (error) {
          reject(error);
        }
      });

      await beforeBlockPromise;
      await afterBlockPromise;

      const timeDifferences = endTime.map((end, index) => (end - startTime[index]) / 1000);

      console.log(
        `L3 transactions list(${originL3txs.length}):\n` +
          `  [ ${originL3txs.join(', ')} ]\n\n` +
          `L3 C Node 롤업 제어 max-delay(60s) max-size(20000) 설정값에 L3 Tx data(${dataSize}) byte size의 ${triesTotalCnt}개 생성 후 L2 롤업 Tx data size 확인 결과: ${
            ansi.Cyan
          }${l2RollupTxsDatalen.join(', ')}${ansi.reset}\n\n` +
          `롤업 발생 주기: ${ansi.Green}${timeDifferences.join(', ')}${ansi.reset}`,
      );
      await l2_seq.destroy();
      expect(true).toEqual(true);
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
