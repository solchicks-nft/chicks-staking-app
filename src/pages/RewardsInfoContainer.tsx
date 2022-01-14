import React from 'react';
import { useStyles } from './useStyles';

export const RewardsInfoContainer = () => {
  const classes = useStyles();

  return (
    <div className={classes.card}>
      <div className={classes.header}>MY REWARDS</div>
      <div className={classes.contentflexible}>
        <div className={classes.mainContent}>
          <div className={classes.contentheading}>Current CHICKS Amount</div>
          <div className={classes.contentpara}>0.0000</div>
        </div>
        <div className={classes.mainContent}>
          <div className={classes.contentheading}>Est CHICKS per day</div>
          <div className={classes.contentpara}>0.000000000</div>
        </div>
      </div>
    </div>
  );
};
