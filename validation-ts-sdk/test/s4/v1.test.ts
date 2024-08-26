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
  Rollup,
  ValidatorWalletCreator,
} from '@src/index';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

describe('3_STORY', () => {
  let api_url: string;
  let l2_seq: TypeWsProvider;
  let l3_1_seq: TypeHttpProvider;
  let l3_2_seq: TypeHttpProvider;
  let l3_3_seq: TypeHttpProvider;
  let l3_1_w: CustomWallet;
  let l3_2_w: CustomWallet;
  let l3_3_w: CustomWallet;
  let rollupCA: string;
  let walletCreatorCA: string;
  let rollupContract: Rollup;
  let validatorWalletCreator: any;

  // const l3_1_scw = '0xfCef70A74e0CEBbD5b3089Dc798D30783cBBD508';
  // const l3_2_scw = '0x9d3E2cD97A78F191f3c691EDd3EafBe651fF7681';
  // const l3_3_scw = '0xc684DB1ADA1BefEF519450c6d3dF031b7d8CC09F';
  const challenger = '0x07141f015eF4dd2077951aF88203d9C6fB470BB3';
  let v1scw: string;
  let v2scw: string;
  let v3scw: string;

  beforeAll(async () => {
    api_url = ENV.TX_SIMULATOR_URL;
    l2_seq = new WsProvider(ENV.L2_WS_URL).prov;
    l3_1_seq = new HttpProvider(ENV.L3_TEST_1_HTTP_URL).prov;
    l3_2_seq = new HttpProvider(ENV.L3_TEST_2_HTTP_URL).prov;
    l3_3_seq = new HttpProvider(ENV.L3_TEST_3_HTTP_URL).prov;
    l3_1_w = new CustomWallet(ENV.L3_TEST_1_KEY, l3_1_seq);
    l3_2_w = new CustomWallet(ENV.L3_TEST_2_KEY, l3_2_seq);
    l3_3_w = new CustomWallet(ENV.L3_TEST_3_KEY, l3_3_seq);

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
    v1scw = await validatorWalletCreator.getWallet(l3_1_w.w.address);
    v2scw = await validatorWalletCreator.getWallet(l3_2_w.w.address);
    v3scw = await validatorWalletCreator.getWallet(l3_3_w.w.address);
  });

  afterEach(async () => {
    rollupContract.removeAllListeners();
  });

  describe('ETH 기반 Admin Validator 구축', () => {
    it('1.1', async () => {
      console.log('Validator 컨트랙트 월렛 주소:', v1scw, v2scw, v3scw);

      // 이벤트가 발생할 때까지 대기하는 Promise를 반환
      const ltnNodeCreated = (nodeNum: string, from: string) => {
        return new Promise<void>(async resolve => {
          console.log(`Node created. nodeNum: ${nodeNum}, from: ${from}`);

          console.log(
            `sequencer staked on ${await rollupContract.contract.latestStakedNode(
              v1scw,
            )},  ${await rollupContract.contract.amountStaked(v1scw)}`,
          );
          console.log(
            `validator1 staked on ${await rollupContract.contract.latestStakedNode(
              v2scw,
            )}, ${await rollupContract.contract.amountStaked(v2scw)}`,
          );
          console.log(
            `validator2 staked on ${await rollupContract.contract.latestStakedNode(
              v3scw,
            )}, ${await rollupContract.contract.amountStaked(v3scw)}`,
          );

          // 이벤트 처리가 끝났으므로 Promise를 해결하여 테스트를 종료
          resolve();
        });
      };

      // Promise를 반환하여 Jest가 테스트가 끝났다고 판단하지 않도록 함
      await new Promise<void>(resolve => {
        rollupContract.on('NodeCreated', async (nodeNum: string, from: string) => {
          await ltnNodeCreated(nodeNum, from);
          resolve(); // 이벤트가 처리된 후 테스트를 종료
        });
      });
      await l2_seq.destroy();
    });

    it('finish', async () => {
      await sleep(3000);
    });
  });
});
