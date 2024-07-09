import { ethers, BigNumber } from 'ethers';

export const sleep = async (ms: number): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, ms));
};

export function bigIntToString(int: BigNumber | bigint | number | string): string {
  return BigNumber.from(int).toString();
}

export function etherToWei(ether: string): string {
  return bigIntToString(ethers.utils.parseEther(ether).toString());
}

export function weiToEther(wei: string | BigNumber): string {
  let weiValue: BigNumber;
  if (typeof wei === 'string') {
    weiValue = ethers.BigNumber.from(wei);
  } else {
    weiValue = wei;
  }
  return ethers.utils.formatEther(weiValue);
}
