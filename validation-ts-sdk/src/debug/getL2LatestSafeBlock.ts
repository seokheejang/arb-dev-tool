import { ethers } from 'ethers';

export const getL2LatestSafeBlock = async (url: string) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(url);
    const safedBlock = await provider.getBlock('safe');
    // console.log('RETURN >> ' + safedBlock.number);
    return safedBlock.number;
  } catch (error: any) {
    throw error;
  }
};
