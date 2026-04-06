/**
 * AC3 integration test — exercises the full decodeTransactionFromRaw pipeline
 * using a fixture-injected failed transaction so no live RPC is required.
 *
 * Confirms that all output fields (signature, error, cuUsage, cpiTree,
 * decodedInstructions) are present on the result and no exception is thrown.
 *
 * Run with: pnpm test:integration
 */
import { describe, it, expect, vi } from 'vitest'
import type { Connection } from '@solana/web3.js'
import { decodeTransactionFromRaw } from '../src/transaction.js'
import failedDriftTx from './fixtures/failed-drift.json'

const mockConnection = {
  getAccountInfo: vi.fn().mockResolvedValue(null),
  getAddressLookupTable: vi.fn().mockResolvedValue({ value: null }),
} as unknown as Connection

describe('AC3 — decodeTransactionFromRaw full pipeline (fixture-injected)', () => {
  it('does not throw and returns a complete LyktaTransaction', async () => {
    const tx = await decodeTransactionFromRaw(
      failedDriftTx as Parameters<typeof decodeTransactionFromRaw>[0],
      mockConnection,
    )

    // Top-level shape
    expect(tx.signature).toBeDefined()
    expect(typeof tx.slot).toBe('number')
    expect(tx.success).toBe(false)
    expect(tx.fee).toBeGreaterThanOrEqual(0)

    // Error tier
    expect(tx.error).toBeDefined()
    expect(tx.error!.code).toBe(6000)
    expect(tx.error!.programId).toBe('dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH')
    expect(tx.error!.message).toMatch(/0x1770/i)

    // CU breakdown present even on failure
    expect(Array.isArray(tx.cuUsage)).toBe(true)
    expect(tx.cuUsage.length).toBeGreaterThan(0)
    expect(tx.totalCu).toBeGreaterThan(0)

    // CPI tree and decoded instructions present
    expect(Array.isArray(tx.cpiTree)).toBe(true)
    expect(Array.isArray(tx.decodedInstructions)).toBe(true)
  })
})
