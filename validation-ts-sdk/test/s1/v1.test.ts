import {
  ENV,
  HttpProvider,
  TypeHttpProvider,
  CustomWallet,
  TypeWallet,
  sleep,
  generateWallet,
  weiToEther,
  ansi,
} from '@src/index';

describe('1_STORY', () => {
  let l1_prov: TypeHttpProvider;
  let dev_key: string;
  let other_key: string;
  let devWallet: CustomWallet;
  let otherWallet: CustomWallet;

  beforeAll(async () => {
    dev_key = ENV.DEV_PRIV_KEY;
    l1_prov = new HttpProvider(ENV.L1_HTTP_URL).prov;
    devWallet = new CustomWallet(dev_key, l1_prov);
    other_key = generateWallet();
    otherWallet = new CustomWallet(other_key, l1_prov);
  });

  describe('Layer 1 구축 (244)', () => {
    console.log(
      `${ansi.Yellow}조회 방법 - ethers.js(5.7.2) Http JsonRpcProvider로 api method 조회 (eth_chainId, eth_getBlock, eth_getTransaction...)${ansi.reset}`,
    );
    it('1.1 node URL로 http 및 ws 접속이 되어야 한다.', async () => {
      const l1ChainId = (await l1_prov.getNetwork()).chainId;
      console.log(
        `1.1 node URL로 http 및 ws 접속이 되어야 한다. \n  예상 결과 - L1 Chain ID: ${ENV.L1_CHAIN_ID} \n  실제 결과 - L1 Chain ID: ${ansi.Green}${l1ChainId}${ansi.reset}`,
      );
      expect(l1ChainId).toEqual(ENV.L1_CHAIN_ID);
    });

    it('1.2 node에서 new block 생성 진행되어야 한다. block이 약 12초마다 생성됨을 확인한다.', async () => {
      const bn = await l1_prov.getBlockNumber();
      const bn_before = await l1_prov.getBlock(bn);
      const devAddr = devWallet.w.address;
      const sendTx = await devWallet.sendTransaction(devAddr, '0.01');
      const txRes = await sendTx.wait();
      const txHash = txRes.transactionHash;
      const bn_lastest = await l1_prov.getBlock(txRes.blockNumber);
      console.log(
        `1.2 node에서 new block 생성 진행되어야 한다. block이 약 12초마다 생성됨을 확인한다. \n  예상 결과 - 1개 블록간 12초 차이 \n  실제 결과 - \n    before  BlockNumber: ${bn_before?.number}, Timestamp: ${bn_before?.timestamp} \n    Tx 발생: ${txHash}, 적힌 블록: ${txRes.blockNumber}\n    ${ansi.Green}lastest BlockNumber: ${bn_lastest?.number}, Timestamp: ${bn_lastest?.timestamp}${ansi.reset}`,
      );
      expect(bn_lastest.number).toBeGreaterThan(bn_before.number);
    });

    it('1.3 block 정보의 difficulty 값이 0임을 확인한다. (pos 합의)', async () => {
      const bn = await l1_prov.getBlockNumber();
      const block = await l1_prov.getBlock(bn);
      console.log(
        `1.3 block 정보의 difficulty 값이 0임을 확인한다. (pos 합의) \n  예상 결과 - difficulty: 0 \n  실제 결과 - difficulty: ${ansi.Green}${block?.difficulty}${ansi.reset} blockNumber: ${bn}`,
      );
      expect(Number(0)).toEqual(Number(block?.difficulty));
    });

    it('1.4 block 정보의 nonce 값이 0x0000000000000000임을 확인한다. (pos 합의)', async () => {
      const bn = await l1_prov.getBlockNumber();
      const block = await l1_prov.getBlock(bn);
      console.log(
        `1.4 block 정보의 nonce 값이 0x0000000000000000임을 확인한다. (pos 합의) \n  예상 결과 - nonce: 0x0000000000000000 \n  실제 결과 - nonce: ${ansi.Green}${block?.nonce}${ansi.reset} blockNumber: ${bn}`,
      );
      expect(`0x0000000000000000`).toEqual(block?.nonce);
    });

    it('1.5 node로 transaction 발행 시 block에 포함되어야 한다.', async () => {
      const devAddr = devWallet.w.address;
      const sendTx = await devWallet.sendTransaction(devAddr, '0.01');
      const txRes = await sendTx.wait();
      const txHash = txRes.transactionHash;
      const bn = txRes.blockNumber;
      const block = await l1_prov.getBlock(bn);
      console.log(
        `1.5 node로 transaction 발행 시 block에 포함되어야 한다. \n  예상 결과 - 발생 시킨 Tx Hash: ${txHash} \n  실제 결과 - ${bn} 블록에 포함된 Txs: ${ansi.Green}${block.transactions}${ansi.reset}`,
      );
      expect(block.transactions.includes(txHash)).toEqual(true);
    });

    it('1.6 ETH 송금 transaction이 정상적으로 처리되며 송금 전 잔고의 함과 송금 후 잔고의 합이 같아야 한다.', async () => {
      const amount = '0.0001';
      const devAddr = devWallet.w.address;
      const otherAddr = otherWallet.w.address;
      const beforeDevBal = weiToEther(await devWallet.w.getBalance());
      const beforeOtherBal = weiToEther(await otherWallet.w.getBalance());
      const sendTx = await devWallet.sendTransaction(otherAddr, amount);
      const txRes = await sendTx.wait();
      const txHash = txRes.transactionHash;
      const afterDevBal = weiToEther(await devWallet.w.getBalance());
      const afterOtherBal = weiToEther(await otherWallet.w.getBalance());
      console.log(
        `1.6 ETH 송금 transaction이 정상적으로 처리되며 송금 전 잔고의 함과 송금 후 잔고의 합이 같아야 한다. \n  예상 결과 - before dev: ${beforeDevBal}, other:${beforeOtherBal} \n  실제 결과 - ${ansi.Green}after dev: ${afterDevBal}, other:${afterOtherBal}${ansi.reset} \n  txhash: ${txHash}`,
      );
      expect(afterOtherBal).toEqual(amount);
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
