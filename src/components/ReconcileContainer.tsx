import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Button,
  TextField,
  Typography,
} from '@material-ui/core';
import { useStyles } from '../pages/useStyles';
import ConsoleHelper from '../utils/consoleHelper';
import {
  StakeLockedKind,
  StakeMode,
} from '../utils/stakeHelper';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';
import useStakeReconcile, {ReconcileErrorCode, ReconcileStatusCode } from "../hooks/useStakeReconcile";

export const ReconcileContainer = ({ mode, lockedKind }: { mode: StakeMode, lockedKind: StakeLockedKind | null }) => {
  const classes = useStyles();
  const [transactionId, setTransactionId] = useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const {
    reconcile,
    isProcessing,
    statusCode,
    errorCode,
    lastError,
  } = useStakeReconcile();
  const { publicKey: solanaAddress } = useSolanaWallet();

  const statusMessage = useMemo(() => {
    if (isProcessing || statusCode !== ReconcileStatusCode.FAILED) {
      switch (statusCode) {
        case ReconcileStatusCode.NONE:
          return '';
        case ReconcileStatusCode.START:
          return 'Start';
        case ReconcileStatusCode.PROCESSING:
          return 'Processing';
        case ReconcileStatusCode.SUBMITTING:
          return 'Submitting result';
        case ReconcileStatusCode.SUCCESS:
          return 'Success';
        default:
          return 'Unknown';
      }
    } else {
      switch (errorCode) {
        case ReconcileErrorCode.NO_ERROR:
          return 'No error message';
        case ReconcileErrorCode.CANT_CONNECT_SOLANA:
          return "Can't connect to the Solana network";
        case ReconcileErrorCode.TOKEN_AMOUNT_NOT_ENOUGH:
          return 'Token amount is not enough';
        case ReconcileErrorCode.SERVER_INVALID:
          return 'Service unavailable';
        case ReconcileErrorCode.SOLANA_NO_ASSOC_ACCOUNT:
          return 'There is no associated token account';
        case ReconcileErrorCode.SUBMIT_FAILED:
          return lastError && lastError > '' ? lastError : 'Unknown error';
        default:
          return '';
      }
    }
  }, [isProcessing, statusCode, errorCode, lastError]);

  useEffect(() => {
    if (!isProcessing) {
      if (statusCode === ReconcileStatusCode.SUCCESS) {
        setSuccessMessage('Success');
      } else if (statusCode === ReconcileStatusCode.FAILED) {
        setErrorMessage(statusMessage);
      }
    }
  }, [isProcessing, statusCode, statusMessage, errorCode]);

  ConsoleHelper(`successMessage: ${successMessage}`);

  const onRecover = async () => {
    if (transactionId === '') {
      setErrorMessage('Please provide the transaction hash');
      return;
    }
    reconcile(mode, lockedKind, transactionId);
  };

  return (
    <div className={classes.card}>
      <div className={classes.header}>Reconcile</div>
      <div style={{ padding: '2rem'}}>
        <div style={{ paddingTop: '20px', width: '32rem' }}>
          <TextField
            label="Transaction Hash"
            variant="outlined"
            fullWidth
            value={transactionId}
            onChange={(event) => {
              setTransactionId(event.target.value);
            }}
          />
        </div>
        <div style={{marginTop: '1rem'}}>
          <Button
            variant="contained"
            color="primary"
            onClick={onRecover}
            disabled={isProcessing}
            style={{ width: '15rem' }}
          >
            {isProcessing ? 'Processing' : 'Recover'}
          </Button>
        </div>
        {!errorMessage && statusMessage ? (
          <Typography
            variant="body2"
            color="primary"
            className={classes.statusMessage}
          >
            {statusMessage}
          </Typography>
        ) : null}
        {errorMessage ? (
          <Typography
            variant="body2"
            color="error"
            className={classes.statusMessage}
          >
            {errorMessage}
          </Typography>
        ) : null}
      </div>
    </div>
  );
};
