import { ethers } from 'ethers';
import {
  generateMnemonicWallet,
  getAddressFromPrivkey,
  getAddressFromString,
  getMultiplePrivateKeys,
} from '@src/wallet';

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2 || args[0] !== 'go') {
    console.error('Usage: npm run wallet getAddressFromPK <privateKey>');
    process.exit(1);
  }

  const args1 = args[1];
  console.log('args1', args1);
  // if (!ethers.utils.isHexString(args1, 32)) {
  //   console.error('Invalid private key');
  //   process.exit(1);
  // }

  try {
    // const address = getAddressFromPrivkey(args1);
    // const address = getAddressFromString(args1);
    // const mnemonic = generateMnemonicWallet();
    const key = getMultiplePrivateKeys(args1);

    console.log('result:', key);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
