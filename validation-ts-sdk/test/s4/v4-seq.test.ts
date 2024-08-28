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
  let l2_2_w: CustomWallet;
  let l2_3_w: CustomWallet;
  let rollupCA: string;
  let walletCreatorCA: string;
  let rollupContract: Rollup;
  let validatorWalletCreator: any;
  let doneUserStakeUpdated = false;
  let doneUserWithdrawableFundsUpdated = false;

  // const l3_1_scw = '0xfCef70A74e0CEBbD5b3089Dc798D30783cBBD508';
  // const l3_2_scw = '0x9d3E2cD97A78F191f3c691EDd3EafBe651fF7681';
  // const l3_3_scw = '0xc684DB1ADA1BefEF519450c6d3dF031b7d8CC09F';
  const challenger = '0x07141f015eF4dd2077951aF88203d9C6fB470BB3';
  let seqscwAddr: string;
  let v1scwAddr: string;
  let v2scwAddr: string;
  let seqscw: ValidatorWallet;
  let v1scw: ValidatorWallet;
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
    l2_2_w = new CustomWallet(ENV.L3_TEST_1_KEY, l2_seq);
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
    seqscw = new ValidatorWallet(seqscwAddr, l2_1_w.w);
    v1scw = new ValidatorWallet(v1scwAddr, l2_2_w.w);
    v2scw = new ValidatorWallet(v2scwAddr, l2_3_w.w);
  });

  afterEach(async () => {
    rollupContract.removeAllListeners();
  });

  describe('ETH 기반 Validator Library 개발', () => {
    it('1.1', async () => {
      console.log('sequencer stake 출금');
      const testAccountInfo = {
        s1: { name: 'sequencer', role: 'MakeNodes', address: seqscwAddr, eoa: l3_1_w.w.address },
        s2: { name: 'validator1', role: 'ResolveNodes', address: v1scwAddr, eoa: l3_2_w.w.address },
        s3: { name: 'validator2', role: 'ResolveNodes', address: v2scwAddr, eoa: l3_3_w.w.address },
      };
      await rollupContract.printStakeInfo(testAccountInfo, true);

      const waitEvent = new Promise<boolean>(async (resolve, reject) => {
        let execRefund = 0;
        let execWithdraw = 0;
        try {
          // @Event: UserStakeUpdated
          rollupContract.on(
            'UserStakeUpdated',
            async (user: string, initialBalance: string, finalBalance: string) => {
              console.log(
                `[EVENT][${getTime()}] 스테이킹 상황 update by user: ${user} from ${initialBalance} to ${finalBalance} }`,
              );
              await sleep(5000);
              await rollupContract.printStakeInfo(testAccountInfo, true);
              if (execRefund == 0) {
                try {
                  // console.log(`[${getTime()}] RollupUserLogic - withdrawStakerFunds Tx 발생`);
                  // const refundStakeTx = await v2scw.refundStake(rollupCA);
                  // await refundStakeTx.wait();
                } catch (error) {
                  console.log('refundStakeTx error', error);
                }
                doneUserStakeUpdated = true;
              }
              execRefund++;
            },
          );

          // @Event: UserWithdrawableFundsUpdated
          rollupContract.on(
            'UserWithdrawableFundsUpdated',
            async (user: string, initialBalance: string, finalBalance: string) => {
              console.log(
                `[EVENT][${getTime()}] 출금가능금액 상황 by user: ${user} from ${initialBalance} to ${finalBalance} }`,
              );
              await sleep(5000);
              if (execWithdraw == 1) {
                const v1WalletContactBal = await l2_seq.getBalance(seqscwAddr);
                try {
                  console.log(`[${getTime()}] Validator Wallet - withdrawEth Tx 발생`);
                  const withdrawTx = await seqscw.withdrawETHFromWalletContract(
                    bigIntToString(v1WalletContactBal),
                    l2_1_w.w.address,
                  );
                  await withdrawTx.wait();
                  doneUserWithdrawableFundsUpdated = true;
                } catch (error) {
                  console.log('withdrawTx error', error);
                }
              }
              execWithdraw++;
            },
          );
          while (1) {
            if (doneUserStakeUpdated && doneUserWithdrawableFundsUpdated) {
              resolve(true);
            }
            await sleep(100);
          }
        } catch (error) {
          reject(error);
        }
      });

      // withdraw stake
      try {
        console.log(`[${getTime()}] RollupUserLogic - returnOldDeposit Tx 발생`);
        const unstakeTx = await seqscw.unstake(seqscwAddr, rollupCA);
        await unstakeTx.wait();
      } catch (error) {
        console.log('unstakeTx error', error);
      }

      await waitEvent;
      await sleep(3000);
      await rollupContract.printStakeInfo(testAccountInfo, true);
      const tx4 = await l3_1_w.sendTransaction(l3_1_w.w.address, '0.01');
      // console.log('validator2 wallet에 1eth를 stake 하기 위한 batch tx', tx4.hash);
      await l2_seq.destroy();
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
