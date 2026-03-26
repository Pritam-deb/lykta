import { describe, it, expect } from 'vitest'
import { explainError } from '../src/errors.js'
import type { Connection, VersionedTransactionResponse } from '@solana/web3.js'
import simpleTx from './fixtures/simple-transfer.json'
import failedTx from './fixtures/failed-anchor.json'
import { buildCpiTree } from '../src/cpi.js'
import { extractAccountDiffs } from '../src/diff.js'
import { parseCuUsage } from '../src/compute.js'
import type { SolScopeTransaction } from '../src/types.js'

const mockConnection = {} as Connection

function makeSolScopeTx(rawFixture: unknown, success: boolean): SolScopeTransaction {
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
    const tx = makeSolScopeTx(simpleTx, true)
    const error = await explainError(tx, mockConnection)
    expect(error).toBeUndefined()
  })

  it('decodes a known Anchor error code (2000 = ConstraintMut)', async () => {
    const tx = makeSolScopeTx(failedTx, false)
    const error = await explainError(tx, mockConnection)

    expect(error).toBeDefined()
    expect(error!.code).toBe(2000)
    expect(error!.name).toContain('ConstraintMut')
    expect(error!.message).toContain('mut constraint')
  })

  it('identifies the program that failed', async () => {
    const tx = makeSolScopeTx(failedTx, false)
    const error = await explainError(tx, mockConnection)

    expect(error!.programId).toBe('myProgram11111111111111111111111111111111111')
  })
})
