import React from 'react';
import NumberFormat from 'react-number-format';
import { useStyles } from '../pages/useStyles';
import { useStakePool } from '../contexts/StakePoolContext';
import { StakeMode } from '../utils/stakeHelper';

export const PoolInfoContainer = ({ tabType }: { tabType: StakeMode }) => {
  const classes = useStyles();
  const { flexibleTotalInfo, lockedTotalInfo } = useStakePool();

  return (
    <div className={classes.card}>
      <div className={classes.header}>POOL INFO</div>
      <div className={classes.content}>
        <div className={classes.mainContent}>
          <div className={classes.contentHeading}>Total CHICKS Staked</div>
          <div className={classes.contentText}>
            {tabType === StakeMode.FLEXIBLE ? (
              flexibleTotalInfo && flexibleTotalInfo.chicksAmount.length > 0 ? (
                <>
                  <NumberFormat
                    value={flexibleTotalInfo.chicksAmount}
                    displayType="text"
                    thousandSeparator
                    decimalScale={4}
                  />
                </>
              ) : (
                <NumberFormat
                  value={0}
                  displayType="text"
                  thousandSeparator
                  decimalScale={4}
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
                    decimalScale={4}
                    fixedDecimalScale
                  />
                </>
              ) : (
                <NumberFormat
                  value={0}
                  displayType="text"
                  thousandSeparator
                  decimalScale={4}
                  fixedDecimalScale
                />
              )
            ) : null}
          </div>
        </div>
        <div className={classes.mainContent}>
          <div className={classes.contentHeading}>Est. APR</div>
          <div className={classes.contentText}>
            {tabType === StakeMode.FLEXIBLE ? (
              flexibleTotalInfo && flexibleTotalInfo.chicksAmount.length > 0 ? (
                <>
                  <NumberFormat
                    value={
                      ((((flexibleTotalInfo.chicksAmount as unknown as number) /
                        (flexibleTotalInfo.xChicksAmount as unknown as number)) *
                        100 -
                        100) *
                        365) /
                      56
                    }
                    displayType="text"
                    thousandSeparator
                    decimalScale={4}
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
