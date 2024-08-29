import { ENV, sleep, ansi, TypeHttpProvider, HttpProvider, getL2LatestSafeBlock } from '@src/index';
import {
  getArbitrumNetwork,
  mapL2NetworkToArbitrumNetwork,
  registerCustomArbitrumNetwork,
} from '@arbitrum/sdk';
import { SequencerInbox__factory } from '@arbitrum/sdk/dist/lib/abi/factories/SequencerInbox__factory.js';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const MAX_EVENT_BLOCK = 4900;

describe('4_STORY', () => {
  let l3_2_seq: TypeHttpProvider;
  let l3_3_seq: TypeHttpProvider;

  beforeAll(async () => {
    l3_2_seq = new HttpProvider(ENV.MINIMAL_L2_URL).prov;
    l3_3_seq = new HttpProvider(ENV.MINIMAL_L3_URL).prov;

    const l2l3NetworkPath = path.join(__dirname, 'minimal-l2l3Network.json');
    try {
      const data = await readFile(l2l3NetworkPath, 'utf8');
      const jsonData = JSON.parse(data);
      const dkargoNetwork = mapL2NetworkToArbitrumNetwork(jsonData.l2Network);
      registerCustomArbitrumNetwork(dkargoNetwork);
    } catch (err) {
      console.error('Error reading or parsing JSON file:', err);
    }
  });

  describe('Verify L3 Batch Transaction', () => {
    it('1.1', async () => {
      const l3Network = await getArbitrumNetwork(l3_3_seq);

      const SequencerInbox = SequencerInbox__factory.connect(
        l3Network.ethBridge.sequencerInbox,
        l3_2_seq,
      );
      const filter = SequencerInbox.filters['SequencerBatchDelivered']();

      const l2SafedBlock = await getL2LatestSafeBlock(ENV.MINIMAL_L2_URL); // ⭐️ lambda handler()
      const l2LatestBlock = await l3_2_seq.getBlockNumber();

      const batchTransactions = [];
      let to = 0;
      let from = 0;
      let isStop = false;
      let batchCount = 10; // Latest Batch Data 15개를 조회합니다.

      while (batchTransactions.length < batchCount && !isStop) {
        to = to == 0 ? await l3_2_seq.getBlockNumber() : to - MAX_EVENT_BLOCK;
        from = to - MAX_EVENT_BLOCK;

        // console.log(`Search Batch Tx from L2 Block ${from} ~ ${to}`);

        const _batchTransactions = await SequencerInbox.queryFilter(filter, from, to); // in the last 100 blocks

        for (let i = _batchTransactions.length - 1; i >= 0; i--) {
          if (batchTransactions.length >= batchCount) {
            isStop = true;
            break;
          }

          batchTransactions.push(_batchTransactions[i]);

          const { args } = _batchTransactions[i];
          const batchNumber = args.batchSequenceNumber;
          if (batchNumber.eq(0)) {
            isStop = true;
          }
        }
      }

      console.log(
        `Current L2 Latest Block Number : ${ansi.BrightYellow}${l2LatestBlock}${ansi.reset}\n` +
          `Current L2 Safed Block Number  : ${ansi.BrightGreen}${l2SafedBlock}${ansi.reset}\n\n` +
          `Searching Latest Batch Data    : ${batchTransactions.length} \n`,
      );

      const logOutput = batchTransactions
        .map(batch => {
          const { blockNumber, args } = batch;
          const batchNumber = args.batchSequenceNumber;
          return `Batch Number : ${batchNumber} ||  Batch Tx Block Number : ${blockNumber} || L2 Status : ${
            l2SafedBlock >= blockNumber
              ? `${ansi.BrightGreen}Finalized${ansi.reset}`
              : `${ansi.BrightRed}Unfinalized${ansi.reset}`
          }\n`;
        })
        .join('');

      console.log(logOutput);
    });

    it('finish', async () => {
      await sleep(1000);
    });
  });
});
