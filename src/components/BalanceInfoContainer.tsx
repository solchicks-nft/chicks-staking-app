import React, { ChangeEvent, useCallback, useState } from 'react';
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
import { SOLCHICK_BALANCE_TAB_STATE } from '../utils/solchickConsts';
import ButtonWithLoader from './ButtonWithLoader';
import ConsoleHelper from '../utils/consoleHelper';
import SolanaWalletKey from './SolanaWalletKey';
import useStake from '../hooks/useStake';
import { useStakePool } from '../contexts/StakePoolContext';
import { StakeMode } from '../utils/stakeHelper';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';
import { isAddress } from '../utils/solanaHelper';
import { CHAIN_ID_SOLANA } from '../lib/consts';
import ShowTxButton from './ShowTxButton';

export const BalanceInfoContainer = ({ tabType }: { tabType: StakeMode }) => {
  const [tab, setTab] = useState(SOLCHICK_BALANCE_TAB_STATE.STAKE);
  const [inputVal, setInput] = useState('');
  const classes = useStyles();
  const wallet = useSolanaWallet();

  const { stake, unstake } = useStake(tabType);
  const {
    refreshFlexiblePool,
    refreshLockedPool,
    flexibleStakeList,
    flexibleUserInfo,
    lockedUserInfo,
  } = useStakePool();
  const { publicKey: solanaAddress } = useSolanaWallet();

  const handleChange = useCallback(
    (event, value) => {
      setTab(value);
      refreshFlexiblePool();
      refreshLockedPool();
    },
    [refreshFlexiblePool, refreshLockedPool],
  );

  const handleMaxButtonClick = () => {
    if (wallet.connected) {
      const maxAmount: string = flexibleUserInfo
        ? flexibleUserInfo.chicksAmount
        : '';
      setInput(maxAmount);
    } else {
      setInput('');
    }
  };

  const handleStakeButtonClick = () => {
    if (wallet.connected && inputVal.length > 0 && parseFloat(inputVal) > 0) {
      ConsoleHelper(`BalanceInfoContainer -> ${tab}`);
      stake(Number(inputVal));
    }
  };

  const handleUnstakeButtonClick = (xAmount: string, handle = ''): void => {
    if (
      wallet.connected &&
      xAmount.toString().length > 0 &&
      handle.length > 0
    ) {
      ConsoleHelper(`BalanceInfoContainer -> ${tab}`);
      unstake(xAmount.toString(), handle);
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

  return (
    <div className={classes.card}>
      <div className={classes.header}>MY BALANCE</div>
      <div className={classes.content}>
        <div
          className={
            tabType === StakeMode.FLEXIBLE
              ? classes.mainContent
              : classes.tabContent
          }
        >
          <div className={classes.contentHeading}>CHICKS Amount</div>
          <div className={classes.contentText}>
            {tabType === StakeMode.FLEXIBLE ? (
              flexibleUserInfo && flexibleUserInfo.chicksAmount.length > 0 ? (
                <NumberFormat
                  value={flexibleUserInfo.chicksAmount}
                  displayType="text"
                  thousandSeparator
                  decimalScale={10}
                  fixedDecimalScale
                />
              ) : (
                <NumberFormat
                  value={0}
                  displayType="text"
                  thousandSeparator
                  decimalScale={10}
                  fixedDecimalScale
                />
              )
            ) : null}
            {tabType === StakeMode.LOCKED ? (
              lockedUserInfo && lockedUserInfo.chicksAmount.length > 0 ? (
                <NumberFormat
                  value={lockedUserInfo.chicksAmount}
                  displayType="text"
                  thousandSeparator
                  decimalScale={10}
                  fixedDecimalScale
                />
              ) : (
                <NumberFormat
                  value={0}
                  displayType="text"
                  thousandSeparator
                  decimalScale={10}
                  fixedDecimalScale
                />
              )
            ) : null}
          </div>
        </div>
        {tabType === StakeMode.FLEXIBLE ? (
          <div className={classes.mainContent}>
            <div className={classes.contentHeading}>xCHICKS Amount</div>
            <div className={classes.contentText}>
              {flexibleUserInfo && flexibleUserInfo.chicksAmount.length > 0 ? (
                <NumberFormat
                  value={flexibleUserInfo.xChicksAmount}
                  displayType="text"
                  thousandSeparator
                  decimalScale={10}
                  fixedDecimalScale
                />
              ) : (
                <NumberFormat
                  value={0}
                  displayType="text"
                  thousandSeparator
                  decimalScale={10}
                  fixedDecimalScale
                />
              )}
            </div>
          </div>
        ) : null}
      </div>
      <div className={classes.mainTab}>
        <div className={classes.centerTab}>
          <Tabs
            value={tab}
            variant="fullWidth"
            indicatorColor="primary"
            onChange={handleChange}
          >
            <Tab
              className={classes.tab}
              label="STAKE"
              value={SOLCHICK_BALANCE_TAB_STATE.STAKE}
            />
            <Tab
              className={classes.tab}
              label="UNSTAKE"
              value={SOLCHICK_BALANCE_TAB_STATE.UNSTAKE}
            />
          </Tabs>
          <div
            className={classes.tabContainer}
            style={{
              justifyContent:
                tab === SOLCHICK_BALANCE_TAB_STATE.STAKE ? 'center' : '',
            }}
          >
            <div
              className={classes.childTabContainer}
              style={{
                width:
                  tab === SOLCHICK_BALANCE_TAB_STATE.STAKE ? '50%' : '100%',
              }}
            >
              {tab === SOLCHICK_BALANCE_TAB_STATE.STAKE ? (
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
                              ? 1000
                              : 2,
                          min:
                            process.env.REACT_APP_CLUSTER === 'mainnet'
                              ? 2000
                              : 2,
                          disableunderline: 'true',
                        }}
                        disabled={
                          !isAddress(solanaAddress as PublicKey | string)
                        }
                      />
                    </div>
                    <ButtonWithLoader
                      onClick={handleMaxButtonClick}
                      disabled={!isAddress(solanaAddress as PublicKey | string)}
                    >
                      Max
                    </ButtonWithLoader>
                    <div style={{ paddingLeft: '7px' }} />
                    <ButtonWithLoader
                      onClick={handleStakeButtonClick}
                      disabled={!isAddress(solanaAddress as PublicKey | string)}
                    >
                      Stake
                    </ButtonWithLoader>
                  </div>
                  <SolanaWalletKey />
                </>
              ) : null}
              {tab === SOLCHICK_BALANCE_TAB_STATE.UNSTAKE ? (
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
                  {isAddress(solanaAddress as PublicKey | string) &&
                  !flexibleStakeList ? (
                    <div style={{ paddingLeft: '1rem' }}>
                      We could not retrieve any details about your staked tokens
                      at this moment in time. Please try again later.
                    </div>
                  ) : null}
                  {isAddress(solanaAddress as PublicKey | string) &&
                  flexibleStakeList &&
                  flexibleStakeList.length > 0 ? (
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
                            {flexibleStakeList.map((flexibleStakeListItem) => (
                              <TableRow key={flexibleStakeListItem.stakeTxHash}>
                                <TableCell>
                                  {flexibleStakeListItem.stakeTxHash.substring(
                                    0,
                                    10,
                                  )}
                                  {flexibleStakeListItem.stakeTxHash.length >=
                                    10 && `...`}
                                  <ShowTxButton
                                    chainId={CHAIN_ID_SOLANA}
                                    txId={flexibleStakeListItem.stakeTxHash}
                                  />
                                </TableCell>
                                <TableCell>
                                  {!flexibleStakeListItem.stakeClaimDate ? (
                                    <>
                                      <Moment format="YYYY-MM-DD">
                                        {flexibleStakeListItem.stakeStartDate}
                                      </Moment>{' '}
                                      to{' '}
                                      <Moment format="YYYY-MM-DD">
                                        {flexibleStakeListItem.stakeEndDate}
                                      </Moment>
                                      <br />
                                      <Moment
                                        duration={
                                          flexibleStakeListItem.stakeStartDate
                                        }
                                        date={
                                          flexibleStakeListItem.stakeEndDate
                                        }
                                        format="d"
                                      />{' '}
                                      {new Date() >=
                                      new Date(
                                        flexibleStakeListItem.stakeEndDate,
                                      )
                                        ? 'days to go'
                                        : 'days to go'}
                                    </>
                                  ) : null}
                                  {flexibleStakeListItem.stakeClaimDate ? (
                                    <>
                                      Unstaked on{' '}
                                      <Moment format="YYYY-MM-DD">
                                        {flexibleStakeListItem.stakeStartDate}
                                      </Moment>
                                      <ShowTxButton
                                        chainId={CHAIN_ID_SOLANA}
                                        txId={
                                          flexibleStakeListItem.unstakeTxHash
                                        }
                                      />
                                    </>
                                  ) : null}
                                </TableCell>
                                <TableCell>
                                  <NumberFormat
                                    value={
                                      Math.round(
                                        flexibleStakeListItem.chicksAmount as unknown as number,
                                      ) / 1000000000
                                    }
                                    displayType="text"
                                    thousandSeparator
                                    decimalScale={10}
                                    fixedDecimalScale
                                  />{' '}
                                  CHICKS
                                  <br />
                                  <NumberFormat
                                    value={
                                      Math.round(
                                        flexibleStakeListItem.xChicksAmount as unknown as number,
                                      ) / 1000000000
                                    }
                                    displayType="text"
                                    thousandSeparator
                                    decimalScale={10}
                                    fixedDecimalScale
                                  />{' '}
                                  xCHICKS
                                  <br />
                                </TableCell>
                                <TableCell>
                                  {!flexibleStakeListItem.stakeClaimDate ||
                                  !flexibleStakeListItem.unstakeTxHash ? (
                                    <>
                                      <Button
                                        variant="outlined"
                                        onClick={() =>
                                          handleUnstakeButtonClick(
                                            flexibleStakeListItem.xChicksAmount,
                                            flexibleStakeListItem.handle,
                                          )
                                        }
                                        disabled={
                                          !isAddress(
                                            solanaAddress as PublicKey | string,
                                          )
                                        }
                                      >
                                        Unstake
                                      </Button>

                                      {new Date() <
                                      new Date(
                                        flexibleStakeListItem.stakeEndDate,
                                      ) ? (
                                        <div
                                          style={{
                                            color: '#D0393E',
                                            paddingTop: '0.3rem',
                                          }}
                                        >
                                          25% unstake penalty
                                        </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
