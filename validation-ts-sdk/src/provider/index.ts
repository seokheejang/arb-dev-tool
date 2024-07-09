import { JsonRpcProvider } from "ethers";

export type TypeProvider = JsonRpcProvider;

export class Provider {
  public provider: JsonRpcProvider;
  constructor(url: string) {
    this.provider = new JsonRpcProvider(url);
  }
}
