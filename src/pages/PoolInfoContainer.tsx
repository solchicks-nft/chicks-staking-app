import React from 'react';
import { useStyles } from './useStyles';

export const PoolInfoContainer = () => {
  const classes = useStyles();

  return (
    <div className={classes.card}>
      <div className={classes.header}>POOL INFO</div>
      <div className={classes.content}>
        <div className={classes.mainContent}>
          <div className={classes.contentheading}>Total CHICKS Staked</div>
          <div className={classes.contentpara}>2,337,490</div>
        </div>
        <div className={classes.mainContent}>
          <div className={classes.contentheading}>Est APR</div>
          <div className={classes.contentpara}>34%</div>
        </div>
      </div>
    </div>
  );
};
