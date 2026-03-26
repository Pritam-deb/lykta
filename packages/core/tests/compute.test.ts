import { describe, it, expect } from 'vitest'
import { parseCuUsage } from '../src/compute.js'
import type { VersionedTransactionResponse } from '@solana/web3.js'
import simpleTx from './fixtures/simple-transfer.json'
import failedTx from './fixtures/failed-anchor.json'

describe('parseCuUsage', () => {
  it('extracts CU usage from log messages', () => {
    const usage = parseCuUsage(simpleTx as unknown as VersionedTransactionResponse)

    expect(usage).toHaveLength(1)
    const cu = usage[0]!
    expect(cu.programId).toBe('11111111111111111111111111111111')
    expect(cu.consumed).toBe(150)
    expect(cu.limit).toBe(200000)
    expect(cu.percentUsed).toBe(0) // Math.round(150/200000 * 100) = 0
  })

  it('returns empty array when no CU logs are present', () => {
    const txNoCuLogs = {
      ...simpleTx,
      meta: { ...simpleTx.meta, logMessages: ['Program log: hello'] },
    }
    const usage = parseCuUsage(txNoCuLogs as unknown as VersionedTransactionResponse)
    expect(usage).toHaveLength(0)
  })

  it('handles multiple instructions', () => {
    const txMulti = {
      ...simpleTx,
      meta: {
        ...simpleTx.meta,
        logMessages: [
          'Program AAA invoke [1]',
          'Program AAA consumed 1000 of 50000 compute units',
          'Program BBB invoke [1]',
          'Program BBB consumed 40000 of 50000 compute units',
        ],
      },
    }
    const usage = parseCuUsage(txMulti as unknown as VersionedTransactionResponse)
    expect(usage).toHaveLength(2)
    expect(usage[0]!.percentUsed).toBe(2)  // 1000/50000
    expect(usage[1]!.percentUsed).toBe(80) // 40000/50000
  })
})
