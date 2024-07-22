import { ethers } from 'ethers';
import { abi, bytecode } from '@openzeppelin/contracts/build/contracts/ERC721.json';

export class ERC721 {
  public contract: ethers.Contract;
  constructor(
    address: string,
    provider: ethers.providers.JsonRpcProvider | ethers.providers.WebSocketProvider,
  ) {
    this.contract = new ethers.Contract(address, abi, provider);
  }
}
