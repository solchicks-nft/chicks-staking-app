/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import NumberFormat from 'react-number-format';
import { useStyles } from '../pages/useStyles';

export default function BalanceInfoContainer({ userInfo }: { userInfo: any }) {
  const classes = useStyles();

  return (
    <div className={classes.content}>
      <div className={classes.mainContent}>
        <div className={classes.contentHeading}>CHICKS Amount</div>
        <div className={classes.contentText}>
          {userInfo && userInfo.chicksAmount.length > 0 ? (
            <NumberFormat
              value={userInfo.chicksAmount}
              displayType="text"
              thousandSeparator
              decimalScale={1}
              fixedDecimalScale
            />
          ) : (
            <NumberFormat
              value={0}
              displayType="text"
              thousandSeparator
              decimalScale={1}
              fixedDecimalScale
            />
          )}
        </div>
      </div>
      <div className={classes.mainContent}>
        <div className={classes.contentHeading}>xCHICKS Amount</div>
        <div className={classes.contentText}>
          {userInfo && userInfo.chicksAmount.length > 0 ? (
            <NumberFormat
              value={userInfo.xChicksAmount}
              displayType="text"
              thousandSeparator
              decimalScale={1}
              fixedDecimalScale
            />
          ) : (
            <NumberFormat
              value={0}
              displayType="text"
              thousandSeparator
              decimalScale={1}
              fixedDecimalScale
            />
          )}
        </div>
      </div>
    </div>
  );
}
