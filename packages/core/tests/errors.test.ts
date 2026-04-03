import { describe, it, expect } from 'vitest'
import { explainError, resolveError } from '../src/index.js'
import type { Connection, VersionedTransactionResponse } from '@solana/web3.js'
import simpleTx from './fixtures/simple-transfer.json'
import failedTx from './fixtures/failed-anchor.json'
import { buildCpiTree } from '../src/cpi.js'
import { extractAccountDiffs } from '../src/diff.js'
import { parseCuUsage } from '../src/compute.js'
import type { LyktaTransaction } from '../src/types.js'

const mockConnection = {} as Connection

function makeLyktaTx(rawFixture: unknown, success: boolean): LyktaTransaction {
  const raw = rawFixture as VersionedTransactionResponse
  return {
    signature: 'test',
    slot: raw.slot,
    blockTime: raw.blockTime ?? null,
    success,
    fee: raw.meta?.fee ?? 0,
    cpiTree: buildCpiTree(raw),
    accountDiffs: [],
    cuUsage: parseCuUsage(raw),
    totalCu: 0,
    raw,
  }
}

describe('explainError', () => {
  it('returns undefined for successful transactions', async () => {
    const tx = makeLyktaTx(simpleTx, true)
    const error = await explainError(tx, mockConnection)
    expect(error).toBeUndefined()
  })

  it('decodes a known Anchor error code (2000 = ConstraintMut)', async () => {
    const tx = makeLyktaTx(failedTx, false)
    const error = await explainError(tx, mockConnection)

    expect(error).toBeDefined()
    expect(error!.code).toBe(2000)
    expect(error!.name).toContain('ConstraintMut')
    expect(error!.message).toContain('mut constraint')
  })

  it('identifies the program that failed', async () => {
    const tx = makeLyktaTx(failedTx, false)
    const error = await explainError(tx, mockConnection)

    expect(error!.programId).toBe('myProgram11111111111111111111111111111111111')
  })
})

// ── resolveError ──────────────────────────────────────────────────────────────

describe('resolveError', () => {
  it('returns undefined for a successful transaction', () => {
    expect(resolveError(simpleTx as unknown as VersionedTransactionResponse)).toBeUndefined()
  })

  it('resolves Anchor custom error (2000 = ConstraintMut) from failed-anchor fixture', () => {
    const err = resolveError(failedTx as unknown as VersionedTransactionResponse)
    expect(err).toBeDefined()
    expect(err!.code).toBe(2000)
    expect(err!.name).toContain('ConstraintMut')
    expect(err!.message).toContain('mut constraint')
  })

  it('extracts programId from the instruction at the failing index', () => {
    const err = resolveError(failedTx as unknown as VersionedTransactionResponse)
    expect(err!.programId).toBe('myProgram11111111111111111111111111111111111')
  })

  it('tier 1 — resolves a named system/runtime error string', () => {
    const systemErrTx = {
      ...failedTx,
      meta: {
        ...failedTx.meta,
        err: { InstructionError: [0, 'InvalidAccountData'] },
      },
    }
    const err = resolveError(systemErrTx as unknown as VersionedTransactionResponse)
    expect(err).toBeDefined()
    expect(err!.code).toBe('InvalidAccountData')
    expect(err!.name).toBe('InvalidAccountData')
    expect(err!.message).toContain('Invalid account data')
  })

  it('tier 1 — resolves MissingRequiredSignature', () => {
    const tx = {
      ...failedTx,
      meta: { ...failedTx.meta, err: { InstructionError: [0, 'MissingRequiredSignature'] } },
    }
    const err = resolveError(tx as unknown as VersionedTransactionResponse)
    expect(err!.message).toContain('Missing required signature')
  })

  it('tier 3 — resolves SPL Token error code 1 (InsufficientFunds)', () => {
    const splTx = {
      ...failedTx,
      meta: { ...failedTx.meta, err: { InstructionError: [0, { Custom: 1 }] } },
    }
    const err = resolveError(splTx as unknown as VersionedTransactionResponse)
    expect(err).toBeDefined()
    expect(err!.code).toBe(1)
    expect(err!.name).toContain('InsufficientFunds')
  })

  it('tier 3 — resolves SPL Token error code 17 (AccountFrozen)', () => {
    const splTx = {
      ...failedTx,
      meta: { ...failedTx.meta, err: { InstructionError: [0, { Custom: 17 }] } },
    }
    const err = resolveError(splTx as unknown as VersionedTransactionResponse)
    expect(err!.name).toContain('AccountFrozen')
  })

  it('falls back gracefully for an unknown custom error code', () => {
    const unknownTx = {
      ...failedTx,
      meta: { ...failedTx.meta, err: { InstructionError: [0, { Custom: 9999 }] } },
    }
    const err = resolveError(unknownTx as unknown as VersionedTransactionResponse)
    expect(err).toBeDefined()
    expect(err!.code).toBe(9999)
    expect(err!.message).toMatch(/0x270F/i)
  })
})
