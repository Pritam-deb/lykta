import { describe, it, expect } from 'vitest'
import { parseCuUsage, extractComputeUnits } from '../src/index.js'
import type { VersionedTransactionResponse } from '@solana/web3.js'
import simpleTx from './fixtures/simple-transfer.json'
import failedTx from './fixtures/failed-anchor.json'
import jupiterSwapLogs from './fixtures/logs-jupiter-swap.json'

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

// ── extractComputeUnits ───────────────────────────────────────────────────────

describe('extractComputeUnits', () => {
  it('returns only top-level (depth-1) frames — skips nested CPIs', () => {
    // Jupiter logs have Token(depth2) + Orca(depth2) + Token(depth2) nested inside
    // Only ComputeBudget[no consumed] and Jupiter should appear.
    // ComputeBudget has no consumed line, so only Jupiter is emitted.
    const tx = {
      ...simpleTx,
      meta: { ...simpleTx.meta, logMessages: jupiterSwapLogs.logMessages },
    }
    const usage = extractComputeUnits(tx as unknown as VersionedTransactionResponse)
    expect(usage).toHaveLength(1)
    expect(usage[0]!.programId).toBe('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4')
    expect(usage[0]!.consumed).toBe(144_000)
    expect(usage[0]!.limit).toBe(1_200_000)
  })

  it('computes percentUsed correctly for the top-level frame', () => {
    const tx = {
      ...simpleTx,
      meta: { ...simpleTx.meta, logMessages: jupiterSwapLogs.logMessages },
    }
    const usage = extractComputeUnits(tx as unknown as VersionedTransactionResponse)
    // 144000 / 1200000 * 100 = 12%
    expect(usage[0]!.percentUsed).toBe(12)
  })

  it('sets isOverBudget=false when consumed < limit', () => {
    const usage = extractComputeUnits(simpleTx as unknown as VersionedTransactionResponse)
    expect(usage[0]!.isOverBudget).toBe(false)
  })

  it('sets isOverBudget=true when consumed equals limit', () => {
    const atLimitTx = {
      ...simpleTx,
      meta: {
        ...simpleTx.meta,
        logMessages: [
          'Program MyProg1111111111111111111111111111111111111 invoke [1]',
          'Program MyProg1111111111111111111111111111111111111 consumed 200000 of 200000 compute units',
          'Program MyProg1111111111111111111111111111111111111 success',
        ],
      },
    }
    const usage = extractComputeUnits(atLimitTx as unknown as VersionedTransactionResponse)
    expect(usage[0]!.isOverBudget).toBe(true)
  })

  it('handles multiple sequential top-level instructions', () => {
    const multiTx = {
      ...simpleTx,
      meta: {
        ...simpleTx.meta,
        logMessages: [
          'Program AAA1111111111111111111111111111111111111111 invoke [1]',
          'Program AAA1111111111111111111111111111111111111111 consumed 1000 of 50000 compute units',
          'Program AAA1111111111111111111111111111111111111111 success',
          'Program BBB1111111111111111111111111111111111111111 invoke [1]',
          'Program BBB1111111111111111111111111111111111111111 consumed 40000 of 49000 compute units',
          'Program BBB1111111111111111111111111111111111111111 failed: custom program error: 0x1',
        ],
      },
    }
    const usage = extractComputeUnits(multiTx as unknown as VersionedTransactionResponse)
    expect(usage).toHaveLength(2)
    expect(usage[0]!.instructionIndex).toBe(0)
    expect(usage[1]!.instructionIndex).toBe(1)
    expect(usage[1]!.isOverBudget).toBe(false) // 40000 < 49000
  })

  it('does not include nested CPI consumed lines in parseCuUsage comparison', () => {
    const tx = {
      ...simpleTx,
      meta: { ...simpleTx.meta, logMessages: jupiterSwapLogs.logMessages },
    }
    const all = parseCuUsage(tx as unknown as VersionedTransactionResponse)
    const topOnly = extractComputeUnits(tx as unknown as VersionedTransactionResponse)
    // parseCuUsage picks up Token(x3) + Orca + Jupiter = 5 entries
    // extractComputeUnits should only have Jupiter = 1
    expect(all.length).toBeGreaterThan(topOnly.length)
    expect(topOnly).toHaveLength(1)
  })
})
