import { ethers } from 'ethers';
import { processRawData, decompressAndDecode, getAllL2Msgs, decodeL2Msgs } from '@src/utils/brotli';

export const parseRollupData = async (data: string) => {
  let rawData = Uint8Array.from(Buffer.from(data, 'hex'));
  console.log('parseRollupData | rawData:', rawData);
  const compressedData = await processRawData(rawData);
  console.log('parseRollupData | compressedData:', compressedData);
  const result = await decompressAndDecode(compressedData);
  console.log('parseRollupData | decompressAndDecode:', result);

  const afterDelayedMessagesRead = 12;
  const l2Msgs = await getAllL2Msgs(result, afterDelayedMessagesRead);

  const txList: ethers.Transaction[] = [];
  for (let i = 0; i < l2Msgs.length; i++) {
    txList.push(...decodeL2Msgs(l2Msgs[i]));
  }

  // console.log(
  //   `Get all ${txList.length} l2 transaction and ${l2Msgs.length} blocks in this batch, writing tx to`,
  // );

  return txList;
};
