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

export function weiToGwei(wei: string | BigNumber): string {
  return ethers.utils.formatUnits(wei, 'gwei');
}

export function parseEther(ether: string): BigNumber {
  return ethers.utils.parseEther(ether);
}

export function getTime() {
  const now = new Date(Date.now());
  const formattedTime = now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const milliseconds = now.getMilliseconds();
  return `${formattedTime}.${milliseconds}`;
}

export function generateRandomHex(length: number): string {
  const hexChars = '0123456789abcdef';
  let hexString = '0x';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * hexChars.length);
    hexString += hexChars[randomIndex];
  }

  return hexString;
}

export function getByteFromData(data: string): number {
  return (data.startsWith('0x') ? data.slice(2) : data).length / 2;
}
