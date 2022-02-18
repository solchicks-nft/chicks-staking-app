/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Card, Container } from '@material-ui/core';
import { BalanceInfoContainer } from '../components/BalanceInfoContainer';
import { PoolInfoContainer } from '../components/PoolInfoContainer';
import { StakeMode } from '../utils/stakeHelper';
import { useStyles } from './useStyles';
import StakeAlert from '../components/StakeAlert';

export const LockedPoolView = () => {
  const classes = useStyles();

  return (
    <Container className="container">
      <Card className={classes.mainCard}>
        <StakeAlert stakeAlertText="Please note that you will be able to unstake your tokens" />
        <PoolInfoContainer tabType={StakeMode.LOCKED} />
        <BalanceInfoContainer tabType={StakeMode.LOCKED} />
      </Card>
    </Container>
  );
};
