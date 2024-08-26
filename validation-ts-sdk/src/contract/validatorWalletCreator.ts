import { ethers } from 'ethers';
import {
  abi,
  bytecode,
} from '@artifacts/contracts/ValidatorWalletCreator.sol/ValidatorWalletCreator.json';

export class ValidatorWalletCreator {
  public contract: ethers.Contract;
  public provider: ethers.providers.JsonRpcProvider | ethers.providers.WebSocketProvider;
  constructor(
    address: string,
    provider: ethers.providers.JsonRpcProvider | ethers.providers.WebSocketProvider,
  ) {
    this.provider = provider;
    this.contract = new ethers.Contract(address, abi, provider);
  }

  public async getWallet(address: string): Promise<string> {
    let wallet: any;
    const eventFilter = this.contract.filters.WalletCreated();
    const event = await this.contract.queryFilter(eventFilter, 1, this.provider.blockNumber);
    event.forEach((item: any) => {
      if (item.args.executorAddress == address) {
        wallet = item.args.walletAddress;
      }
    });
    return wallet;
  }
}
