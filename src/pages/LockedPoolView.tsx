/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback, useState } from 'react';
import { Card, Container, Tab, Tabs } from '@material-ui/core';
import { useStyles } from './useStyles';
import StakeAlert from '../components/StakeAlert';
import { LockedPoolInfoContainer } from '../components/LockedPoolInfoContainer';
import { LockedPoolBalanceInfoContainer } from '../components/LockedPoolBalanceInfoContainer';
import { StakeLockedPoolLength } from '../utils/stakeHelper';

export const LockedPoolView = () => {
  const classes = useStyles();
  const [tab, setTab] = useState(StakeLockedPoolLength.MONTH4);
  const handleTabChange = useCallback((event, value) => {
    setTab(value);
  }, []);

  return (
    <Container className="container">
      <Card className={classes.mainCard}>
        <StakeAlert
          stakeAlertText="Please note that your tokens won't be redeemable
        before the staking window closes."
        />
        <Tabs
          value={tab}
          variant="fullWidth"
          indicatorColor="primary"
          onChange={handleTabChange}
        >
          <Tab
            className={classes.tab}
            label="4 MONTHS"
            value={StakeLockedPoolLength.MONTH4}
          />
          <Tab
            className={classes.tab}
            label="8 MONTHS"
            value={StakeLockedPoolLength.MONTH8}
          />
          <Tab
            className={classes.tab}
            label="12 MONTHS"
            value={StakeLockedPoolLength.MONTH12}
          />
        </Tabs>
        <div className={classes.mainTab}>
          <LockedPoolInfoContainer tab={tab} />
          <LockedPoolBalanceInfoContainer tab={tab} />
        </div>
      </Card>
    </Container>
  );
};
