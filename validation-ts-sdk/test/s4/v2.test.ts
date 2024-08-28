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

  // const l3_1_scw = '0xfCef70A74e0CEBbD5b3089Dc798D30783cBBD508';
  // const l3_2_scw = '0x9d3E2cD97A78F191f3c691EDd3EafBe651fF7681';
  // const l3_3_scw = '0xc684DB1ADA1BefEF519450c6d3dF031b7d8CC09F';
  const challenger = '0x07141f015eF4dd2077951aF88203d9C6fB470BB3';
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

  describe('ETH 기반 User Validator 구축', () => {
    it('1.1', async () => {
      const testAccountInfo = {
        s1: { name: 'sequencer', role: 'MakeNodes', address: seqscwAddr, eoa: l3_1_w.w.address },
        s2: { name: 'validator1', role: 'ResolveNodes', address: v1scwAddr, eoa: l3_2_w.w.address },
        s3: { name: 'validator2', role: 'ResolveNodes', address: v2scwAddr, eoa: l3_3_w.w.address },
      };

      const waitEvent = new Promise<boolean>(async (resolve, reject) => {
        try {
          // @Event: NodeCreated
          rollupContract.on('NodeCreated', async (nodeNum: string, from: string) => {
            const resultLog = `[Event][${getTime()}] Node created. RBlock: ${nodeNum}, 이전 RBlock statehash: ${from}\n`;
            console.log(resultLog);
            await rollupContract.printStakeInfo(testAccountInfo, false);
            doneNodeCreated = true;
          });

          // @Event: NodeConfirmed
          rollupContract.on('NodeConfirmed', async (nodeNum: string, from: string) => {
            const resultLog = `[Event][${getTime()}] Node confirmed. RBlock: ${nodeNum}, 이전 RBlock statehash: ${from}\n`;
            console.log(resultLog);
            await rollupContract.printStakeInfo(testAccountInfo, false);
            doneNodeConfirmed = true;
          });

          // @Event: NodeRejected
          rollupContract.on('NodeRejected', async (nodeNum: string) => {
            const resultLog = `[Event][${getTime()}] Node rejected. RBlock: ${nodeNum}\n`;
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

      await rollupContract.printStakeInfo(testAccountInfo, true);
      // withdraw stake
      const beforeV2Bal = await l2_seq.getBalance(l2_3_w.w.address);
      const beforeV2AS = await rollupContract.amountStaked(v2scwAddr);
      try {
        const unstakeTx = await v2scw.unstake(v2scwAddr, rollupCA);
        await unstakeTx.wait();
      } catch (error) {
        console.log('unstakeTx error', error);
      }
      try {
        const refundStakeTx = await v2scw.refundStake(rollupCA);
        await refundStakeTx.wait();
      } catch (error) {
        console.log('refundStakeTx error', error);
      }
      const v1WalletContactBal = await l2_seq.getBalance(v2scwAddr);
      try {
        const withdrawTx = await v2scw.withdrawETHFromWalletContract(
          bigIntToString(v1WalletContactBal),
          l2_3_w.w.address,
        );
        await withdrawTx.wait();
      } catch (error) {
        console.log('withdrawTx error', error);
      }
      await rollupContract.printStakeInfo(testAccountInfo, true);

      const afterV2Bal = await l2_seq.getBalance(l2_3_w.w.address);
      const afterV2AS = await rollupContract.amountStaked(v2scwAddr);

      const bal = (await l2_seq.getBalance(l2_3_w.w.address)).sub(parseEther('0.3'));
      const tx1 = await l2_3_w.sendTransaction(l3_1_w.w.address, weiToEther(bal));
      await tx1.wait();

      console.log(
        `validator2 ${v2scwAddr} stake amount - befroe: ${beforeV2AS} after: ${afterV2AS}`,
      );
      console.log(
        `validator2 ${v2scwAddr} eth amount - befroe: ${beforeV2Bal} after: ${afterV2Bal}`,
      );

      // EOA : ETH
      // Wallet Contract : ETH
      // Rollup : ETH
      // Rollup unlock - 1 ETH
      // Rollup refund Rollup CA -> Wallet Contract 1 ETH MOVE
      const tx2 = await l3_1_w.sendTransaction(l3_1_w.w.address, '0.01');
      console.log('validator2 잔액 부족 검증을 위한 tx 발생', tx2.hash);
      await waitEvent;

      const tx3 = await l2_1_w.sendTransaction(l2_3_w.w.address, '10');
      console.log('validator2에 다시 10 eth 채워 넣으므로써 validator2 정상화', tx3.hash);
      const tx4 = await l3_1_w.sendTransaction(l3_1_w.w.address, '0.01');
      console.log('validator2 wallet에 1eth를 stake 하기 위한 batch tx', tx4.hash);

      await l2_seq.destroy();
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
