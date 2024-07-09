import { ABI_NITRO_ABI_ROOT, ABI_BRIDGE_ABI_ROOT, ABI_ROOT } from '@src/config';
import { decodeCalldata } from '@src/modules/calldata.m';

export const parseCalldata = async (calldata: string) => {
  try {
    // const calldata =
    //   '0xa9059cbb000000000000000000000000b31ebc1baa9d165e5fbdf55ddff60ac0a68f336200000000000000000000000000000000000000000000003635c9adc5dea00000';
    const result = await decodeCalldata(calldata, [
      ABI_NITRO_ABI_ROOT,
      ABI_BRIDGE_ABI_ROOT,
      ABI_ROOT,
    ]);
    return result;
  } catch (error) {
    throw error;
  }
};
