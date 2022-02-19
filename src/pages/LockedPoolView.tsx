/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Card, Container } from '@material-ui/core';
import { useStyles } from './useStyles';
import StakeAlert from '../components/StakeAlert';
import { LockedPoolInfoContainer } from '../components/LockedPoolInfoContainer';
import { LockedPoolBalanceInfoContainer } from '../components/LockedPoolBalanceInfoContainer';

export const LockedPoolView = () => {
  const classes = useStyles();

  return (
    <Container className="container">
      <Card className={classes.mainCard}>
        <StakeAlert
          stakeAlertText="Please note that your tokens won't be redeemable
        before the staking window closes."
        />
        <LockedPoolInfoContainer />
        <LockedPoolBalanceInfoContainer />
      </Card>
    </Container>
  );
};
