/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Card, Container } from '@material-ui/core';
import StakeAlert from '../components/StakeAlert';
import { BalanceInfoContainer } from '../components/BalanceInfoContainer';
import { RewardsInfoContainer } from '../components/RewardsInfoContainer';
import { PoolInfoContainer } from '../components/PoolInfoContainer';
import { StakeMode } from '../utils/stakeHelper';
import { useStyles } from './useStyles';

export const LockedPoolView = () => {
  const classes = useStyles();

  return (
    <Container className="container">
      <Card className={classes.mainCard}>
        <StakeAlert
          stakeAlertText="Please note that you will not be able to unstake your tokens before the
        end of the 8 week window."
        />
        <BalanceInfoContainer tabType={StakeMode.LOCKED} />
        <RewardsInfoContainer tabType={StakeMode.LOCKED} />
        <PoolInfoContainer tabType={StakeMode.LOCKED} />
      </Card>
    </Container>
  );
};
