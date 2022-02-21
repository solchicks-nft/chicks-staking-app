import React from 'react';
import { useStyles } from '../pages/useStyles';
import { useStakePool } from '../contexts/StakePoolContext';
import BalanceInfoContainer from './BalanceInfoContainer';
import { StakeContainer } from './StakeContainer';
import { StakeMode } from '../utils/stakeHelper';

export const FlexiblePoolBalanceInfoContainer = () => {
  const classes = useStyles();
  const { userInfo } = useStakePool();

  return (
    <div className={classes.card}>
      <div className={classes.header}>MY BALANCE</div>
      <BalanceInfoContainer userInfo={userInfo} />
      <StakeContainer stakeMode={StakeMode.FLEXIBLE} lockedPoolLength={null} />
    </div>
  );
};
