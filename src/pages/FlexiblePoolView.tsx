/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Card, Container } from '@material-ui/core';
import { PoolInfoContainer } from '../components/PoolInfoContainer';
import { RewardsInfoContainer } from '../components/RewardsInfoContainer';
import { BalanceInfoContainer } from '../components/BalanceInfoContainer';
import StakeAlert from '../components/StakeAlert';
import { useStyles } from './useStyles';

export const FlexiblePoolView = () => {
  const classes = useStyles();

  return (
    <Container className="container">
      <Card className={classes.mainCard}>
        <StakeAlert stakeAlertText="CHICKS deposited can be unlocked at any time." />
        <BalanceInfoContainer />
        <RewardsInfoContainer />
        <PoolInfoContainer />
      </Card>
    </Container>
  );
};
