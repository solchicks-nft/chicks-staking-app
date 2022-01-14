/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Container, Step, Stepper } from '@material-ui/core';
import { PoolInfoContainer } from './PoolInfoContainer';
import { RewardsInfoContainer } from './RewardsInfoContainer';
import { BalanceInfoContainer } from './BalanceInfoContainer';
import { useStyles } from './useStyles';
import Information from '../icons/information.svg';

export const FlexiblePoolView = () => {
  const classes = useStyles();

  return (
    <Container className="container">
      <Stepper orientation="vertical" className="step">
        <Step expanded>
          <div className={classes.flexibleAlert}>
            <img src={Information} alt="information" className={classes.info} />
            <span className={classes.alertPara}>
              You can unlock your tokens whenever you want
            </span>
          </div>

          <PoolInfoContainer />
          <RewardsInfoContainer />
          <BalanceInfoContainer />
        </Step>
      </Stepper>
    </Container>
  );
};
