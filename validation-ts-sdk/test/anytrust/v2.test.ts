import {
  ENV,
  HttpProvider,
  TypeHttpProvider,
  CustomWallet,
  sleep,
  TypeWsProvider,
  WsProvider,
  ansi,
  parseCalldata,
  parseRollupData,
  extractFunctionSelectors,
  printFunctionSelectors,
  decodeL2Msgs,
  getAllL2Msgs,
} from '@src/index';
import * as SequencerInboxJSON from '@artifacts/contracts/bridge/SequencerInbox.sol/SequencerInbox.json';
import { ethers } from 'ethers';
import { Base64 } from 'js-base64';

describe('AnytrustTest', () => {
  const dasMirrorUrl = 'http://localhost:7877';
  // anytrust
  // const rollupTxInput = `0x8f111f3c000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001c00000000000000000000000000000000000000000000000000000000000000b288b278a1d36c8c2a8d0c706515649da5147427a79aa8ba616010b811a94df2fff9721bfd9f1e4249340ebe8fadfb2263cb733c121d1b9b8bd00a67c6768efd73f6000000006799b9d00100000000000000030587d63e5ae60d2cbe781f5008cb37d72d2b941ded061fefcf6cf39d4ba3c2fb4fe1998d93eda8ff3000e3a07ab9c04c0787df5fd510211290588caf2385a4f09e9ff8573adf9417f2638dc3b822c0ab904342a106837d34fe50ffa30bd207ea0000000000000000000000000000`;
  // const rollupTxInput = `0x8f111f3c000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001f00000000000000000000000000000000000000000000000000000000000000b288b57c172f63dcef1ef7fc322cfac611afd5637e2a4348ab295c5411706c655e7a066d9b249e073492dc034e0af9bf711222421b900918adf5ad0aa639d9e1566e000000006799d55d01000000000000000313e886299d6a11f985df2fbb945cabb9168a51f954770d7c3bfa269ac6d702ae30012e5d496d1741420b350db933180f0446ca197cc5815cab7ebaab9457bbe15a6c4ec5506109dfc30bb629c7be24399867038301c4339b93b85c2fb9980c620000000000000000000000000000`;
  const rollupTxInput = `0x8f111f3c000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000000000000000000b2889b1afb4c294d940225fc8a0967196b3ad2b2ca7816b2599ea95647aeff7838383e32fdb8ce0e3ae54c648e7927148067e1f1dde20c90be3c4be34c03faa48a7300000000679c9e980100000000000000030b8afba56b0b0e66d06c6dd9613e8a561e862dba70556315769b95a949575331c40074f775d12b77d385d0b7e69d84360ea804a1a4cc8aaff8efb3ed52cab2cee76e0875e322805e7ecef887763b2385be91e7e8f2b1d0ed9c2b11c39a9eb4da0000000000000000000000000000`;

  // rollup
  // const rollupTxInput = `0x8f111f3c000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000000000000000008d008b4380860384664fe5ad8404827653b87a000402f87583064aba028459682f00846553f10082520894940e3cb4f37ae0259499e71f3a558b5de0471fa0888ac7230489e8000080c080a0663d90345e6cbae3de3dcb8cfc8d0d33441fbddc0e79d70bb0b24cd0cf4d5e46a059ed12e597e156cd19d28378012b194d0c751931f95e12376fb4845101a97bca0300000000000000000000000000000000000000`;

  describe('abi', () => {
    it('1', async () => {
      // 함수 선택자 추출
      const selectors = extractFunctionSelectors(SequencerInboxJSON.abi as any);
      printFunctionSelectors(selectors);
    });
  });
  describe('parseCalldata', () => {
    it('1', async () => {
      const parsedL1CallData = await parseCalldata(rollupTxInput);
      console.log('parsedL1CallData:', parsedL1CallData);

      const callData = parsedL1CallData?.params['data(bytes)'];
      console.log('callData', callData);

      let rawData = Uint8Array.from(Buffer.from(callData.substring(2), 'hex'));
      console.log('rawData uint8array[0]:', rawData);

      const dataHash = ethers.utils.hexlify(rawData.subarray(33, 65));
      console.log('dataHash', dataHash);

      let req;
      let base64Data;
      try {
        const requestUrl = dasMirrorUrl + `/get-by-hash/` + dataHash.substring(2);
        req = await fetch(requestUrl);
        base64Data = await req.json();
        if (!base64Data['data']) {
          throw new Error('Empty data');
        }
        console.log('mirror server request:', base64Data);
      } catch (error: any) {
        throw new Error('try it later or check your network connection.');
      }
      const base64 = Base64.toUint8Array(base64Data.data);
      console.log('base64', base64);

      const bufMessage = Buffer.from(base64Data.data, 'base64');
      const parsedL2Msg = decodeL2Msgs(bufMessage);
      const parsedAllL2Msg = await getAllL2Msgs([bufMessage], 12);
      console.log('bufMessage', bufMessage);
      console.log('parsedL2Msg', parsedL2Msg);
      console.log('parsedAllL2Msg', parsedAllL2Msg);
      let hexData = '';
      parsedAllL2Msg.forEach(msg => {
        hexData += Buffer.from(msg).toString('hex');
      });

      console.log('hexData:', hexData);

      const decodedString = Buffer.from(`${hexData}`, 'hex').toString('utf8');
      console.log('decodedString', decodedString);

      const feedl2Msg = `BAL4dIINBQGEWWgvAIRlU/EAglIIlJQOPLTzeuAllJnnHzpVi13gRx+giIrHIwSJ6AAAgMABoHUPvh1szM2EFCpRFQp4w+XKuRSbBmtiiq49hwn9BGI1oCC1CdAiAMtAnc2nDjmURBWvOM0lmLBylruUSNVGfn3Q`;
      // const feedl2MsgBase64 = Base64.toUint8Array(feedl2Msg);
      const feedBufMessage = Buffer.from(feedl2Msg, 'base64');
      console.log('feedBufMessage', feedBufMessage);
      const feedParsedL2Msg = decodeL2Msgs(feedBufMessage);
      console.log('feedParsedL2Msg', feedParsedL2Msg);
      const feedParsedAllL2Msg = await getAllL2Msgs([feedBufMessage], 12);
      console.log('feedParsedAllL2Msg', feedParsedAllL2Msg);

      expect(1).toEqual(1);
    });
  });
});
