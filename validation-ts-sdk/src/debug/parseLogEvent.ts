import { BigNumber, ethers } from 'ethers';
import { ABI_BRIDGE_ABI_ROOT, ABI_NITRO_ABI_ROOT, ABI_ROOT } from '@src/config';
import { readJSONFilesInFolder } from '@src/modules/abiReader';
import { ansi } from '@src/utils/logStyle';

/**
 * CLI ts-node debug/parseLogEvent.ts
 */
export const parseLogEvent = async (recepit: any) => {
  try {
    // const recepit = await provider.getTransactionReceipt(txHash);
    const abi = readJSONFilesInFolder([ABI_NITRO_ABI_ROOT, ABI_BRIDGE_ABI_ROOT, ABI_ROOT], 'event');
    let iface = new ethers.utils.Interface(abi);

    recepit.logs.forEach((log: any, i: number) => {
      console.log(
        `${ansi.BrightMagenta}############################ ${i} index logs message ############################${ansi.reset}`,
      );
      const parse = iface.parseLog(log);
      let params: any = {};
      parse.eventFragment.inputs.forEach((param, i) => {
        const arg = parse.args[i];
        params[`${param.name}(${param.type})`] = BigNumber.isBigNumber(arg)
          ? BigNumber.from(arg).toString()
          : arg;
      });
      const result = {
        name: parse.name,
        signature: parse.signature,
        topic: parse.topic,
        params,
      };
      if (parse.name === 'InboxMessageDelivered') {
        console.log('@@@@@@ 1', params);
        console.log('@@@@@@ 2', params['data(bytes)']);
      }
      console.log(result);
      console.log('\n\n');
      return result;
    });
  } catch (error) {
    console.error(error);
  }
};
