/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Card, Container } from '@material-ui/core';
import { PoolInfoContainer } from '../components/PoolInfoContainer';
import { BalanceInfoContainer } from '../components/BalanceInfoContainer';
import StakeAlert from '../components/StakeAlert';
import { useStyles } from './useStyles';
import { UNSTAKE_FEE } from '../utils/consts';
import { StakeMode } from '../utils/stakeHelper';

export const FlexiblePoolView = () => {
  const classes = useStyles();

  return (
    <Container className="container">
      <Card className={classes.mainCard}>
        <StakeAlert
          stakeAlertText={`Please note that unstaking your tokens before the 8 week window will incur 
          a ${UNSTAKE_FEE}% charge.`}
        />
        <PoolInfoContainer tabType={StakeMode.FLEXIBLE} />
        <BalanceInfoContainer tabType={StakeMode.FLEXIBLE} />
      </Card>
    </Container>
  );
};
