import { describe, it, expect, vi } from 'vitest'
import { extractAccountDiffs, computeAccountDiffs, computeTokenDiffs } from '../src/index.js'
import type { Connection, VersionedTransactionResponse } from '@solana/web3.js'
import simpleTx from './fixtures/simple-transfer.json'
import tokenTx from './fixtures/token-transfer.json'

// extractAccountDiffs accepts a connection but only uses it for future raw data fetches.
// The balance diffs come entirely from tx.meta, so we can pass a stub connection.
const mockConnection = {} as Connection

describe('extractAccountDiffs', () => {
  it('extracts lamport diffs for all accounts', async () => {
    const diffs = await extractAccountDiffs(
      simpleTx as unknown as VersionedTransactionResponse,
      mockConnection,
    )

    expect(diffs).toHaveLength(3) // sender, receiver, system program

    const sender = diffs[0]!
    expect(sender.address).toBe('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
    expect(sender.lamports.pre).toBe(1000000000)
    expect(sender.lamports.post).toBe(999495000)
    expect(sender.lamports.delta).toBe(-505000)

    const receiver = diffs[1]!
    expect(receiver.address).toBe('BrG44HdsEhzapvs8bEqzvkq4egwevS2y3W5D5zMtWen')
    expect(receiver.lamports.delta).toBe(500000)
  })

  it('includes no token balance when preTokenBalances and postTokenBalances are empty', async () => {
    const diffs = await extractAccountDiffs(
      simpleTx as unknown as VersionedTransactionResponse,
      mockConnection,
    )
    for (const diff of diffs) {
      expect(diff.tokenBalance).toBeUndefined()
    }
  })

  it('computes token balance deltas when token balances are present', async () => {
    const txWithToken = {
      ...simpleTx,
      meta: {
        ...simpleTx.meta,
        preTokenBalances: [{
          accountIndex: 1,
          mint: 'So11111111111111111111111111111111111111112',
          uiTokenAmount: { uiAmountString: '10.5', decimals: 9, amount: '10500000000', uiAmount: 10.5 },
          owner: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        }],
        postTokenBalances: [{
          accountIndex: 1,
          mint: 'So11111111111111111111111111111111111111112',
          uiTokenAmount: { uiAmountString: '15.0', decimals: 9, amount: '15000000000', uiAmount: 15.0 },
          owner: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        }],
      },
    }

    const diffs = await extractAccountDiffs(
      txWithToken as unknown as VersionedTransactionResponse,
      mockConnection,
    )

    const tokenAccount = diffs[1]!
    expect(tokenAccount.tokenBalance).toBeDefined()
    expect(tokenAccount.tokenBalance!.pre).toBe('10.5')
    expect(tokenAccount.tokenBalance!.post).toBe('15.0')
    expect(tokenAccount.tokenBalance!.delta).toBe('4.5')
  })
})

// ── computeAccountDiffs ───────────────────────────────────────────────────────

describe('computeAccountDiffs', () => {
  it('is synchronous and returns the same lamport diffs as extractAccountDiffs', async () => {
    const sync  = computeAccountDiffs(simpleTx as unknown as VersionedTransactionResponse)
    const async_ = await extractAccountDiffs(simpleTx as unknown as VersionedTransactionResponse, mockConnection)

    expect(sync).toHaveLength(async_.length)
    for (let i = 0; i < sync.length; i++) {
      expect(sync[i]!.address).toBe(async_[i]!.address)
      expect(sync[i]!.lamports).toEqual(async_[i]!.lamports)
    }
  })

  it('does not include tokenBalance (lamport-only scope)', () => {
    const diffs = computeAccountDiffs(tokenTx as unknown as VersionedTransactionResponse)
    for (const d of diffs) {
      expect(d.tokenBalance).toBeUndefined()
    }
  })

  it('computes correct lamport delta for sender', () => {
    const diffs = computeAccountDiffs(simpleTx as unknown as VersionedTransactionResponse)
    expect(diffs[0]!.lamports.delta).toBe(-505000)
    expect(diffs[1]!.lamports.delta).toBe(500000)
  })
})

// ── computeTokenDiffs ─────────────────────────────────────────────────────────

describe('computeTokenDiffs', () => {
  it('returns two entries for sender and receiver token accounts', () => {
    const diffs = computeTokenDiffs(tokenTx as unknown as VersionedTransactionResponse)
    expect(diffs).toHaveLength(2)
  })

  it('orders results by accountIndex ascending', () => {
    const diffs = computeTokenDiffs(tokenTx as unknown as VersionedTransactionResponse)
    expect(diffs[0]!.accountIndex).toBe(1)
    expect(diffs[1]!.accountIndex).toBe(2)
  })

  it('sender: preAmount=100_000_000n, postAmount=95_000_000n, delta=-5_000_000n', () => {
    const diffs = computeTokenDiffs(tokenTx as unknown as VersionedTransactionResponse)
    const sender = diffs[0]!
    expect(sender.preAmount).toBe(100_000_000n)
    expect(sender.postAmount).toBe(95_000_000n)
    expect(sender.delta).toBe(-5_000_000n)
  })

  it('receiver: preAmount=0n (absent), postAmount=5_000_000n, delta=+5_000_000n', () => {
    const diffs = computeTokenDiffs(tokenTx as unknown as VersionedTransactionResponse)
    const receiver = diffs[1]!
    expect(receiver.preAmount).toBe(0n)
    expect(receiver.postAmount).toBe(5_000_000n)
    expect(receiver.delta).toBe(5_000_000n)
  })

  it('sender uiDelta is "-5.000000" (6 decimals)', () => {
    const diffs = computeTokenDiffs(tokenTx as unknown as VersionedTransactionResponse)
    expect(diffs[0]!.uiDelta).toBe('-5.000000')
  })

  it('receiver uiDelta is "5.000000"', () => {
    const diffs = computeTokenDiffs(tokenTx as unknown as VersionedTransactionResponse)
    expect(diffs[1]!.uiDelta).toBe('5.000000')
  })

  it('resolves on-chain addresses from transaction account keys', () => {
    const diffs = computeTokenDiffs(tokenTx as unknown as VersionedTransactionResponse)
    expect(diffs[0]!.address).toBe('SndTokenAcc1111111111111111111111111111111111')
    expect(diffs[1]!.address).toBe('RcvTokenAcc1111111111111111111111111111111111')
  })

  it('populates mint and decimals correctly', () => {
    const diffs = computeTokenDiffs(tokenTx as unknown as VersionedTransactionResponse)
    for (const d of diffs) {
      expect(d.mint).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
      expect(d.decimals).toBe(6)
    }
  })

  it('returns empty array when there are no token balances', () => {
    const diffs = computeTokenDiffs(simpleTx as unknown as VersionedTransactionResponse)
    expect(diffs).toEqual([])
  })

  it('uiDelta is "0.000000" for zero delta (no change)', () => {
    const unchangedTx = {
      ...tokenTx,
      meta: {
        ...tokenTx.meta,
        preTokenBalances: tokenTx.meta.postTokenBalances,
        postTokenBalances: tokenTx.meta.postTokenBalances,
      },
    }
    const diffs = computeTokenDiffs(unchangedTx as unknown as VersionedTransactionResponse)
    for (const d of diffs) {
      expect(d.uiDelta).toBe('0.000000')
      expect(d.delta).toBe(0n)
    }
  })
})
