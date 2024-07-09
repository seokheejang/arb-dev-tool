import { ethers } from 'ethers';

export type TypeHttpProvider = ethers.providers.JsonRpcProvider;

export class HttpProvider {
  public prov: ethers.providers.JsonRpcProvider;
  constructor(url: string) {
    this.prov = new ethers.providers.JsonRpcProvider(url);
  }
}
