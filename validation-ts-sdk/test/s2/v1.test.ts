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
      console.log(
        `1.1 ERC-20\n  Deployed CA: ${ansi.Green}${res_deploy_ca}${ansi.reset} \n  txHash: ${res_deploy_txhash}`,
      );
      const erc20Inst = new ERC20(res_deploy_ca, l3_fn_prov).contract;
      const name = await erc20Inst.name();
      const symbol = await erc20Inst.symbol();
      const decimals = await erc20Inst.decimals();
      const totalSupply = weiToEther(await erc20Inst.totalSupply());
      console.log(`erc20Inst`, name, symbol, decimals, totalSupply);
      const res_transfer = await reqApiPost(`${req}/transfer`, {
        ca: res_deploy_ca,
        to: toAddr,
        amount: '1',
        tries: 5,
      });
      console.log('res_transfer', res_transfer);
      const before_allowance = weiToEther(await erc20Inst.allowance(fromAddr, fromAddr));
      const res_approve = await reqApiPost(`${req}/approve`, {
        ca: res_deploy_ca,
        from: fromAddr,
        spender: fromAddr,
        amount: '1',
      });
      const after_allowance = weiToEther(await erc20Inst.allowance(fromAddr, fromAddr));
      console.log('res_approve', res_approve);
      console.log('allowance', before_allowance, after_allowance);

      const before_balanceOf = weiToEther(await erc20Inst.balanceOf(toAddr));
      const res_transferFrom = await reqApiPost(`${req}/transferFrom`, {
        ca: res_deploy_ca,
        from: fromAddr,
        to: toAddr,
        amount: '1',
        tries: 5,
      });
      const after_balanceOf = weiToEther(await erc20Inst.balanceOf(toAddr));
      console.log('res_transferFrom', res_transferFrom);
      console.log('balanceOf', before_balanceOf, after_balanceOf);
      expect(true).toEqual(true);
    });

    it('1.2 ERC-721', async () => {
      const req = `${api_url}/erc721`;
      const res_Deploy = await reqApiPost(`${req}/deploy`);
      const res_deploy_ca = res_Deploy.ca;
      const res_deploy_txhash = res_Deploy.txHash;
      console.log(
        `1.2 ERC-721\n  Deployed CA: ${ansi.Green}${res_deploy_ca}${ansi.reset} \n  txHash: ${res_deploy_txhash}`,
      );
      const erc721Inst = new ERC721(res_deploy_ca, l3_fn_prov).contract;
      const before_approved = await erc721Inst.getApproved(1);
      const res_approve = await reqApiPost(`${req}/approve`, {
        ca: res_deploy_ca,
        spender: toAddr,
        id: '1',
      });
      const after_approved = await erc721Inst.getApproved(1);
      console.log('res_approve', res_approve);
      console.log('getApproved', before_approved, after_approved);

      const before_ownerOf = await erc721Inst.ownerOf(3);
      const res_transferFrom = await reqApiPost(`${req}/transferFrom`, {
        ca: res_deploy_ca,
        from: fromAddr,
        to: toAddr,
        id: '3',
        tries: 2,
      });
      const after_ownerOf = await erc721Inst.ownerOf(3);
      console.log('res_transferFrom', res_transferFrom);
      console.log('ownerOf', before_ownerOf, after_ownerOf);
      expect(true).toEqual(true);
    });

    it('1.3 ERC-1155', async () => {
      const req = `${api_url}/erc1155`;
      const res_Deploy = await reqApiPost(`${req}/deploy`);
      const res_deploy_ca = res_Deploy.ca;
      const res_deploy_txhash = res_Deploy.txHash;
      console.log(
        `1.3 ERC-1155\n  Deployed CA: ${ansi.Green}${res_deploy_ca}${ansi.reset} \n  txHash: ${res_deploy_txhash}`,
      );
      const erc1155Inst = new ERC1155(res_deploy_ca, l3_fn_prov).contract;
      const before_ApprovedForAll = await erc1155Inst.isApprovedForAll(fromAddr, toAddr);
      const res_setApprovalAll = await reqApiPost(`${req}/setApprovalAll`, {
        ca: res_deploy_ca,
        spender: toAddr,
        approved: true,
      });
      const after_ApprovedForAll = await erc1155Inst.isApprovedForAll(fromAddr, toAddr);
      console.log('res_setApprovalAll', res_setApprovalAll);
      console.log('ApprovedForAll', before_ApprovedForAll, after_ApprovedForAll);

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
      console.log('res_safeTransferFrom', res_safeTransferFrom);
      console.log('balanceOf', before_balanceOf, after_balanceOf);

      const before_balanceOfBatch = (
        await erc1155Inst.balanceOfBatch([fromAddr, fromAddr, fromAddr], [6, 7, 8])
      ).map((balance: any) => weiToEther(balance));

      const res_safeBatchTransferFrom = await reqApiPost(`${req}/safeBatchTransferFrom`, {
        ca: res_deploy_ca,
        from: fromAddr,
        to: toAddr,
        ids: [6, 7, 8],
        amounts: [1, 1, 1],
        tries: 2,
      });
      const after_balanceOfBatch = (
        await erc1155Inst.balanceOfBatch([fromAddr, fromAddr, fromAddr], [6, 7, 8])
      ).map((balance: any) => weiToEther(balance));

      console.log('res_safeBatchTransferFrom', res_safeBatchTransferFrom);
      console.log('balanceOfBatch', before_balanceOfBatch, after_balanceOfBatch);
      expect(true).toEqual(true);
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
