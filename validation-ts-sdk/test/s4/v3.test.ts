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
  ValidatorWalletCreator,
  ValidatorWallet,
  parseEther,
  bigIntToString,
  reqApiPost,
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
  let rollupContract: Rollup;
  let validatorWalletCreator: any;
  let doneNodeCreated = false;
  let doneNodeConfirmed = false;
  let doneNodeRejected = false;
  let doneRollupChallengeStarted = false;

  // const l3_1_scw = '0xfCef70A74e0CEBbD5b3089Dc798D30783cBBD508';
  // const l3_2_scw = '0x9d3E2cD97A78F191f3c691EDd3EafBe651fF7681';
  // const l3_3_scw = '0xc684DB1ADA1BefEF519450c6d3dF031b7d8CC09F';
  const challengerAddress = '0x07141f015eF4dd2077951aF88203d9C6fB470BB3';
  let seqscwAddr: string;
  let v1scwAddr: string;
  let v2scwAddr: string;
  let v2scw: ValidatorWallet;

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
        }
      });
    } catch (err) {
      console.error('Error reading or parsing JSON file:', err);
    }
    rollupContract = new Rollup(rollupCA, l2_seq);
    validatorWalletCreator = new ValidatorWalletCreator(walletCreatorCA, l2_seq);
    seqscwAddr = await validatorWalletCreator.getWallet(l3_1_w.w.address);
    v1scwAddr = await validatorWalletCreator.getWallet(l3_2_w.w.address);
    v2scwAddr = await validatorWalletCreator.getWallet(l3_3_w.w.address);
    v2scw = new ValidatorWallet(v2scwAddr, l2_3_w.w);
  });

  afterEach(async () => {
    rollupContract.removeAllListeners();
  });

  async function getLatestStakedNodeAndAmountStaked(
    rollupContract: Rollup,
    seqscwAddr: any,
    v1scwAddr: any,
    v2scwAddr: any,
  ) {
    const seqLSN = await rollupContract.latestStakedNode(seqscwAddr);
    const v1LSN = await rollupContract.latestStakedNode(v1scwAddr);
    const v2LSN = await rollupContract.latestStakedNode(v2scwAddr);
    const challLSN = await rollupContract.latestStakedNode(challengerAddress);
    const seqAS = await rollupContract.amountStaked(seqscwAddr);
    const v1AS = await rollupContract.amountStaked(v1scwAddr);
    const v2AS = await rollupContract.amountStaked(v2scwAddr);
    const challAS = await rollupContract.amountStaked(challengerAddress);

    return { seqLSN, v1LSN, v2LSN, seqAS, v1AS, v2AS, challLSN, challAS };
  }

  describe('ETH 기반 fraud-proof 동작확인 simulator 개발', () => {
    it('1.1', async () => {
      const testAccountInfo = {
        s1: { name: 'sequencer', role: 'MakeNodes', address: seqscwAddr, eoa: l3_1_w.w.address },
        s2: { name: 'validator1', role: 'ResolveNodes', address: v1scwAddr, eoa: l3_2_w.w.address },
        s3: { name: 'validator2', role: 'ResolveNodes', address: v2scwAddr, eoa: l3_3_w.w.address },
        s4: {
          name: 'challenger',
          role: 'challenge',
          address: challengerAddress,
          eoa: challengerAddress,
        },
      };
      await rollupContract.printStakeInfo(testAccountInfo, true);

      const waitEvent = new Promise<boolean>(async (resolve, reject) => {
        let isChal = true;
        try {
          // @Event: NodeCreated
          rollupContract.on('NodeCreated', async (nodeNum: string, from: string) => {
            const resultLog = `[Event][${getTime()}] Node created. RBlock: ${nodeNum}, 이전 RBlock statehash: ${from}\n`;
            console.log(resultLog);
            await rollupContract.printStakeInfo(testAccountInfo, false);
            doneNodeCreated = true;
            if (isChal) {
              const resMakeConflict = await reqApiPost(`${api_url}/senario/makeConflict`, {
                rollup: rollupCA,
              });
              console.log(
                `resMakeConflict hash: ${resMakeConflict.result.transactionHash}, status: ${resMakeConflict.result.status}`,
              );
              isChal = false;
            }
          });

          // @Event: NodeConfirmed
          rollupContract.on('NodeConfirmed', async (nodeNum: string, from: string) => {
            const stakeEsrowAddress = await rollupContract.loserStakeEscrow();
            console.log(
              `loserStakeEscrow ${stakeEsrowAddress} balance: ${await rollupContract.withdrawableFunds(
                stakeEsrowAddress,
              )}`,
            );
            const resultLog = `[Event][${getTime()}] Node confirmed. RBlock: ${nodeNum}, 이전 RBlock statehash: ${from}\n`;
            console.log(resultLog);
            await rollupContract.printStakeInfo(testAccountInfo, false);
            doneNodeConfirmed = true;

            try {
              // [] > l3send로 reject 발생
              const isResolved = await rollupContract.requireUnresolvedExists();
              const tx1 = await l3_1_w.sendTransaction(l3_1_w.w.address, '0.01');
              console.log(`isResolved: ${isResolved} >  l3send로 reject 발생`);
              console.log('challenger 이후 batch tx 생성', tx1.hash);
            } catch (error) {
              // revert > error > 정상 case , core가 reject 발생
              // console.log('requireUnresolvedExists', error);
              console.log(`requireUnresolvedExists revert`);
            }
          });

          // @Event: NodeRejected
          rollupContract.on('NodeRejected', async (nodeNum: string) => {
            const resultLog = `[Event][${getTime()}] Node rejected. RBlock: ${nodeNum}\n`;
            console.log(resultLog);
            await rollupContract.printStakeInfo(testAccountInfo, false);
            doneNodeRejected = true;
          });

          // @Event: RollupChallengeStarted
          rollupContract.on(
            'RollupChallengeStarted',
            async (
              challengeIndex: string,
              asserter: string,
              challenger: string,
              challengedNode: string,
            ) => {
              const resultLog = `[Event][${getTime()}] RollupChallengeStarted. index: ${challengeIndex}, asserter: ${asserter}, challenger: ${challenger}, challengedNode: ${challengedNode}\n`;
              console.log(resultLog);
              await rollupContract.printStakeInfo(testAccountInfo, false);
              doneRollupChallengeStarted = true;
            },
          );

          while (1) {
            if (
              doneNodeCreated &&
              doneNodeConfirmed &&
              doneRollupChallengeStarted &&
              doneNodeRejected
            ) {
              resolve(true);
            }
            await sleep(100);
          }
        } catch (error) {
          reject(error);
        }
      });

      const tx1 = await l3_1_w.sendTransaction(l3_1_w.w.address, '0.01');
      console.log('tx 생성', tx1.hash);
      await waitEvent;

      const tx2 = await l3_1_w.sendTransaction(l3_1_w.w.address, '0.01');
      console.log('tx 생성', tx2.hash);
      await l2_seq.destroy();
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
