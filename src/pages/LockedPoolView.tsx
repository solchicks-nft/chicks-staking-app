/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Card, Container } from '@material-ui/core';
import { BalanceInfoContainer } from '../components/BalanceInfoContainer';
import { PoolInfoContainer } from '../components/PoolInfoContainer';
import { StakeMode } from '../utils/stakeHelper';
import { useStyles } from './useStyles';

export const LockedPoolView = () => {
  const classes = useStyles();

  return (
    <Container className="container">
      <Card className={classes.mainCard}>
        <PoolInfoContainer tabType={StakeMode.LOCKED} />
        <BalanceInfoContainer tabType={StakeMode.LOCKED} />
      </Card>
    </Container>
  );
};
