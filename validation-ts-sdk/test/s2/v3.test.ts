import {
  ENV,
  sleep,
  ansi,
  reqApiPost,
  TypeHttpProvider,
  TypeWsProvider,
  HttpProvider,
  WsProvider,
  parseCalldata,
  parseRollupData,
} from '@src/index';

describe('2_STORY', () => {
  let api_url: string;
  let l3_fn_prov: TypeHttpProvider;
  let l2_ws_prov: TypeWsProvider;
  let l2_prov: TypeHttpProvider;

  beforeAll(async () => {
    api_url = ENV.TX_SIMULATOR_URL;
    l3_fn_prov = new HttpProvider(ENV.L3_FN_HTTP_URL).prov;
    l2_ws_prov = new WsProvider(ENV.L2_WS_URL).prov;
    l2_prov = new HttpProvider(ENV.L2_HTTP_URL).prov;
  });

  describe('Tx Simulator 개발 (254)', () => {
    console.log(`${ansi.Yellow}조회 방법 - Tx-Simulator Server API 조회${ansi.reset}`);
    const fromAddr = '0x07141f015eF4dd2077951aF88203d9C6fB470BB3';
    const toAddr = '0x0414AAC259bE3474Ec1789Da23b6cE3836B0fEC8';

    let res_l3Txs: any[] = [];
    let l2RollupTxs: string[] = [];
    let finalCnt = 0;
    let rollupTx: any;
    let parsedL2CallData: any;
    let parsedL3CallData: any;
    let originL3txs: any[] = [];

    it('3.1 Advanced Test 2', async () => {
      const beforeBlockPromise = new Promise((resolve, reject) => {
        l2_ws_prov.on('block', async (blockNumber: number) => {
          try {
            console.log(
              `Rollup Tx Searching ... L2 new block! ${ansi.BrightWhite}${blockNumber}${ansi.reset}, finded L3 tx: ${ansi.Yellow}${finalCnt}${ansi.reset} / ${ansi.BrightYellow}${res_l3Txs.length}${ansi.reset}`,
            );
            if (finalCnt != 0 && finalCnt >= res_l3Txs.length) {
              resolve(true);
            }
            const block = await l2_prov.getBlock(blockNumber);
            const txs = block.transactions;
            if (txs.length > 0) {
              for (const tx of txs) {
                rollupTx = await l2_prov.getTransaction(tx);
                if (rollupTx.data.startsWith('0x8f111f3c')) {
                  l2RollupTxs.push(tx);
                  parsedL2CallData = await parseCalldata(rollupTx.data);
                  const callData = parsedL2CallData?.params['data(bytes)'];
                  parsedL3CallData = await parseRollupData(callData.substring(2));
                  for (const tx of parsedL3CallData) {
                    originL3txs.push(tx.hash);
                    console.log(
                      `Block(${blockNumber}) - 🎣 GETCHA Tx! ${ansi.Blue}${tx.hash}${ansi.reset}, ${ansi.BrightCyan}${tx.nonce}${ansi.reset}`,
                    );
                  }
                }
              }
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      const res_erc20_deploy = await reqApiPost(`${api_url}/erc20/deploy`);
      const res_erc20_ca = res_erc20_deploy.ca;
      const res_transfer = await reqApiPost(`${api_url}/erc20/transfer`, {
        ca: res_erc20_ca,
        to: toAddr,
        amount: '1',
        tries: 5,
      });
      const res_approve = await reqApiPost(`${api_url}/erc20/approve`, {
        ca: res_erc20_ca,
        from: fromAddr,
        spender: fromAddr,
        amount: '1',
      });
      const res_transferFrom = await reqApiPost(`${api_url}/erc20/transferFrom`, {
        ca: res_erc20_ca,
        from: fromAddr,
        to: toAddr,
        amount: '1',
        tries: 5,
      });
      const res_erc721_deploy = await reqApiPost(`${api_url}/erc721/deploy`);
      const res_erc721_ca = res_erc721_deploy.ca;
      const res_erc721_approve = await reqApiPost(`${api_url}/erc721/approve`, {
        ca: res_erc721_ca,
        spender: toAddr,
        id: '1',
      });
      const res_erc721_transferFrom = await reqApiPost(`${api_url}/erc721/transferFrom`, {
        ca: res_erc721_ca,
        from: fromAddr,
        to: toAddr,
        id: '3',
        tries: 2,
      });
      const res_erc1155_deploy = await reqApiPost(`${api_url}/erc1155/deploy`);
      const res_erc1155_ca = res_erc1155_deploy.ca;
      const res_setApprovalAll = await reqApiPost(`${api_url}/erc1155/setApprovalAll`, {
        ca: res_erc1155_ca,
        spender: toAddr,
        approved: true,
      });
      const res_safeTransferFrom = await reqApiPost(`${api_url}/erc1155/safeTransferFrom`, {
        ca: res_erc1155_ca,
        from: fromAddr,
        to: toAddr,
        id: 5,
        amount: '1',
        tries: 3,
      });
      const res_safeBatchTransferFrom = await reqApiPost(
        `${api_url}/erc1155/safeBatchTransferFrom`,
        {
          ca: res_erc1155_ca,
          from: fromAddr,
          to: toAddr,
          ids: [6, 7, 8],
          amounts: [1, 1, 1],
          tries: 2,
        },
      );

      res_l3Txs = [
        ...[res_erc20_deploy.txHash],
        ...res_transfer.txHash,
        ...[res_approve.txHash],
        ...res_transferFrom.txHash,
        ...[res_erc721_deploy.txHash],
        ...[res_erc721_approve.txHash],
        ...res_erc721_transferFrom.txHash,
        ...[res_erc1155_deploy.txHash],
        ...[res_setApprovalAll.txHash],
        ...res_safeTransferFrom.txHash,
        ...[res_safeBatchTransferFrom.txHash],
      ];

      console.log('res total count:', res_l3Txs.length, res_l3Txs);
      const afterBlockPromise = new Promise(async (resolve, reject) => {
        try {
          while (1) {
            if (finalCnt >= res_l3Txs.length) {
              resolve(true);
            }
            finalCnt = 0;
            for (const tx of res_l3Txs) {
              if (originL3txs.includes(tx)) {
                finalCnt++;
              }
            }
            await sleep(300);
          }
        } catch (error) {
          reject(error);
        }
      });

      await beforeBlockPromise;
      await afterBlockPromise;

      console.log(
        `Done - Generate L3 Txs / Find Txs in L2 Rollup data: ${ansi.BrightGreen}${res_l3Txs.length}${ansi.reset} / ${ansi.BrightGreen}${finalCnt}${ansi.reset}`,
      );

      await l2_ws_prov.destroy();
      expect(res_l3Txs.length).toEqual(finalCnt);
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
