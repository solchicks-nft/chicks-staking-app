import React, { useCallback, useState } from 'react';
import { Tab, Tabs } from '@material-ui/core';
import { useStyles } from '../pages/useStyles';
import { SOLCHICK_BALANCE_TAB_STATE } from '../utils/solchickConsts';
import ButtonWithLoader from './ButtonWithLoader';
import ConsoleHelper from '../helpers/ConsoleHelper';
import SolanaWalletKey from './SolanaWalletKey';
import useStake from "../hooks/useStake";

export const BalanceInfoContainer = () => {
  const [tab, setTab] = useState(SOLCHICK_BALANCE_TAB_STATE.STAKE);
  const classes = useStyles();
  const {stake} = useStake();

  const handleChange = useCallback((event, value) => {
    setTab(value);
  }, []);

  const handleButtonClick = () => {
    ConsoleHelper(`BalanceInfoContainer => ${tab}`);
  };

  const handleActionClick = () => {
    ConsoleHelper(`BalanceInfoContainer => ${tab}`);
    stake(tab, 10);
  }

  return (
    <div className={classes.card}>
      <div className={classes.header}>MY BALANCE</div>
      <div className={classes.content}>
        <div className={classes.mainContent}>
          <div className={classes.contentHeading}>CHICKS Amount</div>
          <div className={classes.contentText}>0</div>
        </div>
        <div className={classes.mainContent}>
          <div className={classes.contentHeading}>xCHICKS Amount</div>
          <div className={classes.contentText}>0</div>
        </div>
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
                  {' '}
                  {tab === SOLCHICK_BALANCE_TAB_STATE.STAKE
                    ? '0.00 CHICKS'
                    : '0.00 xCHICKS'}
                </div>
                <ButtonWithLoader onClick={handleButtonClick}>
                  Max
                </ButtonWithLoader>
                <ButtonWithLoader onClick={handleActionClick}>
                  {tab === SOLCHICK_BALANCE_TAB_STATE.STAKE? 'Stake':'Unstake'}
                </ButtonWithLoader>
              </div>
              <SolanaWalletKey/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
