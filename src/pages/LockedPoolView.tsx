/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Container, Step, Stepper } from '@material-ui/core';
import { PoolInfoLockedPool } from './PoolInfoLockedPool';
import { RewardsInfoLockedPool } from './RewardsInfoLockedPool';
import { BalanceInfoLockedPool } from './BalanceInfoLockedPool';
import { useStyles } from './useStyles';
import Information from '../icons/information.svg';

export const LockedPoolView = () => {
  const classes = useStyles();
  const current = new Date();
  const expiryDate = new Date(current.setMonth(current.getMonth() + 6),).toLocaleDateString('en-IN');

  return (
    <Container className="container">
      <Stepper orientation="vertical" className="step">
        <Step expanded>
          <div className={classes.flexibleAlert}>
            <img src={Information} alt="information" className={classes.info} />
            <div className={classes.alertPara}>
              CHICKS won’t be redeemable before {expiryDate}
            </div>
          </div>
          <PoolInfoLockedPool />
          <RewardsInfoLockedPool />
          <BalanceInfoLockedPool />
        </Step>
      </Stepper>
    </Container>
  );
};
