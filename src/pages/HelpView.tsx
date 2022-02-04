/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Card, Container, Typography } from '@material-ui/core';
import { useStyles } from './useStyles';

export const HelpView = () => {
  const classes = useStyles();

  return (
    <Container className="container">
      <Card className={classes.mainCard}>
        <div style={{ padding: '2rem' }}>
          <Typography variant="h6">How do I start staking?</Typography>
          <p>
            To start staking, you will need some CHICKS tokens and a
            compatible wallet such as Phantom and Solflare. You will also need
            to have some Solana (SOL) in your wallet to cover the transaction
            fees. The recommended amount is 0.1 SOL.
          </p>
          <p>
            Once you have everything in place, log onto our staking application
            at <strong>https://staking.solchicks.io/</strong> and connect your
            wallet. You’ll see your CHICKS token balance in your wallet in the
            {' '}<strong>My Balance</strong> section and can now decide how many of
            those you want to stake. You have the option of staking all of your
            tokens or a minimum of 2000 CHICKS with 1000 CHICKS increments.
          </p>
          <p>
            Once you click on <strong>Stake</strong>, you will have to confirm
            the transaction in your wallet as below. It is the same process when
            you click on <strong>Unstake</strong> to collect your CHICKS. After
            the approval, the amount you staked will be displayed in the{' '}
            <strong>My Balance</strong> section.
          </p>
          <br />
          <Typography variant="h6">How does staking work?</Typography>
          <p>
            We have created a pool for anyone wanting to “lock” a portion of
            their CHICKS tokens in return for yield rewards. Regularly, we send
            a fixed amount to the main liquidity pool. When you unstake your
            tokens, you receive your initial staked amount plus a portion of the
            extra tokens added by the team as a reward.
          </p>
          <p>
            To claim your full reward, you will be expected to lock your CHICKS
            token in for an agreed period of time.
          </p>
          <br />
          <Typography variant="h6">What happens if I unstake early?</Typography>
          <p>
            If you unstake before the staking window closes, you will need to
            pay a penalty on top of your rewards. This early unstake fee goes
            back to the rewards pool for others.
          </p>
          <br />
          <Typography variant="h6">What are xCHICKS?</Typography>
          <p>
            Each time you stake your CHICKS tokens, you receive xCHICKS in
            return. xCHICKS can be thought of as a pool share token. A single
            xCHICKS token is always equal to 1 pool share in the CHICKS pool.
          </p>
          <p>
            The more xCHICKS you have, the more rewards you are entitled to.
            Before the team sends CHICKS tokens to the pool as yield reward, the
            amount of CHICKS in the pool is equal to the amount of CHICKS staked
            by the user (i.e. 1 CHICKS = 1xCHICKS). However, once the team
            starts sending yield rewards to the pool, the total CHICKS increases
            while the amount of xCHICKS stay the same. This means that xCHICKS
            appreciated in value, compared to CHICKS, which translates to more
            CHICKS tokens when you unstake.
          </p>
          <p>
            The value of xCHICKS is calculated by taking the total amount of
            CHICKS in the pool divided by the amount of xCHICKS in circulation.
            For example, if the pool has 100k CHICKS at the beginning of the
            year and the team adds 1k CHICKS per month. The expected amount of
            CHICKS in the pool after 1 year would be 112k CHICKS (assuming no
            additional staking or unstaking). In this very simplified scenario,
            1 xCHICKS would then equate to 1.12 CHICKS after 1 year.
          </p>
          <br />
          <Typography variant="h6">
            How do CHICKS and xCHICKS work during staking and unstaking?
          </Typography>
          <p>
            When you stake n CHICKS tokens, you receive an amount of xCHICKS
            tokens equal to <em>n * (xCHICKS_supply / CHICKS_pool_amount)</em>.
          </p>
          <p>
            When you unstake n CHICKS tokens, you receive an amount of CHICKS
            tokens equal to <em>n * (CHICKS_pool_amount / xCHICKS_supply)</em>.
            Your xCHICKS allocation is subsequently destroyed.
          </p>
          <p>
            For example, let’s say you decide to stake 1k CHICKS tokens when the
            supply of xCHICKS is 90k and the amount of CHICKS in the pool is
            100k (because 10k was sent by the team in the pool as a reward).
            This means you will receive{' '}
            <em>
              1k * (xCHICKS_supply / CHICKS_pool_amount) = 1k (90k / 100k) = 900
              xCHICKS
            </em>
            .
          </p>
          <br />
          <Typography variant="h6">Why does the APR keep changing?</Typography>
          <p>
            The amount staked in the pool is not always constant as with the
            abovementioned examples. People are staking or unstaking over time.
            This is why you will see the APR change regularly.
          </p>
        </div>
      </Card>
    </Container>
  );
};
