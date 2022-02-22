/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Card, Container } from '@material-ui/core';
import { FlexiblePoolInfoContainer } from '../components/FlexiblePoolInfoContainer';
import { FlexiblePoolBalanceInfoContainer } from '../components/FlexiblePoolBalanceInfoContainer';
import { useStyles } from './useStyles';
import StakeAlert from '../components/StakeAlert';
import { FLEX_UNLOCK_WEEKS, UNSTAKE_FEE } from '../utils/consts';

export const FlexiblePoolView = () => {
  const classes = useStyles();

  return (
    <Container className="container">
      <Card className={classes.mainCard}>
        <StakeAlert
          stakeAlertText={`Please note that you are agreeing to stake your tokens 
          for a minimum of ${FLEX_UNLOCK_WEEKS} weeks.  Unstaking your tokens 
          before the ${FLEX_UNLOCK_WEEKS} week window will incur a ${UNSTAKE_FEE}% charge.`}
        />
        <FlexiblePoolInfoContainer />
        <FlexiblePoolBalanceInfoContainer />
      </Card>
    </Container>
  );
};
