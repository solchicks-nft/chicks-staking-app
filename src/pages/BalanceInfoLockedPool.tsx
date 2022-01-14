import React, { useCallback, useState } from 'react';
import { Button, Tab, Tabs } from '@material-ui/core';
import { useStyles } from './useStyles';

export const BalanceInfoLockedPool = () => {
  const classes = useStyles();
  const [tab, setTab] = useState('1');

  const handleChange = useCallback((event, value) => {
    setTab(value);
  }, []);
  return (
    <div className={classes.card}>
      <div className={classes.header}>MY BALANCE</div>
      <div className={classes.contentlocked}>
        <div className={classes.mainContent}>
          <div className={classes.contentheading}>CHICKS Amount</div>
          <div className={classes.contentpara}>0.0000</div>
        </div>
      </div>
      <div className={classes.mainTab}>
        <div className={classes.centerTab}>
          <Tabs
            value={tab}
            variant="fullWidth"
            indicatorColor="primary"
            onChange={handleChange}
          >
            <Tab className={classes.tab} label="STAKE" value="1" />
            <Tab className={classes.tab} label="UNSTAKE" value="2" />
          </Tabs>
          <div className={classes.tabmain}>
            {tab === '1' ? (
              <div className={classes.mainleft}>
                <div className={classes.balanceTab}>
                  <div className={classes.amount}>
                    0.00
                    <span className={classes.amountText}>CHICKS</span>
                  </div>
                  <Button className={classes.max}>Max</Button>
                </div>
                <Button className={classes.wallet}>Connect Wallet</Button>
              </div>
            ) : (
              <div className={classes.mainleft}>
                <div className={classes.balanceTab}>
                  <div className={classes.amount}>
                    0.00
                    <span className={classes.amountText}>xCHICKS</span>
                  </div>
                  <Button className={classes.max}>Max</Button>
                </div>
                <Button className={classes.wallet}>Connect Wallet</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
