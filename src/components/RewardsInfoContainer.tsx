import React from 'react';
import { useStyles } from '../pages/useStyles';

export const RewardsInfoContainer = () => {
  const classes = useStyles();

  return (
    <div className={classes.card}>
      <div className={classes.header}>MY REWARDS</div>
      <div className={classes.flexibleContentContainer}>
        <div className={classes.mainContent}>
          <div className={classes.contentHeading}>Current CHICKS Amount</div>
          <div className={classes.contentText}>0.0000</div>
        </div>
        <div className={classes.mainContent}>
          <div className={classes.contentHeading}>Est. CHICKS per day</div>
          <div className={classes.contentText}>0.000000000</div>
        </div>
      </div>
    </div>
  );
};
