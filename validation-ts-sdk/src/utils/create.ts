import { Bytes, ethers } from 'ethers';

const bytecode =
  '0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea26469706673582212206259db063a286ca61da86d5658debc10709079c0dc9b4eaaaa0219687676293364736f6c63430008120033';
const SENARIOCA = '0x537a179352a29e112435D121E866D839CbEe6791';

export const create2Address = (salt: string): string => {
  return ethers.utils.getCreate2Address(SENARIOCA, salt, ethers.utils.keccak256(bytecode));
};

export const saltToBytes32 = (salt: string): string => {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(salt));
};
