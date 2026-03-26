import { describe, it, expect, vi } from 'vitest'
import { extractAccountDiffs } from '../src/diff.js'
import type { Connection, VersionedTransactionResponse } from '@solana/web3.js'
import simpleTx from './fixtures/simple-transfer.json'

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
