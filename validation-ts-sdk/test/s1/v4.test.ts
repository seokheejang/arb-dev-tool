import { ENV, sleep, ansi, reqApiPost, reqApiGet, create2Address, saltToBytes32 } from '@src/index';

describe('1_STORY', () => {
  let api_url: string;

  beforeAll(async () => {
    api_url = ENV.TX_SIMULATOR_URL;
  });

  describe('Genesis Block Script 생성 (247)', () => {
    it('4.1 EIP-155: Chain Relay Attack Protection이 체인에 적용되어 있음을 확인한다.', async () => {
      const api = `${api_url}/senario/eip155`;
      const apiRes = await reqApiPost(api);
      console.log(
        `4.1 EIP-155: 다른 체인에서 생성된 tx를 실행할 수 없다. L1 chain에서 생성한 tx를 L3에서 실행할 경우 \n  예상 결과 - chainId address mismatch \n  ${ansi.Green}실제 결과 - ${apiRes.error}${ansi.reset}`,
      );
      expect(apiRes.error).toMatch(/chainId address mismatch/);
    });

    it('4.2 EIP-158: State-Clearing Mechanism이 체인에 정상적으로 적용되어 있음을 확인한다.', async () => {
      const api = `${api_url}/senario/newAccount`;
      const apiRes = await reqApiGet(api);
      console.log(
        `4.2 EIP-158: 생성된 account의 nonce와 balance가 0임을 확인한다. \n  예상 결과 - nonce: 0 \n  ${ansi.Green}실제 결과 - address: ${apiRes.address}, nonce: ${apiRes.nonce}${ansi.reset}`,
      );
      expect(apiRes.nonce).toEqual(0);
    });

    it('4.3 EIP-1014: Create2 Opcode가 정상적으로 반영되어 있음을 확인한다.', async () => {
      const salt = Math.floor(Math.random() * 9000000000) + 1000000000; // 10자리 수
      const bytesSalt = saltToBytes32(salt.toString());
      const offCreate2 = create2Address(bytesSalt);
      const api = `${api_url}/senario/create2/${salt}`;
      const apiRes = await reqApiPost(api);
      console.log(
        `4.3 EIP-1014: EVM상의 create2의 동작을 확인한다. create2를 사용하여 배포한 컨트랙트의 주소가 오프체인에서 계산한 주소와 동일한지 비교, \n  예상 결과 - ${offCreate2.toLowerCase()} \n  ${
          ansi.Green
        }실제 결과 - ${apiRes.realCA}${ansi.reset}`,
      );
      expect(apiRes.realCA.toLowerCase()).toEqual(offCreate2.toLowerCase());
    });

    it('4.4 EIP-658: Transaction Receipt에 Status field가 정상적으로 반영되어 있음을 확인한다.', async () => {
      const api = `${api_url}/senario/eip658`;
      const apiRes = await reqApiPost(api);
      const status = apiRes.receipt.status;
      console.log(
        `4.4 EIP-658: receipt가 'status' field 포함하는 것을 확인한다. \n  예상 결과 - 1 \n  ${ansi.Green}실제 결과 - ${status} txhash: ${apiRes.receipt.transactionHash}${ansi.reset}`,
      );
      expect(status).toEqual(1);
    });

    it('4.5 EIP-1559, 2718: EIP-1559 Transaction을 지원하는지 확인한다.', async () => {
      const api = `${api_url}/senario/txType`;
      const apiRes = await reqApiPost(api);
      const tpye1 = apiRes.txType1;
      const tpye2 = apiRes.txType2;
      console.log(
        `4.5 EIP-1559: receipt가 서로 다른 tx_type 필드를 포함하는 것을 확인한다. 1559 'gas' field를 포함한 tx_type 2의 transaction을 확인한다. \n  예상 결과 - txType 1,2 / max_priority_fee_per_gas, max_fee_per_gas 필드 확인 \n  ${ansi.Green}실제 결과 -\n    Legacy Tx type: ${tpye1.type}, txhash: ${tpye1.hash}\n    gas field: gasLimit(${tpye1.gasLimit.hex})\n    1559 Tx type: ${tpye2.type}, txhash: ${tpye2.hash}\n    gas field: maxPriorityFeePerGas(${tpye2.maxPriorityFeePerGas.hex}), maxFeePerGas(${tpye2.maxFeePerGas.hex})${ansi.reset}`,
      );
      expect(tpye2.type).toEqual(2);
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
