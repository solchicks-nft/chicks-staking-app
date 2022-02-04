import React from 'react';
import NumberFormat from 'react-number-format';
import { useStyles } from '../pages/useStyles';
import { useStakePool } from '../contexts/StakePoolContext';
import {calcAPR, StakeMode} from '../utils/stakeHelper';

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
        <div className={classes.mainContent}>
          <div className={classes.contentHeading}>Est. APR</div>
          <div className={classes.contentText}>
            {tabType === StakeMode.FLEXIBLE ? (
              flexibleTotalInfo && flexibleTotalInfo.chicksAmount.length > 0 ? (
                <>
                  <NumberFormat
                    value={calcAPR(
                        (flexibleTotalInfo.chicksAmount as unknown as number),
                        (flexibleTotalInfo.xChicksAmount as unknown as number))
                    }
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
