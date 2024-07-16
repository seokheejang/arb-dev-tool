import { ethers } from 'ethers';
import { etherToWei } from '@src/utils';

export type TypeWallet = ethers.Wallet;

export class Wallet {
  public w: ethers.Wallet;
  constructor(key: string, provider: any) {
    this.w = new ethers.Wallet(key, provider);
  }

  async sendTransaction(toAddress: string, value: string) {
    const ether = etherToWei(value);
    const tx: ethers.providers.TransactionRequest = {
      to: toAddress,
      value: ether,
      // @TODO: gas
      // gasLimit: gasLimit || undefined,
      // maxFeePerGas: maxFeePerGas,
      // maxPriorityFeePerGas: maxPriorityPerGas,
    };
    const result = await this.w.sendTransaction(tx);
    return result;
  }
}

export const generateWallet = (): string => {
  const wallet = ethers.Wallet.createRandom();
  return wallet.privateKey;
};

export const getAddressFromPrivkey = (privateKey: string): string => {
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
};
