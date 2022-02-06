import React from 'react';
import NumberFormat from 'react-number-format';
import { useStyles } from '../pages/useStyles';
import { useStakePool } from '../contexts/StakePoolContext';
import { calculateFlexibleTotalAPR, StakeMode } from '../utils/stakeHelper';

export const PoolInfoContainer = ({ tabType }: { tabType: StakeMode }) => {
  const classes = useStyles();
  const { flexibleTotalInfo, lockedTotalInfo } = useStakePool();
  const getFlexibleTotalAPR = () => {
    let flexibleTotalApr = 0;
    if (flexibleTotalInfo && flexibleTotalInfo.chicksAmount) {
      flexibleTotalApr = calculateFlexibleTotalAPR(
        flexibleTotalInfo.chicksAmount as unknown as number,
      );
    }
    return flexibleTotalApr && flexibleTotalApr > 0 ? flexibleTotalApr : 0;
  };

  return (
    <div className={classes.card}>
      <div className={classes.header}>POOL INFO</div>
      <div className={classes.content}>
        <div
          className={classes.mainContent}
          style={{ width: tabType === StakeMode.FLEXIBLE ? '33%' : '50%' }}
        >
          <div className={classes.contentHeading}>Total CHICKS</div>
          <div className={classes.contentText}>
            {tabType === StakeMode.FLEXIBLE ? (
              flexibleTotalInfo && flexibleTotalInfo.chicksAmount.length > 0 ? (
                <>
                  <NumberFormat
                    value={flexibleTotalInfo.chicksAmount}
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
              )
            ) : null}
            {tabType === StakeMode.LOCKED ? (
              lockedTotalInfo && lockedTotalInfo.chicksAmount.length > 0 ? (
                <>
                  <NumberFormat
                    value={lockedTotalInfo.chicksAmount}
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
              )
            ) : null}
          </div>
        </div>
        {tabType === StakeMode.FLEXIBLE ? (
          <div
            className={classes.mainContent}
            style={{ width: tabType === StakeMode.FLEXIBLE ? '33%' : '50%' }}
          >
            <div className={classes.contentHeading}>Total xCHICKS</div>
            <div className={classes.contentText}>
              {flexibleTotalInfo &&
              flexibleTotalInfo.xChicksAmount.length > 0 ? (
                <>
                  <NumberFormat
                    value={flexibleTotalInfo.xChicksAmount}
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
        ) : null}
        <div
          className={classes.mainContent}
          style={{ width: tabType === StakeMode.FLEXIBLE ? '33%' : '50%' }}
        >
          <div className={classes.contentHeading}>Est. APR</div>
          <div className={classes.contentText}>
            {tabType === StakeMode.FLEXIBLE ? (
              flexibleTotalInfo && flexibleTotalInfo.chicksAmount.length > 0 ? (
                <>
                  <NumberFormat
                    value={getFlexibleTotalAPR()}
                    displayType="text"
                    thousandSeparator
                    decimalScale={1}
                  />
                  %
                </>
              ) : (
                '0%'
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
