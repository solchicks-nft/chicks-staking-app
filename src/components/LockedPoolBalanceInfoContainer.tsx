import React, { useEffect, useState } from 'react';
import { useStyles } from '../pages/useStyles';
import { StakeLockedPoolLength, StakeMode } from '../utils/stakeHelper';
import { useStakePool } from '../contexts/StakePoolContext';
import BalanceInfoContainer from './BalanceInfoContainer';
import { StakeContainer } from './StakeContainer';

export const LockedPoolBalanceInfoContainer = ({
  tab,
}: {
  tab: StakeLockedPoolLength;
}) => {
  const classes = useStyles();
  const [currentStakeMode, setCurrentStakeMode] = useState<StakeMode | null>(
    StakeMode.LOCKED,
  );
  const { userInfo, setLockedPoolLength, setStakeMode } = useStakePool();

  useEffect(() => {
    setCurrentStakeMode(StakeMode.LOCKED);
    setStakeMode(StakeMode.LOCKED);
    setLockedPoolLength(tab);
  }, [currentStakeMode, setLockedPoolLength, setStakeMode, tab]);

  return (
    <div className={classes.card}>
      <div className={classes.header}>MY BALANCE</div>
      <BalanceInfoContainer userInfo={userInfo} />
      <StakeContainer stakeMode={StakeMode.LOCKED} lockedPoolLength={tab} />
    </div>
  );
};
