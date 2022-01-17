import React from 'react';
import Information from '../icons/information.svg';
import { useStyles } from '../pages/useStyles';

export default function StakeAlert({
  stakeAlertText,
}: {
  stakeAlertText: string;
}) {
  const classes = useStyles();

  return (
    <div className={classes.flexibleAlert}>
      <img src={Information} alt="information" className={classes.info} />
      <span className={classes.alertText}>{stakeAlertText}</span>
    </div>
  );
}
