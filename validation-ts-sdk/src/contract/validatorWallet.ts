import { ethers } from 'ethers';
import { abi, bytecode } from '@artifacts/contracts/ValidatorWallet.sol/ValidatorWallet.json';

export class ValidatorWallet {
  public contract: ethers.Contract;
  public singer:
    | ethers.providers.JsonRpcProvider
    | ethers.providers.WebSocketProvider
    | ethers.Wallet;
  constructor(address: string, singer: ethers.Wallet) {
    this.singer = singer;
    this.contract = new ethers.Contract(address, abi, singer);
  }

  // stake되어있던 금액 unstake
  public async unstake(validatorWalletAddress: string, rollupAddress: string): Promise<any> {
    const result = await this.contract.executeTransaction(
      `0x7427be51000000000000000000000000${validatorWalletAddress.slice(2)}`,
      rollupAddress,
      0,
      {
        gasLimit: 1000000,
      },
    );
    return result;
  }

  // validatorWallet을 통해서 staking하고 있던 금액을 validatorWallet으로 회수
  public async refundStake(rollupAddress: string): Promise<any> {
    const result = await this.contract.executeTransaction('0x61373919', rollupAddress, 0, {
      gasLimit: 1000000,
    });
    return result;
  }

  //wallet contract로부터 eoa로 금액 출금
  public async withdrawETHFromWalletContract(amount: string, eoa: string): Promise<any> {
    const result = await this.contract.withdrawEth(amount, eoa, {
      gasLimit: 1000000,
    });
    return result;
  }
}
