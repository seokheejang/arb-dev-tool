import { ethers } from 'ethers';
import { abi, bytecode } from '@artifacts/contracts/RollupAdminLogic.sol/RollupAdminLogic.json';

export class RollupAdminLogic {
  public contract: ethers.Contract;
  public iface: ethers.utils.Interface;
  constructor(
    address: string,
    provider: ethers.providers.JsonRpcProvider | ethers.providers.WebSocketProvider,
  ) {
    this.iface = new ethers.utils.Interface(abi);
    this.contract = new ethers.Contract(address, abi, provider);
  }

  public async isValidator(address: string) {
    return this.contract.isValidator(address);
  }
  public async makeCalldata(address: string, role: boolean) {
    return this.iface.encodeFunctionData('setValidator', [[address], [role]]); // minimumassertion period
  }

  public async printIsValidator(accounts: any) {
    let logResult = '';
    for (const [name, account] of Object.entries(accounts)) {
      const result = await this.isValidator(account as string);
      logResult += `${name} (${account}) isValidator: ${result}\n`;
    }
    console.log(logResult);
  }
}
