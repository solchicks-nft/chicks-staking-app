/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback, useState } from 'react';
import { Container, Button, Step, Stepper, Tab, Tabs } from '@material-ui/core';
import { useStyles } from './useStyles';

export const LockedPoolView = () => {
  const classes = useStyles();
  const [tab, setTab] = useState('1');

  const handleChange = useCallback((event, value) => {
    setTab(value);
  }, []);

  return (
    <Container className="container">
      <Stepper orientation="vertical" className="step">
        <Step expanded>
          <div className={classes.card}>
            <div className={classes.header}>POOL INFO</div>
            <div className={classes.content}>
              <div className={classes.mainContent}>
                <div className={classes.contentheading}>Total CHICKS Staked</div>
                <div className={classes.contentpara}>2,514,801</div>
              </div>
              <div className={classes.mainContent}>
                <div className={classes.contentheading}>Est APR</div>
                <div className={classes.contentpara}>68%</div>
              </div>
            </div>
          </div>

          <div className={classes.card}>
            <div className={classes.header}>MY REWARDS</div>
            <div className={classes.content}>
              <div className={classes.mainContent}>
                <div className={classes.contentheading}>
                  Current CHICKS Amount
                </div>
                <div className={classes.contentpara}>0.0000</div>
                <div className={classes.contentheading}>
                  0.0000 &nbsp; + &nbsp;
                  <span className={classes.textGreen}>0.0000 CHICKS gained</span>
                </div>
              </div>
              <div className={classes.mainContent}>
                <div className={classes.contentheading}>Est CHICKS per day</div>
                <div className={classes.contentpara}>0.000000000</div>
              </div>
            </div>
          </div>

          <div className={classes.card}>
            <div className={classes.header}>MY BALANCE</div>
            <div className={classes.contentlocked}>
              <div className={classes.mainContent}>
                <div className={classes.contentheading}>
                  Current CHICKS Amount
                </div>
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
        </Step>
      </Stepper>
    </Container>
  );
};
