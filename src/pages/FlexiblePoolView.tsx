/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Card, Container } from '@material-ui/core';
import { PoolInfoContainer } from '../components/PoolInfoContainer';
import { BalanceInfoContainer } from '../components/BalanceInfoContainer';
import { useStyles } from './useStyles';
import { StakeMode } from '../utils/stakeHelper';

export const FlexiblePoolView = () => {
  const classes = useStyles();

  return (
    <Container className="container">
      <Card className={classes.mainCard}>
        <PoolInfoContainer tabType={StakeMode.FLEXIBLE} />
        <BalanceInfoContainer tabType={StakeMode.FLEXIBLE} />
      </Card>
    </Container>
  );
};
