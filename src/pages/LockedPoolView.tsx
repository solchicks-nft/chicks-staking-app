/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Card, Container } from '@material-ui/core';
import { RewardsInfoContainer } from '../components/RewardsInfoContainer';
import { PoolInfoContainer } from '../components/PoolInfoContainer';
import { BalanceInfoContainer } from '../components/BalanceInfoContainer';
import StakeAlert from '../components/StakeAlert';
import { useStyles } from './useStyles';

export const LockedPoolView = () => {
  const unstakeDate = new Date(
    new Date().setMonth(new Date().getMonth() + 6),
  ).toDateString();
  const classes = useStyles();

  return (
    <Container className="container">
      <Card className={classes.mainCard}>
        <StakeAlert
          stakeAlertText={`CHICKS deposited won’t be redeemable until ${unstakeDate}.`}
        />
        <BalanceInfoContainer />
        <RewardsInfoContainer />
        <PoolInfoContainer />
      </Card>
    </Container>
  );
};
