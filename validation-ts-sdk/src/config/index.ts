import dotenv from 'dotenv';
dotenv.config();

export * from '@src/config/path';

export const ENV = {
  L1_HTTP_URL: String(process.env.L1_HTTP_URL || ''),
  L1_WS_URL: String(process.env.L1_WS_URL || ''),
  L1_CHAIN_ID: Number(process.env.L1_CHAIN_ID || 0),

  L2_HTTP_URL: String(process.env.L2_HTTP_URL || ''),
  L2_WS_URL: String(process.env.L2_WS_URL || ''),
  L2_CHAIN_ID: Number(process.env.L2_CHAIN_ID || 0),

  L3_HTTP_URL: String(process.env.L3_HTTP_URL || ''),
  L3_WS_URL: String(process.env.L3_WS_URL || ''),
  L3_WS_FEED_URL: String(process.env.L3_WS_FEED_URL || ''),
  L3_CHAIN_ID: Number(process.env.L3_CHAIN_ID || 0),

  L3_FN_HTTP_URL: String(process.env.L3_FN_HTTP_URL || ''),
  L3_FN_WS_URL: String(process.env.L3_FN_WS_URL || ''),

  DEV_PRIV_KEY: String(process.env.DEV_PRIV_KEY || ''),

  TX_SIMULATOR_URL: String(process.env.TX_SIMULATOR_URL || ''),

  L3_TEST_1_HTTP_URL: String(process.env.L3_TEST_1_HTTP_URL || ''),
  L3_TEST_2_HTTP_URL: String(process.env.L3_TEST_2_HTTP_URL || ''),
  L3_TEST_3_HTTP_URL: String(process.env.L3_TEST_3_HTTP_URL || ''),

  L3_TEST_1_MNEMONIC: String(process.env.L3_TEST_1_MNEMONIC || ''),
  L3_TEST_2_MNEMONIC: String(process.env.L3_TEST_2_MNEMONIC || ''),
  L3_TEST_3_MNEMONIC: String(process.env.L3_TEST_3_MNEMONIC || ''),

  L3_TEST_1_KEY: String(process.env.L3_TEST_1_KEY || ''),
  L3_TEST_2_KEY: String(process.env.L3_TEST_2_KEY || ''),
  L3_TEST_3_KEY: String(process.env.L3_TEST_3_KEY || ''),

  MINIMAL_L2_URL: String(process.env.MINIMAL_L2_URL || ''),
  MINIMAL_L3_URL: String(process.env.MINIMAL_L3_URL || ''),
};
