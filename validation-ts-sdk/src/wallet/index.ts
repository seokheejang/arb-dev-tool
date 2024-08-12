import { ethers } from 'ethers';
import { etherToWei } from '@src/utils';

export type TypeWallet = ethers.Wallet;

export class CustomWallet {
  public w: ethers.Wallet;
  constructor(key: any, provider: any) {
    this.w = new ethers.Wallet(key, provider);
  }

  async sendTransaction(toAddress: string, value: string, data?: string) {
    const ether = etherToWei(value);
    const tx: ethers.providers.TransactionRequest = {
      to: toAddress,
      value: ether,
      data: data,
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

export const generateMnemonicWallet = (): { mnemonic: string; privateKey: string } => {
  const wallet = ethers.Wallet.createRandom();
  return {
    mnemonic: wallet.mnemonic.phrase,
    privateKey: wallet.privateKey,
  };
};

export const getMultiplePrivateKeys = (mnemonic: string, numberOfKeys: number = 10): string[] => {
  if (!ethers.utils.isValidMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic');
  }

  const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
  const keys: string[] = [];
  ``;

  for (let i = 0; i < numberOfKeys; i++) {
    const childNode = hdNode.derivePath(`m/44'/60'/0'/0/${i}`);
    keys.push(childNode.privateKey);
  }

  return keys;
};

export const getAddressFromString = (name: string): string => {
  const wallet = new ethers.Wallet(ethers.utils.sha256(ethers.utils.toUtf8Bytes(name)));
  console.log('wallet.privateKey', wallet.privateKey);
  console.log('wallet.address', wallet.address);
  return wallet.address;
};
