import React from 'react';
import { useStyles } from '../pages/useStyles';
import { useStakePool } from '../contexts/StakePoolContext';
import { StakeMode } from '../utils/stakeHelper';

export const PoolInfoContainer = ({ tabType }: { tabType: StakeMode }) => {
  const classes = useStyles();
  const { flexibleTotalInfo } = useStakePool();

  return (
    <div className={classes.card}>
      <div className={classes.header}>POOL INFO</div>
      <div className={classes.content}>
        <div className={classes.mainContent}>
          <div className={classes.contentHeading}>Total CHICKS Staked</div>
          <div className={classes.contentText}>
            {flexibleTotalInfo ? flexibleTotalInfo.chicks : 0}
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
