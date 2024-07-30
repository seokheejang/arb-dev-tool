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
    const spenderAddr = '0x2865C9f0E500844a78eC31fffAcc15E048C94029';

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
        `1.1 ERC-20\n  Deployed CA: ${ansi.Green}${res_deploy_ca}${ansi.reset} \n  txhash: ${ansi.Blue}${res_deploy_txhash}${ansi.reset} \n  name: ${name} \n  sybol: ${symbol} \n  totalSupply: ${totalSupply}`,
      );
      const before_from_transfer_balanceOf = weiToEther(await erc20Inst.balanceOf(fromAddr));
      const before_to_transfer_balanceOf = weiToEther(await erc20Inst.balanceOf(toAddr));
      const res_transfer = await reqApiPost(`${req}/transfer`, {
        ca: res_deploy_ca,
        to: toAddr,
        amount: '1',
        tries: 5,
      });
      const after_from_transfer_balanceOf = weiToEther(await erc20Inst.balanceOf(fromAddr));
      const after_to_transfer_balanceOf = weiToEther(await erc20Inst.balanceOf(toAddr));
      console.log(
        `= Transfer ${fromAddr} -> ${toAddr}, amount: 1, tries: 5  \n  txhash: [${ansi.Blue}${res_transfer.txHash}${ansi.reset}] \n  before token balanceOf - ${fromAddr}: ${before_from_transfer_balanceOf}, ${toAddr}: ${before_to_transfer_balanceOf}\n  after token balanceOf: - ${fromAddr}: ${ansi.Green}${after_from_transfer_balanceOf}${ansi.reset}, ${toAddr}: ${ansi.Green}${after_to_transfer_balanceOf}${ansi.reset}`,
      );
      const before_allowance = weiToEther(await erc20Inst.allowance(fromAddr, spenderAddr));
      const res_approve = await reqApiPost(`${req}/approve`, {
        ca: res_deploy_ca,
        from: fromAddr,
        spender: spenderAddr,
        amount: '5',
      });
      const after_allowance = weiToEther(await erc20Inst.allowance(fromAddr, spenderAddr));
      console.log(
        `= Approve ${fromAddr} -> ${spenderAddr}  \n  txhash: ${ansi.Blue}${res_approve.txHash}${ansi.reset}  \n  before allowance: ${before_allowance} \n  after allowance: ${ansi.Green}${after_allowance}${ansi.reset}`,
      );
      const before_ori_balanceOf = weiToEther(await erc20Inst.balanceOf(fromAddr));
      const before_from_balanceOf = weiToEther(await erc20Inst.balanceOf(spenderAddr));
      const before_to_balanceOf = weiToEther(await erc20Inst.balanceOf(toAddr));
      const res_transferFrom = await reqApiPost(`${req}/transferFrom`, {
        ca: res_deploy_ca,
        from: spenderAddr,
        to: toAddr,
        amount: '1',
        tries: 5,
      });
      const after_ori_balanceOf = weiToEther(await erc20Inst.balanceOf(fromAddr));
      const after_from_balanceOf = weiToEther(await erc20Inst.balanceOf(spenderAddr));
      const after_to_balanceOf = weiToEther(await erc20Inst.balanceOf(toAddr));
      console.log(
        `= TransferFrom ${spenderAddr} -> ${toAddr}, amount: 1, tries: 5 \n  txhash: [${ansi.Blue}${res_transferFrom.txHash}${ansi.reset}] \n  before token balanceOf - ${fromAddr}: ${before_ori_balanceOf}, ${spenderAddr}: ${before_from_balanceOf}, ${toAddr}: ${before_to_balanceOf}\n  after token balanceOf: - ${fromAddr}: ${ansi.Green}${after_ori_balanceOf}${ansi.reset}, ${spenderAddr}: ${ansi.Green}${after_from_balanceOf}${ansi.reset}, ${toAddr}: ${ansi.Green}${after_to_balanceOf}${ansi.reset}`,
      );
      expect(true).toEqual(true);
    });

    it('1.2 ERC-721', async () => {
      const req = `${api_url}/erc721`;
      const res_Deploy = await reqApiPost(`${req}/deploy`);
      const res_deploy_ca = res_Deploy.ca;
      const res_deploy_txhash = res_Deploy.txHash;
      const erc721Inst = new ERC721(res_deploy_ca, l3_fn_prov).contract;
      const name = await erc721Inst.name();
      const symbol = await erc721Inst.symbol();
      console.log(
        `1.2 ERC-721\n  Deployed CA: ${ansi.Green}${res_deploy_ca}${ansi.reset} \n  txhash: ${ansi.Blue}${res_deploy_txhash}${ansi.reset} \n  name: ${name} \n  sybol: ${symbol}`,
      );
      const res_mint0 = await reqApiPost(`${req}/mint`, {
        ca: res_deploy_ca,
        to: fromAddr,
      });
      const res_mint1 = await reqApiPost(`${req}/mint`, {
        ca: res_deploy_ca,
        to: fromAddr,
      });
      const after_mint_ownerOf = await erc721Inst.ownerOf(0);
      console.log(
        `= Mint 0, 1 -> ${fromAddr}  \n  txhash: ${ansi.Blue}[${res_mint0.txHash}, ${res_mint1.txHash}]${ansi.reset}  \n  before ownerOf: x \n  after ownerOf: ${ansi.Green}${after_mint_ownerOf}${ansi.reset}`,
      );
      const before_mint1_ownerOf = await erc721Inst.ownerOf(1);
      const res_transfer = await reqApiPost(`${req}/transfer`, {
        ca: res_deploy_ca,
        from: fromAddr,
        to: toAddr,
        id: '1',
      });
      const after_mint1_ownerOf = await erc721Inst.ownerOf(1);
      console.log(
        `= Transfer ${fromAddr} -> ${toAddr}, \n  txhash: [${ansi.Blue}${res_transfer.txHash}${ansi.reset}] \n  id: 1 \n  before ownerOf: ${before_mint1_ownerOf} \n  after ownerOf: ${ansi.Green}${after_mint1_ownerOf}${ansi.reset}`,
      );

      const before_approved = await erc721Inst.getApproved(0);
      const res_approve = await reqApiPost(`${req}/approve`, {
        ca: res_deploy_ca,
        spender: spenderAddr,
        id: '0',
      });
      const after_approved = await erc721Inst.getApproved(0);
      console.log(
        `= Approve ${fromAddr} -> ${spenderAddr}, \n  txhash: ${ansi.Blue}${res_approve.txHash}${ansi.reset} \n  id: 0 \n  before approved: ${before_approved} \n  after approved: ${ansi.Green}${after_approved}${ansi.reset}`,
      );

      const before_transferFrom_ownerOf = await erc721Inst.ownerOf(0);
      const res_transferFrom = await reqApiPost(`${req}/transferFrom`, {
        ca: res_deploy_ca,
        from: spenderAddr,
        to: toAddr,
        id: '0',
      });
      const after_transferFrom_ownerOf = await erc721Inst.ownerOf(0);
      console.log(
        `= TransferFrom ${spenderAddr} -> ${toAddr}, \n  txhash: [${ansi.Blue}${res_transferFrom.txHash}${ansi.reset}] \n  id: 0 \n  before ownerOf: ${before_transferFrom_ownerOf} \n  after ownerOf: ${ansi.Green}${after_transferFrom_ownerOf}${ansi.reset}`,
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
        `= ApprovedForAll ${toAddr} \n  txhash: ${ansi.Blue}${res_setApprovalAll.txHash}${ansi.reset} \n  before ApprovedForAll: ${before_ApprovedForAll} \n  after ApprovedForAll: ${ansi.Green}${after_ApprovedForAll}${ansi.reset}`,
      );

      const before_from_balanceOf = weiToEther(await erc1155Inst.balanceOf(fromAddr, 5));
      const before_to_balanceOf = weiToEther(await erc1155Inst.balanceOf(toAddr, 5));
      const res_safeTransferFrom = await reqApiPost(`${req}/safeTransferFrom`, {
        ca: res_deploy_ca,
        from: fromAddr,
        to: toAddr,
        id: 5,
        amount: '1',
        tries: 1,
      });
      const after_from_balanceOf = weiToEther(await erc1155Inst.balanceOf(fromAddr, 5));
      const after_to_balanceOf = weiToEther(await erc1155Inst.balanceOf(toAddr, 5));
      console.log(
        `= SafeTransferFrom ${fromAddr} -> ${toAddr}, id: 5, amount: 1 \n  txhash: [${ansi.Blue}${res_safeTransferFrom.txHash}${ansi.reset}] \n  before token balanceOf: - ${fromAddr}: ${before_from_balanceOf}, ${toAddr}: ${before_to_balanceOf} \n  after token balanceOf: - ${fromAddr}: ${ansi.Green}${after_from_balanceOf}${ansi.reset}, ${toAddr}: ${ansi.Green}${after_to_balanceOf}${ansi.reset}`,
      );
      const before_from_balanceOfBatch = (
        await erc1155Inst.balanceOfBatch([fromAddr, fromAddr, fromAddr], [6, 7, 8])
      ).map((balance: any) => weiToEther(balance));
      const before_to_balanceOfBatch = (
        await erc1155Inst.balanceOfBatch([toAddr, toAddr, toAddr], [6, 7, 8])
      ).map((balance: any) => weiToEther(balance));
      const res_safeBatchTransferFrom = await reqApiPost(`${req}/safeBatchTransferFrom`, {
        ca: res_deploy_ca,
        from: fromAddr,
        to: toAddr,
        ids: [6, 7, 8],
        amounts: ['1000000000000000000', '1000000000000000000', '1000000000000000000'],
      });
      const after_from_balanceOfBatch = (
        await erc1155Inst.balanceOfBatch([fromAddr, fromAddr, fromAddr], [6, 7, 8])
      ).map((balance: any) => weiToEther(balance));
      const after_to_balanceOfBatch = (
        await erc1155Inst.balanceOfBatch([toAddr, toAddr, toAddr], [6, 7, 8])
      ).map((balance: any) => weiToEther(balance));
      console.log(
        `= SafeBatchTransferFrom ${fromAddr} -> ${toAddr}, ids: [6, 7, 8], amounts: [1, 1, 1] \n  txhash: ${ansi.Blue}${res_safeBatchTransferFrom.txHash}${ansi.reset} \n  before balanceOfBatch: - ${fromAddr}: ${before_from_balanceOfBatch}, ${toAddr}: ${before_to_balanceOfBatch} \n  after balanceOfBatch: - ${fromAddr}: ${ansi.Green}${after_from_balanceOfBatch}${ansi.reset}, ${toAddr}: ${ansi.Green}${after_to_balanceOfBatch}${ansi.reset}`,
      );
      expect(true).toEqual(true);
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
