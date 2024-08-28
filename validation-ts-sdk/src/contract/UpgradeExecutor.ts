import { ethers } from 'ethers';
import { abi, bytecode } from '@artifacts/contracts/UpgradeExecutor.sol/UpgradeExecutor.json';

export class UpgradeExecutor {
  public contract: ethers.Contract;
  constructor(
    address: string,
    provider: ethers.providers.JsonRpcProvider | ethers.providers.WebSocketProvider | ethers.Signer,
  ) {
    this.contract = new ethers.Contract(address, abi, provider);
  }

  public async executeCall(rollupAddress: string, makeCalldata: any) {
    return await this.contract.executeCall(rollupAddress, makeCalldata);
  }
}
