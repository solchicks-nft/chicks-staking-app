import React from 'react';
import { useStyles } from '../pages/useStyles';
import { StakeMode } from '../utils/stakeHelper';

export const RewardsInfoContainer = ({ tabType }: { tabType: StakeMode }) => {
  const classes = useStyles();

  return (
    <div className={classes.card}>
      <div className={classes.header}>MY REWARDS</div>
      <div className={classes.flexibleContentContainer}>
        <div className={classes.mainContent}>
          <div className={classes.contentHeading}>Current CHICKS Amount</div>
          <div className={classes.contentText}>0</div>
        </div>
        <div className={classes.mainContent}>
          <div className={classes.contentHeading}>Est. CHICKS Per Day</div>
          <div className={classes.contentText}>0</div>
        </div>
      </div>
    </div>
  );
};
