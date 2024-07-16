import { ethers } from 'ethers';
import { getAddressFromPrivkey } from '@src/wallet';

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2 || args[0] !== 'getAddrFromPK') {
    console.error('Usage: npm run wallet getAddressFromPK <privateKey>');
    process.exit(1);
  }

  const privateKey = args[1];

  if (!ethers.utils.isHexString(privateKey, 32)) {
    console.error('Invalid private key');
    process.exit(1);
  }

  try {
    const address = getAddressFromPrivkey(privateKey);
    console.log('Address:', address);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
