import React from 'react';
import { useStyles } from '../pages/useStyles';
import { useStakePool } from '../contexts/StakePoolContext';
import { StakeMode } from '../utils/stakeHelper';

export const PoolInfoContainer = ({ tabType }: { tabType: StakeMode }) => {
  const classes = useStyles();
  const { flexibleTotalInfo, lockedTotalInfo } = useStakePool();

  return (
    <div className={classes.card}>
      <div className={classes.header}>POOL INFO</div>
      <div className={classes.content}>
        <div className={classes.mainContent}>
          <div className={classes.contentHeading}>Total CHICKS Staked</div>
          <div className={classes.contentText}>
            {tabType === StakeMode.FLEXIBLE
              ? flexibleTotalInfo && flexibleTotalInfo.chicks.length > 0
                ? `${flexibleTotalInfo.chicks}`
                : '0'
              : null}
            {tabType === StakeMode.LOCKED
              ? lockedTotalInfo && lockedTotalInfo.chicks.length > 0
                ? `${lockedTotalInfo.chicks}`
                : '0'
              : null}
          </div>
        </div>
        <div className={classes.mainContent}>
          <div className={classes.contentHeading}>Est. APR</div>
          <div className={classes.contentText}>0%</div>
        </div>
      </div>
    </div>
  );
};
