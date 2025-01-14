import { keccak256 } from 'ethers/lib/utils';

export function extractFunctionSelectors(abi: any[]): { [signature: string]: string } {
  const selectors: { [signature: string]: string } = {};

  for (const item of abi) {
    if (item.type === 'function') {
      const inputs = item.inputs.map((input: any) => input.type).join(',');
      const signature = `${item.name}(${inputs})`;
      const selector = keccak256(Buffer.from(signature)).slice(0, 10); // 첫 4바이트 추출
      selectors[signature] = selector;
    }
  }

  return selectors;
}

export function printFunctionSelectors(selectors: { [signature: string]: string }): void {
  const output = ['Function Selectors:'];
  for (const [signature, selector] of Object.entries(selectors)) {
    output.push(`${signature} -> ${selector}`);
  }
  console.log(output.join('\n'));
}
