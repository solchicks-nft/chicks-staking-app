/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import NumberFormat from 'react-number-format';
import { useStyles } from '../pages/useStyles';

export default function PoolInfoContainer({
  totalInfo,
  currentApr,
}: {
  totalInfo: any;
  currentApr: number;
}) {
  const classes = useStyles();

  return (
    <div className={classes.content}>
      <div className={classes.mainContent} style={{ width: '33%' }}>
        <div className={classes.contentHeading}>Total CHICKS</div>
        <div className={classes.contentText}>
          {totalInfo && totalInfo.chicksAmount.length > 0 ? (
            <>
              <NumberFormat
                value={totalInfo.chicksAmount}
                displayType="text"
                thousandSeparator
                decimalScale={1}
                fixedDecimalScale
              />
            </>
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
      <div className={classes.mainContent} style={{ width: '33%' }}>
        <div className={classes.contentHeading}>Total xCHICKS</div>
        <div className={classes.contentText}>
          {totalInfo && totalInfo.xChicksAmount.length > 0 ? (
            <>
              <NumberFormat
                value={totalInfo.xChicksAmount}
                displayType="text"
                thousandSeparator
                decimalScale={1}
                fixedDecimalScale
              />
            </>
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
      <div className={classes.mainContent} style={{ width: '33%' }}>
        <div className={classes.contentHeading}>Est. APR</div>
        <div className={classes.contentText}>
          {totalInfo && totalInfo.chicksAmount.length > 0 ? (
            <>
              <NumberFormat
                value={currentApr}
                displayType="text"
                thousandSeparator
                decimalScale={1}
              />
              %
            </>
          ) : (
            '0%'
          )}
        </div>
      </div>
    </div>
  );
}
