pub mod utils;
use borsh::{BorshDeserialize,BorshSerialize};
use {
    crate::utils::*,
    anchor_lang::{
        prelude::*,
        AnchorDeserialize,
        AnchorSerialize,
        Key,
        solana_program::{
            program_pack::Pack,
            sysvar::{clock::Clock},
            msg
        }
    },
    spl_token::state,
};
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod chicks_staking {
    use super::*;

    pub fn init_pool(
        ctx : Context<InitPool>,
        _bump : u8,
        ) -> ProgramResult {

        msg!("Init Pool");

        let pool = &mut ctx.accounts.pool;
        let reward_account : state::Account = state::Account::unpack_from_slice(&ctx.accounts.reward_account.data.borrow())?;
        if reward_account.owner != pool.key() {
            return Err(PoolError::InvalidTokenAccount.into());
        }
        if reward_account.mint != *ctx.accounts.reward_mint.key {
            return Err(PoolError::InvalidTokenAccount.into());
        }

        pool.owner = *ctx.accounts.owner.key;
        pool.rand = *ctx.accounts.rand.key;
        pool.reward_mint = *ctx.accounts.reward_mint.key;
        pool.reward_account = *ctx.accounts.reward_account.key;
        pool.staked_amount = 0;
        pool.bump = _bump;

        Ok(())
    }

    pub fn stake(
        ctx : Context<Stake>,
        _amount : u64,
        _end_time : i64,
        _fee : u64
        ) -> ProgramResult {

        msg!("Stake");

        let pool = &mut ctx.accounts.pool;
        let clock = Clock::from_account_info(&ctx.accounts.clock)?;

        if pool.reward_account == *ctx.accounts.source_reward_account.key {
            msg!("Source reward account must be staker's reward account");
            return Err(PoolError::InvalidTokenAccount.into());
        }
        if pool.reward_account != *ctx.accounts.dest_reward_account.key {
            msg!("Dest reward account should be pool's reward account");
            return Err(PoolError::InvalidTokenAccount.into());
        }

        spl_token_transfer_without_seed(
            TokenTransferParamsWithoutSeed{
                source : ctx.accounts.source_reward_account.clone(),
                destination : ctx.accounts.dest_reward_account.clone(),
                authority : ctx.accounts.owner.clone(),
                token_program : ctx.accounts.token_program.clone(),
                amount : _amount,
            }
        )?;

        let stake_data = &mut ctx.accounts.stake_data;
        stake_data.owner = *ctx.accounts.owner.key;
        stake_data.pool = pool.key();
        stake_data.account = *ctx.accounts.dest_reward_account.key;
        stake_data.stake_time = clock.unix_timestamp;
        stake_data.stake_amount = _amount;
        stake_data.end_time = _end_time;
        stake_data.fee = _fee;

        pool.staked_amount += _amount;

        Ok(())
    }

    pub fn unstake(
        ctx : Context<Stake>,
        _amount : u64
        ) -> ProgramResult {

        msg!("Unstake");

        let pool = &mut ctx.accounts.pool;
        let clock = Clock::from_account_info(&ctx.accounts.clock)?;
        let stake_data = &mut ctx.accounts.stake_data;

        let pool_reward_account : state::Account = state::Account::unpack_from_slice(&ctx.accounts.dest_reward_account.data.borrow())?;
        let pool_token_amount = pool_reward_account.amount;
        if pool_token_amount < _amount {
            msg!("Pool has insufficient funds.");
            return Err(PoolError::PoolInsufficientFunds.into());
        }

        if stake_data.stake_amount < _amount {
            msg!("Invalid amount");
            return Err(PoolError::InvalidStakeData.into());
        }
        if pool.reward_account == *ctx.accounts.source_reward_account.key {
            msg!("Source reward account must be staker's reward account");
            return Err(PoolError::InvalidTokenAccount.into());
        }
        if pool.reward_account != *ctx.accounts.dest_reward_account.key {
            msg!("Dest reward account should be pool's reward account");
            return Err(PoolError::InvalidTokenAccount.into());
        }

        let now_time = clock.unix_timestamp;
        if now_time < stake_data.stake_time {
            msg!("Invalid time now");
            return Err(PoolError::InvalidTime.into());
        }

        let what: u64 = _amount + (_amount as u128)
            .checked_mul(stake_data.stake_amount as u128)
            .unwrap()
            .checked_div(pool.staked_amount as u128)
            .unwrap()
            .try_into()
            .unwrap();

        let amount_leave_pool: u64;
        if now_time < stake_data.end_time {
            amount_leave_pool = (what as u128)
                .checked_mul(stake_data.fee as u128)
                .unwrap()
                .checked_div(100 as u128)
                .unwrap()
                .try_into()
                .unwrap();
        } else {
            amount_leave_pool = 0;
        }
        let amount_to_staker = what - amount_leave_pool;

        spl_token_transfer_without_seed(
            TokenTransferParamsWithoutSeed{
                source : ctx.accounts.source_reward_account.clone(),
                destination : ctx.accounts.dest_reward_account.clone(),
                authority : ctx.accounts.owner.clone(),
                token_program : ctx.accounts.token_program.clone(),
                amount : amount_to_staker,
            }
        )?;

        stake_data.stake_amount -= _amount;
        pool.staked_amount -= _amount;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut, signer)]
    owner : AccountInfo<'info>,

    #[account(mut)]
    pool : ProgramAccount<'info, Pool>,

    #[account(init, payer=owner, space= 8 + STAKE_DATA_SIZE)]
    stake_data : ProgramAccount<'info, StakeData>,

    #[account(mut,owner=spl_token::id())]
    source_reward_account : AccountInfo<'info>,

    #[account(mut,owner=spl_token::id())]
    dest_reward_account : AccountInfo<'info>,

    #[account(address=spl_token::id())]
    token_program : AccountInfo<'info>,

    system_program : Program<'info, System>,

    clock : AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(_bump : u8)]
