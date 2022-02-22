import React, { useEffect, useState } from 'react';
import { useStyles } from '../pages/useStyles';
import { useStakePool } from '../contexts/StakePoolContext';
import { calculateFlexibleTotalApr, StakeMode } from '../utils/stakeHelper';
import PoolInfoContainer from './PoolInfoContainer';

export const FlexiblePoolInfoContainer = () => {
  const classes = useStyles();
  const { totalInfo, setStakeMode } = useStakePool();
  const [currentStakeMode, setCurrentStakeMode] = useState<StakeMode | null>(
    StakeMode.FLEXIBLE,
  );

  const getFlexibleTotalApr = () => {
    let flexibleTotalApr = 0;
    if (totalInfo && totalInfo.chicksAmount) {
      flexibleTotalApr = calculateFlexibleTotalApr(
        totalInfo.chicksAmount as unknown as number,
      );
    }
    return flexibleTotalApr &&
      flexibleTotalApr > 0 &&
      flexibleTotalApr !== Infinity
      ? flexibleTotalApr
      : 0;
  };

  useEffect(() => {
    setCurrentStakeMode(StakeMode.FLEXIBLE);
    setStakeMode(StakeMode.FLEXIBLE);
  }, [currentStakeMode, setStakeMode]);

  return (
    <div className={classes.card}>
      <div className={classes.header}>POOL INFO</div>
      <PoolInfoContainer
        totalInfo={totalInfo}
        currentApr={getFlexibleTotalApr()}
      />
    </div>
  );
};
