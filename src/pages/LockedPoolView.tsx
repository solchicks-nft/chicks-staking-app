/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Card, Container } from '@material-ui/core';
import StakeAlert from '../components/StakeAlert';
import { BalanceInfoContainer } from '../components/BalanceInfoContainer';
import { RewardsInfoContainer } from '../components/RewardsInfoContainer';
import { PoolInfoContainer } from '../components/PoolInfoContainer';
import { UNSTAKE_FEE } from '../utils/consts';
import { StakeMode } from '../utils/stakeHelper';
import { useStyles } from './useStyles';

export const LockedPoolView = () => {
  const classes = useStyles();

  return (
    <Container className="container">
      <Card className={classes.mainCard}>
        <StakeAlert
          stakeAlertText={`Please note that unstaking your tokens before the 8 week window will incur 
          a ${UNSTAKE_FEE}% charge.`}
        />
        <BalanceInfoContainer tabType={StakeMode.LOCKED} />
        <RewardsInfoContainer />
        <PoolInfoContainer />
      </Card>
    </Container>
  );
};