pub struct InitPool<'info> {
    #[account(mut, signer)]
    owner : AccountInfo<'info>,

    #[account(init, seeds = [(*rand.key).as_ref()], bump = _bump, payer = owner, space = 8 + POOL_SIZE)]
    pool : ProgramAccount<'info, Pool>,

    rand : AccountInfo<'info>,

    #[account(owner = spl_token::id())]
    reward_mint : AccountInfo<'info>,

    #[account(owner = spl_token::id())]
    reward_account : AccountInfo<'info>,

    system_program : Program<'info, System>,
}

pub const POOL_SIZE : usize = 32 + 32 + 32 + 32 + 8 + 1;
pub const STAKE_DATA_SIZE : usize = 32 + 32 + 32 + 8 + 8 + 8 + 8;

#[account]
pub struct Pool {
    pub owner : Pubkey,
    pub rand : Pubkey,
    pub reward_mint : Pubkey,
    pub reward_account : Pubkey,
    pub staked_amount : u64,
    pub bump : u8,
}

#[account]
pub struct StakeData {
    pub owner : Pubkey,
    pub pool : Pubkey,
    pub account : Pubkey,
    pub stake_amount: u64,
    pub stake_time : i64,
    pub end_time : i64,
    pub fee : u64
}

#[error]
pub enum PoolError {
    #[msg("Token mint to failed")]
    TokenMintToFailed,

    #[msg("Token set authority failed")]
    TokenSetAuthorityFailed,

    #[msg("Token transfer failed")]
    TokenTransferFailed,

    #[msg("Invalid token account")]
    InvalidTokenAccount,

    #[msg("Overflow reward")]
    OverflowReward,

    #[msg("Have no reward")]
    HaveNoReward,

    #[msg("Invalid token mint")]
    InvalidTokenMint,

    #[msg("Invalid stakedata account")]
    InvalidStakeData,

    #[msg("Invalid time")]
    InvalidTime,

    #[msg("Invalid Period")]
    InvalidPeriod,

    #[msg("Invalid Stake Amount")]
    InvalidStakeAmount,

    #[msg("Pool is stopped")]
    PoolStopped,

    #[msg("You are not Pool owner")]
    InvalidOwner,

    #[msg("Pool is insufficient funds.")]
    PoolInsufficientFunds,
}
