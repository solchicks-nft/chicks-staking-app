import React, { useCallback, useEffect, useState } from 'react';
import { useStyles } from '../pages/useStyles';
import {
  calculateLockedTotalApr,
  StakeLockedPoolLength,
  StakeMode,
} from '../utils/stakeHelper';
import { useStakePool } from '../contexts/StakePoolContext';
import PoolInfoContainer from './PoolInfoContainer';

export const LockedPoolInfoContainer = ({
  tab,
}: {
  tab: StakeLockedPoolLength;
}) => {
  const classes = useStyles();
  const { setStakeMode } = useStakePool();
  const [currentStakeMode, setCurrentStakeMode] = useState<StakeMode | null>(
    StakeMode.LOCKED,
  );
  const [lockedTotalApr, setLockedTotalApr] = useState<number>(0);
  const { totalInfo, setLockedPoolLength } = useStakePool();

  const getLockedTotalApr = useCallback(async () => {
    let totalApr = 0;
    if (totalInfo && totalInfo.chicksAmount) {
      totalApr = calculateLockedTotalApr(
        totalInfo.chicksAmount as unknown as number,
        tab,
      );
    }
    const calculatedLockedTotalApr =
      totalApr && totalApr > 0 && totalApr !== Infinity ? totalApr : 0;
    setLockedTotalApr(calculatedLockedTotalApr);
  }, [setLockedTotalApr, tab, totalInfo]);

  useEffect(() => {
    setCurrentStakeMode(StakeMode.LOCKED);
    setStakeMode(StakeMode.LOCKED);
    setLockedPoolLength(tab);
    getLockedTotalApr().then();
  }, [
    currentStakeMode,
    getLockedTotalApr,
    setLockedPoolLength,
    setStakeMode,
    tab,
  ]);

  return (
    <div className={classes.card}>
      <div className={classes.header}>POOL INFO</div>
      <div className={classes.mainTab}>
        <div className={classes.centerTab}>
          <PoolInfoContainer
            totalInfo={totalInfo}
            currentApr={lockedTotalApr}
          />
        </div>
      </div>
    </div>
  );
};
