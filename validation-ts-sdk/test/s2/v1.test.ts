import {
  ENV,
  sleep,
  ansi,
  reqApiPost,
  ERC20,
  ERC721,
  ERC1155,
  TypeHttpProvider,
  HttpProvider,
  weiToEther,
} from '@src/index';

describe('2_STORY', () => {
  let api_url: string;
  let l3_fn_prov: TypeHttpProvider;

  beforeAll(async () => {
    api_url = ENV.TX_SIMULATOR_URL;
    l3_fn_prov = new HttpProvider(ENV.L3_FN_HTTP_URL).prov;
  });

  describe('Tx Simulator 개발 (254)', () => {
    console.log(`${ansi.Yellow}조회 방법 - Tx-Simulator Server API 조회${ansi.reset}`);
    const fromAddr = '0x07141f015eF4dd2077951aF88203d9C6fB470BB3';
    const toAddr = '0x0414AAC259bE3474Ec1789Da23b6cE3836B0fEC8';

    it('1.1 ERC-20', async () => {
      const req = `${api_url}/erc20`;
      const res_Deploy = await reqApiPost(`${req}/deploy`);
      const res_deploy_ca = res_Deploy.ca;
      const res_deploy_txhash = res_Deploy.txHash;
      const erc20Inst = new ERC20(res_deploy_ca, l3_fn_prov).contract;
      const name = await erc20Inst.name();
      const symbol = await erc20Inst.symbol();
      const totalSupply = weiToEther(await erc20Inst.totalSupply());
      console.log(
        `1.1 ERC-20\n  Deployed CA: ${ansi.Green}${res_deploy_ca}${ansi.reset} \n  txHash: ${ansi.Blue}${res_deploy_txhash}${ansi.reset} \n  name: ${name} \n  sybol: ${symbol} \n  totalSupply: ${totalSupply}`,
      );
      const before_transfer_balanceOf = weiToEther(await erc20Inst.balanceOf(toAddr));
      const res_transfer = await reqApiPost(`${req}/transfer`, {
        ca: res_deploy_ca,
        to: toAddr,
        amount: '1',
        tries: 5,
      });
      const after_transfer_balanceOf = weiToEther(await erc20Inst.balanceOf(toAddr));
      console.log(
        `  before token balanceOf: ${before_transfer_balanceOf} \n  transfer tx: [${ansi.Blue}${res_transfer.txHash}${ansi.reset}] \n  after token balanceOf: ${ansi.Green}${after_transfer_balanceOf}${ansi.reset}`,
      );
      const before_allowance = weiToEther(await erc20Inst.allowance(fromAddr, fromAddr));
      const res_approve = await reqApiPost(`${req}/approve`, {
        ca: res_deploy_ca,
        from: fromAddr,
        spender: fromAddr,
        amount: '1',
      });
      const after_allowance = weiToEther(await erc20Inst.allowance(fromAddr, fromAddr));
      console.log(
        `  before allowance: ${before_allowance} \n  approve tx: ${ansi.Blue}${res_approve.txHash}${ansi.reset}  \n  after allowance: ${ansi.Green}${after_allowance}${ansi.reset}`,
      );
      const before_balanceOf = weiToEther(await erc20Inst.balanceOf(toAddr));
      const res_transferFrom = await reqApiPost(`${req}/transferFrom`, {
        ca: res_deploy_ca,
        from: fromAddr,
        to: toAddr,
        amount: '1',
        tries: 5,
      });
      const after_balanceOf = weiToEther(await erc20Inst.balanceOf(toAddr));
      console.log(
        `  before token balanceOf: ${before_balanceOf} \n  transferFrom tx: [${ansi.Blue}${res_transferFrom.txHash}${ansi.reset}] \n  after token balanceOf: ${ansi.Green}${after_balanceOf}${ansi.reset}`,
      );
      expect(true).toEqual(true);
    });

    it('1.2 ERC-721', async () => {
      const req = `${api_url}/erc721`;
      const res_Deploy = await reqApiPost(`${req}/deploy`);
      const res_deploy_ca = res_Deploy.ca;
      const res_deploy_txhash = res_Deploy.txHash;
      console.log(
        `1.2 ERC-721\n  Deployed CA: ${ansi.Green}${res_deploy_ca}${ansi.reset} \n  txHash: ${ansi.Blue}${res_deploy_txhash}${ansi.reset}`,
      );
      const erc721Inst = new ERC721(res_deploy_ca, l3_fn_prov).contract;
      const before_approved = await erc721Inst.getApproved(1);
      const res_approve = await reqApiPost(`${req}/approve`, {
        ca: res_deploy_ca,
        spender: toAddr,
        id: '1',
      });
      const after_approved = await erc721Inst.getApproved(1);
      console.log(
        `  before approved: ${before_approved} \n  approve tx: ${ansi.Blue}${res_approve.txHash}${ansi.reset}  \n  after approved: ${ansi.Green}${after_approved}${ansi.reset}`,
      );
      const before_ownerOf = await erc721Inst.ownerOf(3);
      const res_transferFrom = await reqApiPost(`${req}/transferFrom`, {
        ca: res_deploy_ca,
        from: fromAddr,
        to: toAddr,
        id: '3',
        tries: 2,
      });
      const after_ownerOf = await erc721Inst.ownerOf(3);
      console.log(
        `  before ownerOf: ${before_ownerOf} \n  transferFrom tx: [${ansi.Blue}${res_transferFrom.txHash}${ansi.reset}] \n  after ownerOf: ${ansi.Green}${after_ownerOf}${ansi.reset}`,
      );
      expect(true).toEqual(true);
    });

    it('1.3 ERC-1155', async () => {
      const req = `${api_url}/erc1155`;
      const res_Deploy = await reqApiPost(`${req}/deploy`);
      const res_deploy_ca = res_Deploy.ca;
      const res_deploy_txhash = res_Deploy.txHash;
      console.log(
        `1.3 ERC-1155\n  Deployed CA: ${ansi.Green}${res_deploy_ca}${ansi.reset} \n  txHash: ${ansi.Blue}${res_deploy_txhash}${ansi.reset}`,
      );
      const erc1155Inst = new ERC1155(res_deploy_ca, l3_fn_prov).contract;
      const before_ApprovedForAll = await erc1155Inst.isApprovedForAll(fromAddr, toAddr);
      const res_setApprovalAll = await reqApiPost(`${req}/setApprovalAll`, {
        ca: res_deploy_ca,
        spender: toAddr,
        approved: true,
      });
      const after_ApprovedForAll = await erc1155Inst.isApprovedForAll(fromAddr, toAddr);
      console.log(
        `  before ApprovedForAll: ${before_ApprovedForAll} \n  setApprovalAll tx: ${ansi.Blue}${res_setApprovalAll.txHash}  \n  after ApprovedForAll: ${ansi.Green}${after_ApprovedForAll}${ansi.reset}`,
      );

      const before_balanceOf = weiToEther(await erc1155Inst.balanceOf(fromAddr, 5));
      const res_safeTransferFrom = await reqApiPost(`${req}/safeTransferFrom`, {
        ca: res_deploy_ca,
        from: fromAddr,
        to: toAddr,
        id: 5,
        amount: '1',
        tries: 3,
      });
      const after_balanceOf = weiToEther(await erc1155Inst.balanceOf(fromAddr, 5));
      console.log(
        `  before token balanceOf: ${before_balanceOf} \n  safeTransferFrom tx: [${ansi.Blue}${res_safeTransferFrom.txHash}${ansi.reset}] \n  after token balanceOf: ${ansi.Green}${after_balanceOf}${ansi.reset}`,
      );
      const before_balanceOfBatch = (
        await erc1155Inst.balanceOfBatch([fromAddr, fromAddr, fromAddr], [6, 7, 8])
      ).map((balance: any) => weiToEther(balance));

      const res_safeBatchTransferFrom = await reqApiPost(`${req}/safeBatchTransferFrom`, {
        ca: res_deploy_ca,
        from: fromAddr,
        to: toAddr,
        ids: [6, 7, 8],
        amounts: ['1000000000000000000', '1000000000000000000', '1000000000000000000'],
        tries: 2,
      });
      const after_balanceOfBatch = (
        await erc1155Inst.balanceOfBatch([fromAddr, fromAddr, fromAddr], [6, 7, 8])
      ).map((balance: any) => weiToEther(balance));
      console.log(
        `  before balanceOfBatch: ${before_balanceOfBatch} \n  safeBatchTransferFrom tx: ${ansi.Blue}${res_safeBatchTransferFrom.txHash}${ansi.reset} \n  after balanceOfBatch: ${ansi.Green}${after_balanceOfBatch}${ansi.reset}`,
      );
      expect(true).toEqual(true);
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
