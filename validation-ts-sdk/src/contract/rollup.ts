import { ethers } from 'ethers';
import { abi, bytecode } from '@artifacts/contracts/RollupUserLogic.sol/RollupUserLogic.json';
import { weiToEther } from '@src/utils';
interface StakeInfoArgs {
  name: string;
  role: string;
  address: string;
  eoa: string;
}
export class Rollup {
  public contract: ethers.Contract;
  public provider: ethers.providers.JsonRpcProvider | ethers.providers.WebSocketProvider;
  constructor(
    address: string,
    provider: ethers.providers.JsonRpcProvider | ethers.providers.WebSocketProvider,
  ) {
    this.provider = provider;
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

  public async requireUnresolvedExists() {
    return this.contract.requireUnresolvedExists();
  }

  public async loserStakeEscrow() {
    return this.contract.loserStakeEscrow();
  }

  public async withdrawableFunds(address: string) {
    return this.contract.withdrawableFunds(address);
  }

  public async printStakeInfo(args: Record<string, StakeInfoArgs>, isEOA = false) {
    const accounts = Object.values(args);
    const nameWidth = 11;
    const roleWidth = 13;
    const addrWidth = 42;
    const lsnWidth = 13;
    const asWidth = 13;
    const fundWidth = 13;
    const balWidth = 13;

    let result = '';

    result += `${'Name'.padEnd(nameWidth)} | ${'Role'.padEnd(
      roleWidth,
    )} | ${'Validator Contract Wallet Address'.padEnd(addrWidth)} | ${'latest RBlock'.padEnd(
      lsnWidth,
    )} | ${'Amount Staked'.padEnd(asWidth)} | ${'Withdraw Fund'.padEnd(
      fundWidth,
    )} | ${'ETH Balance'.padEnd(balWidth)}\n`;

    const separator = '-'.repeat(
      nameWidth + roleWidth + addrWidth + lsnWidth + asWidth + fundWidth + balWidth + 20,
    );
    result += `${separator}\n`;

    for (const account of accounts) {
      const name = account.name.padEnd(nameWidth);
      const role = account.role.padEnd(roleWidth);
      const paddedCA = account.address.padEnd(addrWidth);
      const lsn = (await this.contract.latestStakedNode(account.address))
        .toString()
        .padEnd(lsnWidth);
      const as = weiToEther(await this.contract.amountStaked(account.address))
        .toString()
        .padEnd(asWidth);
      const fund = weiToEther(await this.contract.withdrawableFunds(account.address))
        .toString()
        .padEnd(fundWidth);
      const bal = weiToEther(await this.provider.getBalance(account.address))
        .toString()
        .padEnd(balWidth);

      result += `${name} | ${role} | ${paddedCA} | ${lsn} | ${as} | ${fund} | ${bal}\n`;
    }
    if (isEOA) {
      result += `${separator}\n`;
      for (const account of accounts) {
        const name = account.name.padEnd(nameWidth);
        const role = 'EOA'.padEnd(roleWidth);
        const eoa = account.eoa.padEnd(addrWidth);
        const lsn = ''.toString().padEnd(lsnWidth);
        const as = ''.toString().padEnd(asWidth);
        const fund = ''.toString().padEnd(fundWidth);
        const bal = weiToEther(await this.provider.getBalance(eoa))
          .toString()
          .padEnd(balWidth);

        result += `${name} | ${role} | ${eoa} | ${lsn} | ${as} | ${fund} | ${bal}\n`;
      }
    }

    result += `${separator}\n`;
    console.log(result);
  }
}
