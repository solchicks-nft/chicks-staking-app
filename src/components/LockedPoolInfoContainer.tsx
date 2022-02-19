import React, { useCallback, useEffect, useState } from 'react';
import { Tab, Tabs } from '@material-ui/core';
import { useStyles } from '../pages/useStyles';
import {
  calculateLockedTotalApr,
  StakeLockedPoolLength,
  StakeMode,
} from '../utils/stakeHelper';
import { useStakePool } from '../contexts/StakePoolContext';
import PoolInfoContainer from './PoolInfoContainer';

export const LockedPoolInfoContainer = () => {
  const classes = useStyles();
  const { setStakeMode } = useStakePool();
  const [tab, setTab] = useState(StakeLockedPoolLength.MONTH4);
  const [currentStakeMode, setCurrentStakeMode] = useState<StakeMode | null>(
    StakeMode.LOCKED,
  );
  const { totalInfo, setLockedPoolLength } = useStakePool();

  const handleTabChange = useCallback((event, value) => {
    setTab(value);
  }, []);

  const getLockedTotalAPR = () => {
    let lockedTotalApr = 0;
    if (totalInfo && totalInfo.chicksAmount) {
      lockedTotalApr = calculateLockedTotalApr(
        totalInfo.chicksAmount as unknown as number,
      );
    }
    return lockedTotalApr && lockedTotalApr > 0 && lockedTotalApr !== Infinity
      ? lockedTotalApr
      : 0;
  };

  useEffect(() => {
    setCurrentStakeMode(StakeMode.LOCKED);
    setStakeMode(StakeMode.LOCKED);
    setLockedPoolLength(tab);
  }, [currentStakeMode, setLockedPoolLength, setStakeMode, tab]);

  return (
    <div className={classes.card}>
      <div className={classes.header}>POOL INFO</div>
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
          <PoolInfoContainer
            totalInfo={totalInfo}
            currentApr={getLockedTotalAPR()}
          />
        </div>
      </div>
    </div>
  );
};
