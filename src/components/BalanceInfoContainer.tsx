import React, { ChangeEvent, useCallback, useMemo, useState } from 'react';
import { Tab, Tabs, TextField } from '@material-ui/core';
import { Connection, PublicKey } from '@solana/web3.js';
import { useStyles } from '../pages/useStyles';
import { SOLCHICK_BALANCE_TAB_STATE } from '../utils/solchickConsts';
import ButtonWithLoader from './ButtonWithLoader';
import ConsoleHelper from '../utils/consoleHelper';
import SolanaWalletKey from './SolanaWalletKey';
import useStake from '../hooks/useStake';
import { useStakePool } from '../contexts/StakePoolContext';
import { StakeMode } from '../utils/stakeHelper';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';
import { SOLANA_HOST } from '../utils/consts';
import { isAddress } from '../utils/solanaHelper';

export const BalanceInfoContainer = ({ tabType }: { tabType: StakeMode }) => {
  const [tab, setTab] = useState(SOLCHICK_BALANCE_TAB_STATE.STAKE);
  const [inputVal, setInput] = useState('');
  const classes = useStyles();
  const wallet = useSolanaWallet();
  const { stake } = useStake(tabType);
  const solanaConnection = useMemo(
    () => new Connection(SOLANA_HOST, 'confirmed'),
    [],
  );
  const { publicKey: solanaAddress } = useSolanaWallet();

  const handleChange = useCallback((event, value) => {
    setTab(value);
  }, []);

  const handleButtonClick = () => {
    ConsoleHelper(`BalanceInfoContainer -> ${tab}`);
  };

  const handleActionClick = () => {
    if (wallet.connected && inputVal.length > 0 && parseFloat(inputVal) > 0) {
      ConsoleHelper(`BalanceInfoContainer -> ${tab}`);
      stake(Number(inputVal));
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

  const { refreshLockedPool, flexibleUserInfo, lockedUserInfo } =
    useStakePool();

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
            {/* eslint-disable-next-line no-nested-ternary */}
            {tabType === StakeMode.FLEXIBLE
              ? flexibleUserInfo && flexibleUserInfo.chicks.length > 0
                ? `${flexibleUserInfo.chicks} CHICKS`
                : '0 CHICKS'
              : null}
            {/* eslint-disable-next-line no-nested-ternary */}
            {tabType === StakeMode.LOCKED
              ? lockedUserInfo && lockedUserInfo.chicks.length > 0
                ? `${lockedUserInfo.chicks} CHICKS`
                : '0 CHICKS'
              : null}
          </div>
        </div>
        {tabType === StakeMode.FLEXIBLE ? (
          <div className={classes.mainContent}>
            <div className={classes.contentHeading}>xCHICKS Amount</div>
            <div className={classes.contentText}>
              {flexibleUserInfo && flexibleUserInfo.chicks.length > 0
                ? `${flexibleUserInfo.xChicks} xCHICKS`
                : '0 xCHICKS'}
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
          <div className={classes.tabContainer}>
            <div className={classes.childTabContainer}>
              <div className={classes.balanceTab}>
                <div className={classes.amount}>
                  <TextField
                    placeholder={
                      tab === SOLCHICK_BALANCE_TAB_STATE.STAKE
                        ? '0.00 CHICKS'
                        : '0.00 xCHICKS'
                    }
                    type="number"
                    value={inputVal}
                    onChange={handleStakeAmountChange}
                    onKeyDown={(e) => handleKeyPress(e)}
                    inputProps={{
                      maxLength: 100,
                      step: '1000',
                      min: 2000,
                      disableunderline: 'true',
                    }}
                    disabled={!isAddress(solanaAddress as PublicKey | string)}
                  />
                </div>
                <ButtonWithLoader
                  onClick={handleButtonClick}
                  disabled={!isAddress(solanaAddress as PublicKey | string)}
                >
                  Max
                </ButtonWithLoader>
                <div style={{ paddingLeft: '7px' }} />
                <ButtonWithLoader
                  onClick={handleActionClick}
                  disabled={!isAddress(solanaAddress as PublicKey | string)}
                >
                  {tab === SOLCHICK_BALANCE_TAB_STATE.STAKE
                    ? 'Stake'
                    : 'Unstake'}
                </ButtonWithLoader>
              </div>
              <SolanaWalletKey />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
