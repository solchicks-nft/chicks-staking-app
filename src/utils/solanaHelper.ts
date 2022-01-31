import { PublicKey, Connection, Signer } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
} from '@solana/spl-token';
import * as anchor from '@project-serum/anchor';
import ConsoleHelper from './consoleHelper';
import { sleep } from './helper';

const PubKeysInternedMap = new Map<string, PublicKey>();

export const toPublicKey = (key: string | PublicKey) => {
  if (typeof key !== 'string') {
    return key;
  }

  let result = PubKeysInternedMap.get(key);
  if (!result) {
    result = new PublicKey(key);
    PubKeysInternedMap.set(key, result);
  }

  return result;
};

export const validatePublicKey = (key: string | PublicKey): boolean => {
  try {
    return PublicKey.isOnCurve(toPublicKey(key).toBuffer());
  } catch (e) {
    return false;
  }
};

export const isAddress = validatePublicKey;

export const pubkeyToString = (key: PublicKey | null | string = '') =>
  typeof key === 'string' ? key : key?.toBase58() || '';

export const getAssociatedTokenAddress = async (
  mintKey: PublicKey | string,
  ownerKey: PublicKey | string,
): Promise<PublicKey> =>
  Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    toPublicKey(mintKey),
    toPublicKey(ownerKey),
  );

export const getTokenBalance = async (
  connection: Connection,
  pubkey: PublicKey | string,
) =>
  new anchor.BN(
    (await connection.getTokenAccountBalance(toPublicKey(pubkey))).value.amount,
  );

export const getTokenObj = (
  connection: Connection,
  mintKey: PublicKey | string,
  payer: Signer,
) => new Token(connection, toPublicKey(mintKey), TOKEN_PROGRAM_ID, payer);

export const getTransactionInfoOnSol = async (
  connection: Connection,
  txId: string,
  retryCount = 3,
) => {
  let txInfo = null;
  let retry = 0;
  while (retry < retryCount) {
    retry += 1;
    // eslint-disable-next-line no-await-in-loop
    txInfo = await connection.getTransaction(txId);
    if (!txInfo) {
      ConsoleHelper(`getTransactionInfoOnSol: txId: ${txId} - retry: ${retry}`);
      // eslint-disable-next-line no-await-in-loop
      await sleep(5000);
    } else {
      break;
    }
  }
  return txInfo;
};
