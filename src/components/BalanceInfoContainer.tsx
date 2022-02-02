import React, { ChangeEvent, useCallback, useState } from 'react';
import { Tab, Tabs, TextField } from '@material-ui/core';
import { useStyles } from '../pages/useStyles';
import { SOLCHICK_BALANCE_TAB_STATE } from '../utils/solchickConsts';
import ButtonWithLoader from './ButtonWithLoader';
import ConsoleHelper from '../utils/consoleHelper';
import SolanaWalletKey from './SolanaWalletKey';
import useStake from '../hooks/useStake';
import { useStakePool } from '../contexts/StakePoolContext';
import { StakeMode } from '../utils/stakeHelper';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';

export const BalanceInfoContainer = ({ tabType }: { tabType: number }) => {
  const [tab, setTab] = useState(SOLCHICK_BALANCE_TAB_STATE.STAKE);
  const [inputVal, setInput] = useState('');
  const classes = useStyles();
  const wallet = useSolanaWallet();
  const { stake } = useStake(tabType);

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

  const {
    refreshLockedPool,
    flexibleUserInfo,
    flexibleTotalInfo,
    lockedTotalInfo,
    lockedUserInfo,
  } = useStakePool();

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
            {lockedUserInfo ? lockedUserInfo.chicks : '0 CHICKS'}
          </div>
        </div>
        {tabType === StakeMode.FLEXIBLE ? (
          <div className={classes.mainContent}>
            <div className={classes.contentHeading}>xCHICKS Amount</div>
            <div className={classes.contentText}>
              {lockedUserInfo ? lockedUserInfo.xChicks : ''}
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
                      min: 1000,
                      disableunderline: "true",
                    }}
                  />
                </div>
                <ButtonWithLoader onClick={handleButtonClick}>
                  Max
                </ButtonWithLoader>
                <div style={{ paddingLeft: '7px' }} />
                <ButtonWithLoader onClick={handleActionClick}>
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
