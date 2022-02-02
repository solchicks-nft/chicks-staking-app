import axios from 'axios';
import BN from 'bn.js';
import { Connection, ParsedAccountData } from '@solana/web3.js';
import { URL_SERVER_INFO } from './solchickConsts';
import ConsoleHelper from './consoleHelper';
import { getSolChicksAssociatedAddress } from './solchickHelper';
import { pubkeyToString } from './solanaHelper';

export enum StakeMode {
  FLEXIBLE = 'flexible',
  LOCKED = 'locked',
}

export enum StakeStepMode {
  STAKE = 'stake',
  UNSTAKE = 'unstake',
}

export enum StakeStatusCode {
  NONE = 0,
  START,
  TOKEN_AMOUNT_CHECKING,
  PROCESSING,
  SUBMITTING,
  SUCCESS,
  FAILED = 101,
}

export enum StakeErrorCode {
  NO_ERROR,
  CANT_CONNECT_SOLANA,
  TOKEN_AMOUNT_NOT_ENOUGH,
  STAKE_FAILED,
  SOLANA_NO_ASSOC_ACCOUNT,
  SERVER_INVALID,
  SUBMIT_FAILED,
}

export interface IStakeStatus {
  stake(amount: number): void;
  unstake(amount: string, handle: string): void;
  isProcessing: boolean;
  statusCode: StakeStatusCode;
  errorCode: StakeErrorCode;
  lastError: string | null;
  sourceTxId: string;
}

export const createStakeStatus = (
  stake: (amount: number) => void,
  unstake: (handle: string, amount: string) => void,
  isProcessing: boolean,
  statusCode = StakeStatusCode.NONE,
  errorCode: StakeErrorCode,
  lastError: string | null,
  sourceTxId: string,
) => ({
  stake,
  unstake,
  isProcessing,
  statusCode,
  errorCode,
  lastError,
  sourceTxId,
});

export const getServerInfo = async () => {
  try {
    const result = await axios.get(URL_SERVER_INFO());
    if (result && result.data && result.data.success) {
      return true;
    }
  } catch (e) {
    ConsoleHelper(`getServerInfo: ${e}`);
  }
  return false;
};

export const isEnoughTokenOnSolana = async (
  solanaConnection: Connection,
  address: string,
  amount: string,
) => {
  if (!solanaConnection) {
    return false;
  }
  const bnStakeAmount = new BN(amount);
  const associatedKey = await getSolChicksAssociatedAddress(address);
  ConsoleHelper(
    `isEnoughTokenOnSolana -> associatedKey: ${pubkeyToString(associatedKey)}`,
  );
  let tokenAmount: BN = new BN(0);
  try {
    const parsedAccount = await solanaConnection.getParsedAccountInfo(
      associatedKey,
    );
    if (parsedAccount.value) {
      tokenAmount = new BN(
        (
          parsedAccount.value.data as ParsedAccountData
        ).parsed.info.tokenAmount.amount,
      );
      ConsoleHelper(`isEnoughTokenOnSolana -> parsedAccount`, parsedAccount);
      ConsoleHelper(
        `isEnoughTokenOnSolana -> tokenAmount`,
        tokenAmount.toString(),
      );
    }
  } catch (e) {
    ConsoleHelper(`isEnoughTokenOnSolana: ${e}`);
  }

  if (tokenAmount.cmp(bnStakeAmount) >= 0) {
  } else {
    return false;
  }
  return true;
};
