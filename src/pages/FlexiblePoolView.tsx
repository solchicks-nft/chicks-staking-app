/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Card, Container } from '@material-ui/core';
import { PoolInfoContainer } from '../components/PoolInfoContainer';
import { BalanceInfoContainer } from '../components/BalanceInfoContainer';
import { useStyles } from './useStyles';
import { StakeMode } from '../utils/stakeHelper';
import StakeAlert from '../components/StakeAlert';
import { UNSTAKE_FEE } from '../utils/consts';

export const FlexiblePoolView = () => {
  const classes = useStyles();

  return (
    <Container className="container">
      <Card className={classes.mainCard}>
        <StakeAlert
          stakeAlertText={`Please note that you are agreeing to stake your tokens for a minimum of 12 weeks. 
          Unstaking your tokens before the 12 week window will incur a ${UNSTAKE_FEE}% charge.`}
        />
        <PoolInfoContainer tabType={StakeMode.FLEXIBLE} />
        <BalanceInfoContainer tabType={StakeMode.FLEXIBLE} />
      </Card>
    </Container>
  );
};
