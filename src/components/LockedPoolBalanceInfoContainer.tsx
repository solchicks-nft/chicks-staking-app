import React, { useCallback, useEffect, useState } from 'react';
import { Tab, Tabs } from '@material-ui/core';
import { useStyles } from '../pages/useStyles';
import { StakeLockedPoolLength, StakeMode } from '../utils/stakeHelper';
import { useStakePool } from '../contexts/StakePoolContext';
import BalanceInfoContainer from './BalanceInfoContainer';
import { StakeContainer } from './StakeContainer';

export const LockedPoolBalanceInfoContainer = () => {
  const classes = useStyles();
  const [tab, setTab] = useState(StakeLockedPoolLength.MONTH4);
  const [currentStakeMode, setCurrentStakeMode] = useState<StakeMode | null>(
    StakeMode.LOCKED,
  );
  const { userInfo, setLockedPoolLength, setStakeMode } = useStakePool();

  const handleTabChange = useCallback((event, value) => {
    setTab(value);
  }, []);

  useEffect(() => {
    setCurrentStakeMode(StakeMode.LOCKED);
    setStakeMode(StakeMode.LOCKED);
    setLockedPoolLength(tab);
  }, [currentStakeMode, setLockedPoolLength, setStakeMode, tab]);

  return (
    <div className={classes.card}>
      <div className={classes.header}>MY BALANCE</div>
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
              label="4 MONTHS"
              value={StakeLockedPoolLength.MONTH4}
            />
            <Tab
              className={classes.tab}
              label="8 MONTHS"
              value={StakeLockedPoolLength.MONTH8}
            />
            <Tab
              className={classes.tab}
              label="12 MONTHS"
              value={StakeLockedPoolLength.MONTH12}
            />
          </Tabs>
          <BalanceInfoContainer userInfo={userInfo} />
          <StakeContainer stakeMode={StakeMode.LOCKED} lockedPoolLength={tab} />
        </div>
      </div>
    </div>
  );
};
