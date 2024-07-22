import {
  ENV,
  HttpProvider,
  TypeHttpProvider,
  Wallet,
  sleep,
  WsProvider,
  TypeWsProvider,
  ansi,
  StaticJsonRpcProvider,
  TypeStaticJsonRpcProvider,
} from '@src/index';
import net from 'net';
const { URL } = require('url');

describe('2_STORY', () => {
  let l3_prov: TypeStaticJsonRpcProvider;
  let l3_fn_ws_prov: TypeWsProvider;
  let l3_fn_prov: TypeHttpProvider;
  let dev_key: string;
  let devWallet: Wallet;

  beforeAll(async () => {
    dev_key = ENV.DEV_PRIV_KEY;
    l3_prov = new StaticJsonRpcProvider(ENV.L3_HTTP_URL, 3000).prov;
    l3_fn_ws_prov = new WsProvider(ENV.L3_FN_WS_URL).prov;
    l3_fn_prov = new HttpProvider(ENV.L3_FN_HTTP_URL).prov;
    devWallet = new Wallet(dev_key, l3_fn_prov);
  });

  afterAll(async () => {
    await l3_fn_ws_prov.destroy();
  });

  describe('Layer3 Full-Node Build (252)', () => {
    console.log(
      `${ansi.Yellow}조회 방법 - ethers.js(5.7.2) Http JsonRpcProvider로 api method 조회 (eth_chainId, eth_getBlock, eth_getTransaction...)${ansi.reset}`,
    );
    it('2.1 full-node URL로 http 및 ws 접속이 되어야 한다.', async () => {
      const l3ChainId = (await l3_fn_prov.getNetwork()).chainId;
      console.log(
        `2.1 full-node URL로 http 및 ws 접속이 되어야 한다. \n  예상 결과 - L3 Chain ID: ${ENV.L3_CHAIN_ID} \n  실제 결과 - L3 Chain ID: ${ansi.Green}${l3ChainId}${ansi.reset}`,
      );
      expect(l3ChainId).toEqual(ENV.L3_CHAIN_ID);
    });

    it('2.2 sequencer node URL로는 http 및 ws 접속이 되지 않아야 한다.', async () => {
      try {
        const l3ChainId = await l3_prov.getNetwork();
        console.log(
          `2.2 sequencer node URL로는 http 및 ws 접속이 되지 않아야 한다. \n  예상 결과 - L3 Chain ID: ${ENV.L3_CHAIN_ID} \n  실제 결과 - L3 Chain ID: ${ansi.Green}${l3ChainId.chainId}${ansi.reset}`,
        );
        // This line should not be reached if the network detection fails
        expect(true).toBe(false);
      } catch (error: any) {
        console.log(
          `2.2 sequencer node URL로는 http 및 ws 접속이 되지 않아야 한다. \n  예상 결과 - could not detect network \n  실제 결과 - ${ansi.Red}${error.message}${ansi.reset}`,
        );
        expect(error.message).toMatch(/could not detect network/);
      }
    });

    it('2.3 block 동기화가 정상적으로 이루어져있어야 한다.', async () => {
      const url = new URL(ENV.L3_WS_FEED_URL);
      const host = url.hostname;
      const port = url.port;
      const client = new net.Socket();
      let connected = false;

      const result = await new Promise((resolve, reject) => {
        client.connect(port, host, () => {
          connected = true;
          client.end();
          resolve(true);
        });
        client.on('error', err => {
          client.end();
          if (!connected) {
            reject(new Error(`Failed to connect to ${host}:${port} - ${err.message}`));
          }
        });
        client.on('close', () => {
          if (connected) {
            resolve(true);
          } else {
            reject(new Error(`Failed to connect to ${host}:${port}`));
          }
        });
      });
      console.log(
        `2.3 block 동기화가 정상적으로 이루어져있어야 한다. L3 Feed Port 접속 확인. \n  예상 결과 - client connect {host}:{port}: true \n  실제 결과 - client connect ${host}:${port}: ${ansi.Green}${result}${ansi.reset}`,
      );
      expect(result).toEqual(true);
    });

    it('2.4 (full node에서) 발행된 transaction이 sequencer로 즉시 전달되어야 한다.', async () => {
      const bn = await l3_fn_prov.getBlockNumber();
      const bn_before = await l3_fn_prov.getBlock(bn);
      const devAddr = devWallet.w.address;
      const sendTx = await devWallet.sendTransaction(devAddr, '0.01');
      const txRes = await sendTx.wait();
      const txHash = txRes.transactionHash;
      const bn_lastest = await l3_fn_prov.getBlock(txRes.blockNumber);

      const sendTx2 = await devWallet.sendTransaction(devAddr, '0.01');
      const txRes2 = await sendTx2.wait();
      const txHash2 = txRes2.transactionHash;
      const bn_lastest2 = await l3_fn_prov.getBlock(txRes2.blockNumber);
      console.log(
        `2.4 (full node에서) 발행된 transaction이 sequencer로 즉시 전달되어야 한다. \n  예상 결과 - 1개 블록간 0~1초 차이 \n  실제 결과 - \n    before  BlockNumber: ${bn_before?.number}, Timestamp: ${bn_before?.timestamp} \n    Tx 발생: ${txHash}, 적힌 블록: ${txRes.blockNumber}\n    ${ansi.Green}lastest BlockNumber: ${bn_lastest?.number}, Timestamp: ${bn_lastest?.timestamp}${ansi.reset}\n    Tx 발생: ${txHash2}, 적힌 블록: ${txRes2.blockNumber}\n    ${ansi.Blue}lastest BlockNumber: ${bn_lastest2?.number}, Timestamp: ${bn_lastest2?.timestamp}${ansi.reset}`,
      );
      expect(bn_lastest.number).toBeGreaterThan(bn_before.number);
    });

    it('2.5 ~ 2.8 command', async () => {
      const l3fnurl = new URL(ENV.L3_FN_WS_URL);
      const l3fnhost = l3fnurl.hostname;
      const l3fnport = l3fnurl.port;
      const l3url = new URL(ENV.L3_WS_URL);
      const l3host = l3url.hostname;
      const l3port = l3url.port;

      console.log(
        `2.5 - [l3node] ./minimal-node.bash script send-l3 --ethamount 0.1 --wait --l3url ws:/${l3host}:${l3port} \n   [full-node] ./minimal-node.bash script send-l3 --ethamount 0.1 --wait --l3url ws:/${l3fnhost}:${l3fnport} \n2.6 - eth.getTransaction \n2.7 - eth.getBlock \n2.8 - ./minimal-node.bash docker stop l3node_full_node \n      ./minimal-node.bash --run --detach --l3-node-sp`,
      );
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
