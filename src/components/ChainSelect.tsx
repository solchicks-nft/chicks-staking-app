/* eslint-disable react/jsx-props-no-spreading,@typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import {
  ListItemIcon,
  ListItemText,
  makeStyles,
  MenuItem,
  OutlinedTextFieldProps,
  TextField,
} from '@material-ui/core';
import clsx from 'clsx';
import { useBetaContext } from '../contexts/BetaContext';
import { BETA_CHAINS, ChainInfo } from '../utils/consts';

const useStyles = makeStyles(() => ({
  select: {
    '& .MuiSelect-root': {
      display: 'flex',
      alignItems: 'center',
    },
  },
  listItemIcon: {
    minWidth: 40,
  },
  icon: {
    height: 24,
    maxWidth: 24,
  },
}));

const createChainMenuItem = ({ id, name, logo }: ChainInfo, classes: any) => (
  <MenuItem key={id} value={id}>
    <ListItemIcon className={classes.listItemIcon}>
      <img src={logo} alt={name} className={classes.icon} />
    </ListItemIcon>
    <ListItemText>
      <span>{name}</span>
    </ListItemText>
  </MenuItem>
);

interface ChainSelectProps extends OutlinedTextFieldProps {
  chains: ChainInfo[];
}

export default function ChainSelect({ chains, ...rest }: ChainSelectProps) {
  const classes = useStyles();
  const isBeta = useBetaContext();
  const filteredChains = useMemo(
    () =>
      chains.filter(({ id }) => (isBeta ? true : !BETA_CHAINS.includes(id))),
    [chains, isBeta],
  );
  return (
    <TextField {...rest} className={clsx(classes.select, rest.className)}>
      {filteredChains.map((chain) => createChainMenuItem(chain, classes))}
    </TextField>
  );
}
