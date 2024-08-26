import { ethers } from 'ethers';
import { abi, bytecode } from '@artifacts/contracts/RollupUserLogic.sol/RollupUserLogic.json';

export class Rollup {
  public contract: ethers.Contract;
  constructor(
    address: string,
    provider: ethers.providers.JsonRpcProvider | ethers.providers.WebSocketProvider,
  ) {
    this.contract = new ethers.Contract(address, abi, provider);
  }

  public on(event: string, listener: ethers.providers.Listener) {
    this.contract.on(event, listener);
  }

  public off(event: string, listener: ethers.providers.Listener) {
    this.contract.off(event, listener);
  }

  public removeAllListeners() {
    this.contract.removeAllListeners();
  }
  public async latestStakedNode(contractWalletAddr: string) {
    return this.contract.latestStakedNode(contractWalletAddr);
  }

  public async amountStaked(contractWalletAddr: string) {
    return this.contract.amountStaked(contractWalletAddr);
  }
}
