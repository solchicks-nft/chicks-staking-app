import React, { ChangeEvent, useCallback, useState } from 'react';
import {
  Tab,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@material-ui/core';
import { PublicKey } from '@solana/web3.js';
import { useStyles } from '../pages/useStyles';
import { SOLCHICK_BALANCE_TAB_STATE } from '../utils/solchickConsts';
import ButtonWithLoader from './ButtonWithLoader';
import ConsoleHelper from '../utils/consoleHelper';
import SolanaWalletKey from './SolanaWalletKey';
import useStake from '../hooks/useStake';
import { useStakePool } from '../contexts/StakePoolContext';
import { StakeMode } from '../utils/stakeHelper';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';
import { isAddress } from '../utils/solanaHelper';

export const BalanceInfoContainer = ({ tabType }: { tabType: StakeMode }) => {
  const [tab, setTab] = useState(SOLCHICK_BALANCE_TAB_STATE.STAKE);
  const [inputVal, setInput] = useState('');
  const classes = useStyles();
  const wallet = useSolanaWallet();
  const { stake } = useStake(tabType);
  const { publicKey: solanaAddress } = useSolanaWallet();

  const handleChange = useCallback((event, value) => {
    setTab(value);
  }, []);

  const handleButtonClick = () => {
    ConsoleHelper(`BalanceInfoContainer -> ${tab}`);
  };

  const handleActionClick = () => {
    if (wallet.connected && inputVal.length > 0 && parseFloat(inputVal) > 0) {
      ConsoleHelper(`BalanceInfoContainer -> ${tab}`);
      stake(Number(inputVal));
    }
  };

  const handleStakeAmountChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInput(e.target.value.toString());
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event && event.key) {
      event.preventDefault();
    }
  };

  const { flexibleUserInfo, lockedUserInfo, flexibleTotalInfo } = useStakePool();

  ConsoleHelper(flexibleUserInfo, lockedUserInfo, flexibleTotalInfo);

  return (
    <div className={classes.card}>
      <div className={classes.header}>MY BALANCE</div>
      <div className={classes.content}>
        <div
          className={
            tabType === StakeMode.FLEXIBLE
              ? classes.mainContent
              : classes.tabContent
          }
        >
          <div className={classes.contentHeading}>CHICKS Amount</div>
          <div className={classes.contentText}>
            {tabType === StakeMode.FLEXIBLE
              ? flexibleUserInfo && flexibleUserInfo.chicks.length > 0
                ? `${flexibleUserInfo.chicks} CHICKS`
                : '0 CHICKS'
              : null}
            {tabType === StakeMode.LOCKED
              ? lockedUserInfo && lockedUserInfo.chicks.length > 0
                ? `${lockedUserInfo.chicks} CHICKS`
                : '0 CHICKS'
              : null}
          </div>
        </div>
        {tabType === StakeMode.FLEXIBLE ? (
          <div className={classes.mainContent}>
            <div className={classes.contentHeading}>xCHICKS Amount</div>
            <div className={classes.contentText}>
              {flexibleUserInfo && flexibleUserInfo.chicks.length > 0
                ? `${flexibleUserInfo.xChicks}`
                : '0'}
            </div>
          </div>
        ) : null}
      </div>
      <div className={classes.mainTab}>
        <div className={classes.centerTab}>
          <Tabs
            value={tab}
            variant="fullWidth"
            indicatorColor="primary"
            onChange={handleChange}
          >
            <Tab
              className={classes.tab}
              label="STAKE"
              value={SOLCHICK_BALANCE_TAB_STATE.STAKE}
            />
            <Tab
              className={classes.tab}
              label="UNSTAKE"
              value={SOLCHICK_BALANCE_TAB_STATE.UNSTAKE}
            />
          </Tabs>
          <div
            className={classes.tabContainer}
            style={{
              justifyContent:
                tab === SOLCHICK_BALANCE_TAB_STATE.STAKE ? 'center' : '',
            }}
          >
            <div
              className={classes.childTabContainer}
              style={{
                width:
                  tab === SOLCHICK_BALANCE_TAB_STATE.STAKE ? '50%' : '100%',
              }}
            >
              {tab === SOLCHICK_BALANCE_TAB_STATE.STAKE ? (
                <>
                  <div className={classes.stakeBalanceTab}>
                    <div className={classes.amount}>
                      <TextField
                        placeholder="0.00"
                        type="number"
                        value={inputVal}
                        onChange={handleStakeAmountChange}
                        // onKeyDown={(e) => handleKeyPress(e)}
                        inputProps={{
                          maxLength: 100,
                          step: '1000',
                          min: 2000,
                          disableunderline: 'true',
                        }}
                        disabled={
                          !isAddress(solanaAddress as PublicKey | string)
                        }
                      />
                    </div>
                    <ButtonWithLoader
                      onClick={handleButtonClick}
                      disabled={!isAddress(solanaAddress as PublicKey | string)}
                    >
                      Max
                    </ButtonWithLoader>
                    <div style={{ paddingLeft: '7px' }} />
                    <ButtonWithLoader
                      onClick={handleActionClick}
                      disabled={!isAddress(solanaAddress as PublicKey | string)}
                    >
                      Stake
                    </ButtonWithLoader>
                  </div>
                  <SolanaWalletKey />
                </>
              ) : null}
              {tab === SOLCHICK_BALANCE_TAB_STATE.UNSTAKE ? (
                <div
                  style={{
                    paddingTop: '1.5rem',
                    paddingLeft: '4rem',
                    width: '100%',
                  }}
                >
                  {!isAddress(solanaAddress as PublicKey | string) ? (
                    <div>
                      Please connect your wallet to check your staked tokens.
                      <div
                        style={{
                          paddingTop: '1rem',
                        }}
                      >
                        <SolanaWalletKey />
                      </div>
                    </div>
                  ) : null}
                  {isAddress(solanaAddress as PublicKey | string) ? (
                    <div>
                      <Typography variant="h6">Staked Tokens</Typography>
                      <div
                        style={{
                          paddingTop: '1rem',
                          paddingBottom: '1rem',
                        }}
                      >
                        <SolanaWalletKey />
                      </div>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Tx Hash</TableCell>
                              <TableCell>Amount</TableCell>
                              <TableCell>Start Date</TableCell>
                              <TableCell>End Date</TableCell>
                              <TableCell>Rewards</TableCell>
                            </TableRow>
                          </TableHead>
                        </Table>
                      </TableContainer>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
