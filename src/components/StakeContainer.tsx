import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Button,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@material-ui/core';
import { PublicKey } from '@solana/web3.js';
import Moment from 'react-moment';
import NumberFormat from 'react-number-format';
import { useStyles } from '../pages/useStyles';
import {
  StakeErrorCode,
  StakeLockedPoolLength,
  StakeMode,
  StakeStatusCode,
  StakeStepMode,
} from '../utils/stakeHelper';
import { isAddress } from '../utils/solanaHelper';
import ButtonWithLoader from './ButtonWithLoader';
import SolanaWalletKey from './SolanaWalletKey';
import ShowTx from './ShowTx';
import { CHAIN_ID_SOLANA } from '../lib/consts';
import ShowTxButton from './ShowTxButton';
import { FLEX_UNSTAKE_ACTIVE, UNSTAKE_FEE } from '../utils/consts';
import useStakeReconcile, {
  ReconcileErrorCode,
  ReconcileStatusCode,
} from '../hooks/useStakeReconcile';
import ConsoleHelper from '../utils/consoleHelper';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';
import useStake from '../hooks/useStake';
import { useStakePool } from '../contexts/StakePoolContext';

export const StakeContainer = ({
  stakeMode,
  lockedPoolLength,
}: {
  stakeMode: StakeMode;
  lockedPoolLength: StakeLockedPoolLength | null;
}) => {
  const classes = useStyles();
  const [tab, setTab] = useState(StakeStepMode.STAKE);
  const [inputVal, setInput] = useState('');
  const wallet = useSolanaWallet();
  const [currentHandle, setCurrentHandle] = React.useState('');
  const [stakeSuccessMessage, setStakeSuccessMessage] = React.useState('');
  const [stakeErrorMessage, setStakeErrorMessage] = React.useState('');
  const {
    stake,
    unstake,
    isStakeProcessing,
    stakeStatusCode,
    stakeErrorCode,
    stakeLastError,
    sourceTxId,
  } = useStake(stakeMode, tab, lockedPoolLength);
  const [reconcileTxHash, setReconcileTxHash] = useState('');
  const [reconcileSuccessMessage, setReconcileSuccessMessage] =
    React.useState('');
  const [reconcileErrorMessage, setReconcileErrorMessage] = React.useState('');
  const {
    reconcile,
    isReconcileProcessing,
    reconcileStatusCode,
    reconcileErrorCode,
    reconcileLastError,
  } = useStakeReconcile();
  const { getBalance, stakeList, tokenBalance } = useStakePool();
  const { publicKey: solanaAddress } = useSolanaWallet();

  const handleTabChange = useCallback((event, value) => {
    setTab(value);
    setStakeSuccessMessage('');
    setStakeErrorMessage('');
  }, []);

  const stakeStatusMessage = useMemo(() => {
    if (isStakeProcessing || stakeStatusCode !== StakeStatusCode.FAILED) {
      switch (stakeStatusCode) {
        case StakeStatusCode.NONE:
          return '';
        case StakeStatusCode.START:
          return 'Start';
        case StakeStatusCode.TOKEN_AMOUNT_CHECKING:
          return 'Checking token amount';
        case StakeStatusCode.PROCESSING:
          return 'Processing';
        case StakeStatusCode.SUBMITTING:
          return 'Submitting result';
        case StakeStatusCode.SUCCESS:
          return 'Success';
        default:
          return 'Unknown';
      }
    } else {
      switch (stakeErrorCode) {
        case StakeErrorCode.NO_ERROR:
          return 'No error message';
        case StakeErrorCode.CANT_CONNECT_SOLANA:
          return "Can't connect to the Solana network";
        case StakeErrorCode.TOKEN_AMOUNT_NOT_ENOUGH:
          return 'Token amount is not enough';
        case StakeErrorCode.SERVER_INVALID:
          return 'Service unavailable';
        case StakeErrorCode.SOLANA_NO_ASSOC_ACCOUNT:
          return 'There is no associated token account';
        case StakeErrorCode.SUBMIT_FAILED:
          return stakeLastError && stakeLastError > ''
            ? stakeLastError
            : 'Unknown error';
        default:
          return '';
      }
    }
  }, [isStakeProcessing, stakeStatusCode, stakeErrorCode, stakeLastError]);

  useEffect(() => {
    if (!isStakeProcessing) {
      if (stakeStatusCode === StakeStatusCode.SUCCESS) {
        setStakeSuccessMessage('Success');
        ConsoleHelper(`stakeSuccessMessage: ${stakeSuccessMessage}`);
      } else if (stakeStatusCode === StakeStatusCode.FAILED) {
        setStakeErrorMessage(stakeStatusMessage);
      }
    }
  }, [
    isStakeProcessing,
    stakeStatusCode,
    stakeStatusMessage,
    stakeErrorCode,
    stakeSuccessMessage,
  ]);

  useEffect(() => {
    setInput(tokenBalance);
  }, [tokenBalance]);

  const handleMaxButtonClick = async () => {
    if (wallet.connected) {
      getBalance();
      setInput(tokenBalance);
    } else {
      setInput('');
    }
  };

  const handleStakeButtonClick = () => {
    if (wallet.connected && inputVal.length > 0 && parseFloat(inputVal) > 0) {
      stake(Number(inputVal));
    } else {
      setStakeErrorMessage('You cannot stake at this moment in time.');
      ConsoleHelper(stakeErrorMessage);
    }
  };

  const handleClearButtonClick = () => {
    setInput('');
  };

  const handleUnstakeButtonClick = (xAmount: string, handle = ''): void => {
    if (
      wallet.connected &&
      xAmount.toString().length > 0 &&
      handle.length > 0
    ) {
      setCurrentHandle(handle);
      unstake(xAmount.toString(), handle);
    } else {
      setStakeErrorMessage('You cannot unstake at this moment in time.');
      ConsoleHelper(stakeErrorMessage);
    }
  };

  const handleStakeAmountChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInput(e.target.value.toString());
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event && event.key) {
      event.preventDefault();
    }
  };

  const reconcileStatusMessage = useMemo(() => {
    if (
      isReconcileProcessing ||
      reconcileStatusCode !== ReconcileStatusCode.FAILED
    ) {
      switch (reconcileStatusCode) {
        case ReconcileStatusCode.NONE:
          return '';
        case ReconcileStatusCode.START:
          return 'Start';
        case ReconcileStatusCode.PROCESSING:
          return 'Processing';
        case ReconcileStatusCode.SUBMITTING:
          return 'Submitting result';
        case ReconcileStatusCode.SUCCESS:
          return 'Success';
        default:
          return 'Unknown';
      }
    } else {
      switch (reconcileErrorCode) {
        case ReconcileErrorCode.NO_ERROR:
          return 'No error message';
        case ReconcileErrorCode.CANT_CONNECT_SOLANA:
          return "Can't connect to the Solana network";
        case ReconcileErrorCode.TOKEN_AMOUNT_NOT_ENOUGH:
          return 'Token amount is not enough';
        case ReconcileErrorCode.SERVER_INVALID:
          return 'Service unavailable';
        case ReconcileErrorCode.SOLANA_NO_ASSOC_ACCOUNT:
          return 'There is no associated token account';
        case ReconcileErrorCode.SUBMIT_FAILED:
          return reconcileLastError && reconcileLastError > ''
            ? reconcileLastError
            : 'Unknown error';
        default:
          return '';
      }
    }
  }, [
    isReconcileProcessing,
    reconcileStatusCode,
    reconcileErrorCode,
    reconcileLastError,
  ]);

  useEffect(() => {
    if (!isReconcileProcessing) {
      if (reconcileStatusCode === ReconcileStatusCode.SUCCESS) {
        setReconcileSuccessMessage('Success');
        ConsoleHelper(reconcileSuccessMessage);
      } else if (reconcileStatusCode === ReconcileStatusCode.FAILED) {
        setReconcileErrorMessage(reconcileStatusMessage);
      }
    } else {
      setReconcileErrorMessage('');
    }
  }, [
    isReconcileProcessing,
    reconcileStatusCode,
    reconcileStatusMessage,
    reconcileErrorCode,
    reconcileSuccessMessage,
  ]);

  ConsoleHelper(
    `reconcile status -> 
    isReconcileProcessing: ${isReconcileProcessing}, 
    reconcileStatusCode: ${reconcileStatusCode},
    reconcileStatusMessage: ${reconcileStatusMessage},
    reconcileErrorCode: ${reconcileErrorCode},
    reconcileSuccessMessage: ${reconcileSuccessMessage}`,
  );

  const onReconcile = async () => {
    if (reconcileTxHash === '') {
      setReconcileErrorMessage('Please provide a transaction hash');
      return;
    }
    setReconcileErrorMessage('');
    reconcile(stakeMode, lockedPoolLength, reconcileTxHash);
  };

  return (
    <div className={classes.mainTab}>
      <div className={classes.centerTab}>
        <Tabs
          value={tab}
          variant="fullWidth"
          indicatorColor="primary"
          onChange={handleTabChange}
        >
          <Tab
            className={classes.tab}
            label="STAKE"
            value={StakeStepMode.STAKE}
            disabled={isReconcileProcessing}
          />
          <Tab
            className={classes.tab}
            label="UNSTAKE"
            value={StakeStepMode.UNSTAKE}
            disabled={isStakeProcessing || isReconcileProcessing}
          />
          <Tab
            className={classes.tab}
            label="RECONCILE"
            value={StakeStepMode.RECONCILE}
            disabled={isStakeProcessing}
          />
        </Tabs>
        <div
          className={classes.tabContainer}
          style={{
            justifyContent: tab === StakeStepMode.STAKE ? 'center' : '',
          }}
        >
          <div
            className={classes.childTabContainer}
            style={{
              width: tab === StakeStepMode.STAKE ? '50%' : '100%',
            }}
          >
            {tab === StakeStepMode.STAKE ? (
              <>
                <div className={classes.stakeBalanceTab}>
                  <div className={classes.amount}>
                    <TextField
                      placeholder="0.00"
                      type="number"
                      value={inputVal}
                      onChange={handleStakeAmountChange}
                      onKeyDown={(e) => handleKeyPress(e)}
                      inputProps={{
                        maxLength: 100,
                        step:
                          process.env.REACT_APP_CLUSTER === 'mainnet'
                            ? 2000
                            : 2,
                        min:
                          process.env.REACT_APP_CLUSTER === 'mainnet'
                            ? 2000
                            : 2,
                        disableunderline: 'true',
                      }}
                      disabled={!isAddress(solanaAddress as PublicKey | string)}
                    />
                  </div>
                  <ButtonWithLoader
                    onClick={handleMaxButtonClick}
                    disabled={
                      !isAddress(solanaAddress as PublicKey | string) ||
                      isStakeProcessing
                    }
                  >
                    Max
                  </ButtonWithLoader>
                  <div style={{ paddingLeft: '7px' }} />
                  <ButtonWithLoader
                    onClick={handleStakeButtonClick}
                    disabled={
                      !isAddress(solanaAddress as PublicKey | string) ||
                      isStakeProcessing
                    }
                  >
                    Stake
                  </ButtonWithLoader>
                  <div style={{ paddingLeft: '7px' }} />
                  <ButtonWithLoader
                    onClick={handleClearButtonClick}
                    disabled={
                      !isAddress(solanaAddress as PublicKey | string) ||
                      isStakeProcessing
                    }
                  >
                    Reset
                  </ButtonWithLoader>
                </div>
                <SolanaWalletKey />
                {!stakeErrorMessage && stakeStatusMessage ? (
                  <Typography
                    variant="body2"
                    color="primary"
                    className={classes.statusMessage}
                  >
                    {stakeStatusMessage}
                  </Typography>
                ) : null}
                {sourceTxId ? (
                  <div style={{ marginTop: '16px' }}>
                    <ShowTx chainId={CHAIN_ID_SOLANA} txId={sourceTxId} />
                  </div>
                ) : null}
                {stakeErrorMessage ? (
                  <Typography
                    variant="body2"
                    color="error"
                    className={classes.statusMessage}
                  >
                    {stakeErrorMessage}
                  </Typography>
                ) : null}
              </>
            ) : null}
            {tab === StakeStepMode.UNSTAKE ? (
              <div
                style={{
                  paddingTop: '1.5rem',
                  width: '100%',
                }}
              >
                {!isAddress(solanaAddress as PublicKey | string) ? (
                  <div style={{ paddingLeft: '1rem' }}>
                    Please connect your wallet to check your staked tokens.
                    <div
                      style={{
                        paddingTop: '1rem',
                      }}
                    >
                      <SolanaWalletKey />
                    </div>
                  </div>
                ) : null}
                {(isAddress(solanaAddress as PublicKey | string) &&
                  !stakeList) ||
                (stakeList && stakeList.length === 0) ? (
                  <div style={{ paddingLeft: '1rem' }}>
                    We could not retrieve any details about your staked tokens
                    at this moment in time. Please try again later.
                  </div>
                ) : null}
                {isAddress(solanaAddress as PublicKey | string) &&
                stakeList &&
                stakeList.length > 0 ? (
                  <div>
                    <div style={{ paddingLeft: '1rem' }}>
                      <Typography variant="h6">Staked Tokens</Typography>
                      <div
                        style={{
                          paddingTop: '1rem',
                          paddingBottom: '1rem',
                        }}
                      >
                        <SolanaWalletKey />
                      </div>
                    </div>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Stake Tx Hash</TableCell>
                            <TableCell>Stake Period</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {stakeList.map((stakeListItem) => (
                            <TableRow key={stakeListItem.stakeTxHash}>
                              <TableCell>
                                {stakeListItem.stakeTxHash.substring(0, 10)}
                                {stakeListItem.stakeTxHash.length >= 10 &&
                                  `...`}
                                <ShowTxButton
                                  chainId={CHAIN_ID_SOLANA}
                                  txId={stakeListItem.stakeTxHash}
                                />
                              </TableCell>
                              <TableCell>
                                {!stakeListItem.stakeClaimDate ? (
                                  <>
                                    <Moment format="YYYY-MM-DD">
                                      {stakeListItem.stakeStartDate}
                                    </Moment>{' '}
                                    to{' '}
                                    <Moment format="YYYY-MM-DD">
                                      {stakeListItem.stakeEndDate}
                                    </Moment>
                                    <br />
                                    {new Date() <
                                    new Date(stakeListItem.stakeEndDate) ? (
                                      <>
                                        <Moment
                                          duration={new Date()}
                                          date={stakeListItem.stakeEndDate}
                                          format="d"
                                        />{' '}
                                        days to go
                                      </>
                                    ) : (
                                      ''
                                    )}
                                  </>
                                ) : null}
                                {stakeListItem.stakeClaimDate &&
                                stakeListItem.unstakeTxHash ? (
                                  <>
                                    Unstaked on{' '}
                                    <Moment format="YYYY-MM-DD">
                                      {stakeListItem.stakeStartDate}
                                    </Moment>
                                    <ShowTxButton
                                      chainId={CHAIN_ID_SOLANA}
                                      txId={stakeListItem.unstakeTxHash}
                                    />
                                  </>
                                ) : null}
                              </TableCell>
                              <TableCell>
                                <NumberFormat
                                  value={
                                    Math.round(
                                      stakeListItem.chicksAmount as unknown as number,
                                    ) / 1000000000
                                  }
                                  displayType="text"
                                  thousandSeparator
                                  decimalScale={1}
                                  fixedDecimalScale
                                />{' '}
                                CHICKS
                                <br />
                                <NumberFormat
                                  value={
                                    Math.round(
                                      stakeListItem.xChicksAmount as unknown as number,
                                    ) / 1000000000
                                  }
                                  displayType="text"
                                  thousandSeparator
                                  decimalScale={1}
                                  fixedDecimalScale
                                />{' '}
                                xCHICKS
                                <br />
                              </TableCell>
                              <TableCell>
                                {!stakeListItem.stakeClaimDate ||
                                !stakeListItem.unstakeTxHash ? (
                                  <>
                                    <Button
                                      variant="outlined"
                                      onClick={() =>
                                        handleUnstakeButtonClick(
                                          stakeListItem.xChicksAmount,
                                          stakeListItem.handle,
                                        )
                                      }
                                      disabled={
                                        !isAddress(
                                          solanaAddress as PublicKey | string,
                                        ) ||
                                        isStakeProcessing ||
                                        !FLEX_UNSTAKE_ACTIVE ||
                                        sourceTxId > ''
                                      }
                                    >
                                      Unstake
                                    </Button>
                                    {new Date() <
                                    new Date(stakeListItem.stakeEndDate) ? (
                                      <div
                                        style={{
                                          color: '#D0393E',
                                          paddingTop: '0.3rem',
                                        }}
                                      >
                                        {FLEX_UNSTAKE_ACTIVE
                                          ? `${UNSTAKE_FEE}% unstake penalty`
                                          : 'Unstaking paused'}
                                      </div>
                                    ) : null}
                                  </>
                                ) : null}
                                {currentHandle === stakeListItem.handle ? (
                                  <>
                                    {!stakeListItem.unstakeTxHash &&
                                    !stakeErrorMessage &&
                                    stakeStatusMessage ? (
                                      <Typography
                                        variant="body2"
                                        color="primary"
                                        className={classes.statusMessage}
                                      >
                                        {stakeStatusMessage}
                                      </Typography>
                                    ) : null}
                                    {!stakeListItem.unstakeTxHash &&
                                    sourceTxId > '' ? (
                                      <div style={{ marginTop: '16px' }}>
                                        {sourceTxId.substring(0, 10)}
                                        {sourceTxId.length >= 10 && `...`}
                                        <ShowTxButton
                                          chainId={CHAIN_ID_SOLANA}
                                          txId={sourceTxId}
                                        />
                                      </div>
                                    ) : null}
                                    {stakeErrorMessage ? (
                                      <Typography
                                        variant="body2"
                                        color="error"
                                        className={classes.statusMessage}
                                      >
                                        {stakeErrorMessage}
                                      </Typography>
                                    ) : null}
                                  </>
                                ) : null}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </div>
                ) : null}
              </div>
            ) : null}
            {tab === StakeStepMode.RECONCILE ? (
              <div
                style={{
                  paddingTop: '1.5rem',
                  width: '100%',
                }}
              >
                <div style={{ paddingLeft: '1rem' }}>
                  Please paste your missing transaction hash.
                </div>
                <div style={{ padding: '1rem' }}>
                  {' '}
                  <TextField
                    label="Transaction Hash"
                    variant="outlined"
                    fullWidth
                    value={reconcileTxHash}
                    onChange={(event) => {
                      setReconcileTxHash(event.target.value);
                    }}
                  />
                </div>
                <div style={{ paddingLeft: '1rem' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={onReconcile}
                    disabled={isReconcileProcessing}
                    style={{ width: '15rem' }}
                  >
                    {isReconcileProcessing ? 'Processing' : 'Reconcile'}
                  </Button>
                </div>
                <div style={{ paddingLeft: '1rem' }}>
                  {!reconcileErrorMessage && reconcileStatusMessage ? (
                    <Typography
                      variant="body2"
                      color="primary"
                      className={classes.statusMessage}
                    >
                      {reconcileStatusMessage}
                    </Typography>
                  ) : null}
                  {reconcileErrorMessage ? (
                    <Typography
                      variant="body2"
                      color="error"
                      className={classes.statusMessage}
                    >
                      {reconcileErrorMessage}
                    </Typography>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
