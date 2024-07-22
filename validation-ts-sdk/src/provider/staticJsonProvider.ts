import { ethers } from 'ethers';

export type TypeStaticJsonRpcProvider = ethers.providers.StaticJsonRpcProvider;

export class StaticJsonRpcProvider {
  public prov: ethers.providers.StaticJsonRpcProvider;
  constructor(url: string, timeout: number) {
    this.prov = new ethers.providers.StaticJsonRpcProvider({
      url,
      timeout,
    });
  }
}
