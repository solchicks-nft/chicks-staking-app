import React from 'react';
import { useStyles } from '../pages/useStyles';

export const PoolInfoContainer = () => {
  const classes = useStyles();

  return (
    <div className={classes.card}>
      <div className={classes.header}>POOL INFO</div>
      <div className={classes.content}>
        <div className={classes.mainContent}>
          <div className={classes.contentHeading}>Total CHICKS Staked</div>
          <div className={classes.contentText}>2,337,490</div>
        </div>
        <div className={classes.mainContent}>
          <div className={classes.contentHeading}>Est. APR</div>
          <div className={classes.contentText}>34%</div>
        </div>
      </div>
    </div>
  );
};
