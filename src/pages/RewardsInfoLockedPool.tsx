import React from 'react';
import { useStyles } from './useStyles';

export const RewardsInfoLockedPool = () => {
  const classes = useStyles();

  return (
    <div className={classes.card}>
      <div className={classes.header}>MY REWARDS</div>
      <div className={classes.content}>
        <div className={classes.mainContent}>
          <div className={classes.contentheading}>Current CHICKS Amount</div>
          <div className={classes.contentpara}>0.0000</div>
          <div className={classes.contentheading}>
            0.0000 &nbsp; + &nbsp;
            <span className={classes.textGreen}>0.0000 CHICKS gained</span>
          </div>
        </div>
        <div className={classes.mainContent}>
          <div className={classes.contentheading}>Est CHICKS per day</div>
          <div className={classes.contentpara}>0.000000000</div>
        </div>
      </div>
    </div>
  );
};
