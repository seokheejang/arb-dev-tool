import { Provider, ENV, TypeProvider } from "@src/index";

describe("1_STORY", () => {
  let l1_prov: TypeProvider;

  beforeAll(async () => {
    l1_prov = new Provider(ENV.L1_HTTP_URL).provider;
  });

  describe("Layer1 구축 (244)", () => {
    it("1.1 node URL로 http 및 ws 접속이 되어야 한다.", async () => {
      const l1ChainId = (await l1_prov.getNetwork()).chainId;
      console.log(
        `1.1 node URL로 http 및 ws 접속이 되어야 한다. \n  예상 결과: ${ENV.L1_CHAIN_ID} \n  실제 결과: ${l1ChainId}`
      );
      expect(l1ChainId).toEqual(BigInt(ENV.L1_CHAIN_ID));
    });
  });
});
