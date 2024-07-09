import { ethers } from 'ethers';

export type TypeWsProvider = ethers.providers.WebSocketProvider;

export class WsProvider {
  public prov: ethers.providers.WebSocketProvider;
  constructor(url: string) {
    this.prov = new ethers.providers.WebSocketProvider(url);
  }
}
