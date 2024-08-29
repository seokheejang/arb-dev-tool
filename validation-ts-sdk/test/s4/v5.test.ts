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
  getTime,
  Rollup,
  RollupAdminLogic,
  UpgradeExecutor,
  ValidatorWalletCreator,
  ValidatorWallet,
  parseEther,
  bigIntToString,
} from '@src/index';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

describe('4_STORY', () => {
  let api_url: string;
  let l2_seq: TypeWsProvider;
  let l3_1_seq: TypeHttpProvider;
  let l3_2_seq: TypeHttpProvider;
  let l3_3_seq: TypeHttpProvider;
  let l3_1_w: CustomWallet;
  let l3_2_w: CustomWallet;
  let l3_3_w: CustomWallet;
  let l2_1_w: CustomWallet;
  let l2_3_w: CustomWallet;
  let rollupCA: string;
  let walletCreatorCA: string;
  let upgradeExecutorCA: string;
  let rollupContract: Rollup;
  let rollupAdminContract: RollupAdminLogic;
  let upgradeContract: UpgradeExecutor;
  let validatorWalletCreator: any;

  // const l3_1_scw = '0xfCef70A74e0CEBbD5b3089Dc798D30783cBBD508';
  // const l3_2_scw = '0x9d3E2cD97A78F191f3c691EDd3EafBe651fF7681';
  // const l3_3_scw = '0xc684DB1ADA1BefEF519450c6d3dF031b7d8CC09F';
  const challenger = '0x07141f015eF4dd2077951aF88203d9C6fB470BB3';
  let seqscwAddr: string;
  let v1scwAddr: string;
  let v2scwAddr: string;
  let v2scw: ValidatorWallet;
  let doneNodeCreated = false;
  let doneNodeConfirmed = false;
  let doneNodeRejected = false;

  beforeAll(async () => {
    api_url = ENV.TX_SIMULATOR_URL;
    l2_seq = new WsProvider(ENV.L2_WS_URL).prov;
    l3_1_seq = new HttpProvider(ENV.L3_TEST_1_HTTP_URL).prov;
    l3_2_seq = new HttpProvider(ENV.L3_TEST_2_HTTP_URL).prov;
    l3_3_seq = new HttpProvider(ENV.L3_TEST_3_HTTP_URL).prov;
    l3_1_w = new CustomWallet(ENV.L3_TEST_1_KEY, l3_1_seq);
    l3_2_w = new CustomWallet(ENV.L3_TEST_2_KEY, l3_2_seq);
    l3_3_w = new CustomWallet(ENV.L3_TEST_3_KEY, l3_3_seq);
    l2_1_w = new CustomWallet(ENV.L3_TEST_1_KEY, l2_seq);
    l2_3_w = new CustomWallet(ENV.L3_TEST_3_KEY, l2_seq);

    const l3ChainInfoPath = path.join(__dirname, 'l3_chain_info.json');
    try {
      const data = await readFile(l3ChainInfoPath, 'utf8');
      const jsonData = JSON.parse(data);
      jsonData.forEach((item: any) => {
        if (item.rollup) {
          rollupCA = item.rollup.rollup;
          walletCreatorCA = item.rollup['validator-wallet-creator'];
          upgradeExecutorCA = item.rollup['upgrade-executor'];
        }
      });
    } catch (err) {
      console.error('Error reading or parsing JSON file:', err);
    }
    rollupContract = new Rollup(rollupCA, l2_seq);
    rollupAdminContract = new RollupAdminLogic(rollupCA, l2_seq);
    upgradeContract = new UpgradeExecutor(upgradeExecutorCA, l2_1_w.w);
    validatorWalletCreator = new ValidatorWalletCreator(walletCreatorCA, l2_seq);
    seqscwAddr = await validatorWalletCreator.getWallet(l3_1_w.w.address);
    v1scwAddr = await validatorWalletCreator.getWallet(l3_2_w.w.address);
    v2scwAddr = await validatorWalletCreator.getWallet(l3_3_w.w.address);
    v2scw = new ValidatorWallet(v2scwAddr, l2_3_w.w);
  });

  afterEach(async () => {
    rollupContract.removeAllListeners();
  });

  describe('Validator Whitelist Manager 개발', () => {
    it('1.1', async () => {
      const testAccountInfo = {
        s1: { name: 'admin', role: 'MakeNodes', address: seqscwAddr, eoa: l3_1_w.w.address },
        s2: { name: 'validator1', role: 'ResolveNodes', address: v1scwAddr, eoa: l3_2_w.w.address },
        s3: { name: 'validator2', role: 'ResolveNodes', address: v2scwAddr, eoa: l3_3_w.w.address },
      };
      await rollupContract.printStakeInfo(testAccountInfo, true);
      const accounts = {
        admin: seqscwAddr,
        validator1: v1scwAddr,
        validator2: v2scwAddr,
      };
      await rollupAdminContract.printIsValidator(accounts);

      const waitEvent = new Promise<boolean>(async (resolve, reject) => {
        let eventCreateCnt = 0;
        let eventConfirmCnt = 0;
        try {
          // @Event: NodeCreated
          rollupContract.on(
            'NodeCreated',
            async (nodeNum: string, parentNodeHash: string, nodeHash: string, ...args: any) => {
              eventCreateCnt++;
              const txHash = args[args.length - 1].transactionHash;
              const txReceipt = await l2_seq.getTransaction(txHash);
              const resultLog = `${ansi.BrightGreen}[Contract Event]${ansi.reset} [${getTime()}] ${
                ansi.BrightCyan
              }Node created.${
                ansi.reset
              } \n\t - RBlock number: ${nodeNum} \n\t - 부모 nodehash: ${parentNodeHash} \n\t - 현재 nodeHash: ${nodeHash} \n\t - L2 Txhash    : ${txHash}\n\t\t - from : ${
                txReceipt.from
              } \n\t\t - to   : ${txReceipt.to}`;
              console.log(resultLog);
              await rollupContract.printStakeInfo(testAccountInfo, true);

              if (eventCreateCnt == 2) {
                doneNodeCreated = true;
              }
            },
          );

          // @Event: NodeConfirmed
          rollupContract.on(
            'NodeConfirmed',
            async (nodeNum: string, l3blockhash: string, ...args: any) => {
              eventConfirmCnt++;
              const txHash = args[args.length - 1].transactionHash;
              const txReceipt = await l2_seq.getTransaction(txHash);
              const l3block = await l3_1_seq.getBlock(l3blockhash);
              const resultLog = `${ansi.BrightGreen}[Contract Event]${ansi.reset} [${getTime()}] ${
                ansi.BrightCyan
              }Node confirmed.${
                ansi.reset
              } \n\t - RBlock number: ${nodeNum} \n\t - L3 Block     : ${l3blockhash} >> ${
                l3block.number
              } \n\t - L2 Txhash    : ${txHash}\n\t\t - from : ${txReceipt.from} \n\t\t - to   : ${
                txReceipt.to
              }`;
              console.log(resultLog);
              await rollupContract.printStakeInfo(testAccountInfo, true);

              if (eventConfirmCnt == 1) {
                console.log(`Admin: ${ansi.BrightGreen}validator1 활성화${ansi.reset} tx 발생`);
                await upgradeContract.executeCall(
                  rollupCA,
                  rollupAdminContract.makeCalldata(v1scwAddr, true),
                );
                await rollupAdminContract.printIsValidator(accounts);
                const tx1 = await l3_1_w.sendTransaction(l3_1_w.w.address, '0.01');
                console.log(
                  `[${getTime()}] 활성화 확인을 위한 batch 생성을 위해 l3 tx 생성: ${tx1.hash}`,
                );
              } else if (eventConfirmCnt == 2) {
                doneNodeConfirmed = true;
              }
            },
          );

          // @Event: NodeRejected
          rollupContract.on('NodeRejected', async (nodeNum: string) => {
            const resultLog = `${ansi.BrightGreen}[Contract Event]${
              ansi.reset
            } [${getTime()}] Node rejected. RBlock number: ${nodeNum}\n`;
            console.log(resultLog);
            await rollupContract.printStakeInfo(testAccountInfo, false);
            doneNodeRejected = true;
          });

          while (1) {
            if (doneNodeCreated && doneNodeConfirmed) {
              resolve(true);
            }
            await sleep(100);
          }
        } catch (error) {
          reject(error);
        }
      });

      console.log(`Admin: ${ansi.BrightRed}validator1 비 활성화${ansi.reset} tx 발생`);
      await upgradeContract.executeCall(
        rollupCA,
        rollupAdminContract.makeCalldata(v1scwAddr, false),
      );

      await rollupAdminContract.printIsValidator(accounts);

      const tx1 = await l3_1_w.sendTransaction(l3_1_w.w.address, '0.01');
      console.log(
        `[${getTime()}] batch 생성을 위해 l3 tx 생성: ${tx1.hash}\n` +
          `${ansi.BrightRed}검증은 core Log로 확인${ansi.reset}`,
      );

      await waitEvent;

      await l2_seq.destroy();
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
