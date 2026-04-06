import { describe, it, expect } from 'vitest'
import { explainError, resolveError } from '../src/index.js'
import type { Connection, VersionedTransactionResponse } from '@solana/web3.js'
import type { Idl } from '@coral-xyz/anchor'
import simpleTx from './fixtures/simple-transfer.json'
import failedTx from './fixtures/failed-anchor.json'
import systemErrTx from './fixtures/failed-system-error.json'
import driftTx from './fixtures/failed-drift.json'
import { buildCpiTree } from '../src/cpi.js'
import { extractAccountDiffs } from '../src/diff.js'
import { parseCuUsage } from '../src/compute.js'
import type { LyktaTransaction } from '../src/types.js'

const mockConnection = {} as Connection

// failedTx uses myProgram… at programIdIndex 2; swap in a known Token program for SPL error tests
const SPL_TOKEN_PROGRAM      = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const SPL_TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'

function makeSplTx(customCode: number, programId = SPL_TOKEN_PROGRAM) {
  return {
    ...failedTx,
    transaction: {
      ...failedTx.transaction,
      message: {
        ...failedTx.transaction.message,
        accountKeys: [
          ...failedTx.transaction.message.accountKeys.slice(0, 2),
          programId,
        ],
      },
    },
    meta: { ...failedTx.meta, err: { InstructionError: [0, { Custom: customCode }] } },
  }
}

function makeLyktaTx(rawFixture: unknown, success: boolean): LyktaTransaction {
  const raw = rawFixture as VersionedTransactionResponse
  return {
    signature: 'test',
    slot: raw.slot,
    blockTime: raw.blockTime ?? null,
    success,
    fee: raw.meta?.fee ?? 0,
    cpiTree: buildCpiTree(raw),
    decodedInstructions: [],
    accountDiffs: [],
    tokenDiffs: [],
    cuUsage: parseCuUsage(raw),
    totalCu: 0,
    raw,
  }
}

const DRIFT_PROGRAM_ID = 'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH'

// Minimal synthetic IDL for Drift — only the errors array is needed for these tests
const driftIdlMap = new Map<string, Idl | null>([
  [DRIFT_PROGRAM_ID, {
    address: DRIFT_PROGRAM_ID,
    metadata: { name: 'drift', version: '2.0.0', spec: '0.1.0' },
    instructions: [],
    errors: [
      { code: 6000, name: 'InvalidBidPrice', msg: 'Invalid bid price' },
      { code: 6001, name: 'InvalidAskPrice', msg: 'Invalid ask price' },
    ],
  } as unknown as Idl],
])

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

  it('AC1 — resolves IDL error name from idlMap (Drift 6000 = InvalidBidPrice)', async () => {
    const tx = makeLyktaTx(driftTx, false)
    const error = await explainError(tx, mockConnection, driftIdlMap)

    expect(error).toBeDefined()
    expect(error!.code).toBe(6000)
    expect(error!.programId).toBe(DRIFT_PROGRAM_ID)
    expect(error!.name).toBe('InvalidBidPrice')
    expect(error!.message).toBe('Invalid bid price')
    // IDL resolved the name → Claude must not be called regardless of env
    expect(error!.suggestion).toBeUndefined()
  })

  it('AC3 — returns defined error without throwing when no idlMap and no API key', async () => {
    const tx = makeLyktaTx(driftTx, false)
    // Pass '' explicitly so process.env.ANTHROPIC_API_KEY is not picked up if set
    const error = await explainError(tx, mockConnection, undefined, '')

    expect(error).toBeDefined()
    expect(error!.code).toBe(6000)
    expect(error!.name).toBeUndefined()
    expect(error!.suggestion).toBeUndefined()
  })

  it('falls through to generic message when idlMap has no entry for the program', async () => {
    const tx = makeLyktaTx(driftTx, false)
    const emptyMap = new Map<string, Idl | null>()
    // Pass '' so the env var is not used — keeps the test deterministic
    const error = await explainError(tx, mockConnection, emptyMap, '')

    expect(error!.name).toBeUndefined()
    expect(error!.message).toContain('Transaction failed')
  })

  // AC2 — requires a live API key; skipped locally until ANTHROPIC_API_KEY is set
  it.skipIf(!process.env.ANTHROPIC_API_KEY)(
    'AC2 — returns a non-empty 2-sentence suggestion via Claude when API key is set',
    async () => {
      const tx = makeLyktaTx(driftTx, false)
      // No idlMap — forces Claude to be the only resolution path
      const error = await explainError(tx, mockConnection, undefined, process.env.ANTHROPIC_API_KEY)

      expect(error).toBeDefined()
      expect(typeof error!.suggestion).toBe('string')
      expect(error!.suggestion!.length).toBeGreaterThan(0)
    },
    15_000, // generous timeout for the API round-trip
  )
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

  it('transaction-level — resolves InsufficientFundsForFee (not wrapped in InstructionError)', () => {
    const tx = {
      ...failedTx,
      meta: { ...failedTx.meta, err: 'InsufficientFundsForFee' },
    }
    const err = resolveError(tx as unknown as VersionedTransactionResponse)
    expect(err).toBeDefined()
    expect(err!.code).toBe('InsufficientFundsForFee')
    expect(err!.name).toBe('InsufficientFundsForFee')
    expect(err!.message).toContain('fee')
  })

  it('transaction-level — resolves BlockhashNotFound with a human-readable message', () => {
    const tx = {
      ...failedTx,
      meta: { ...failedTx.meta, err: 'BlockhashNotFound' },
    }
    const err = resolveError(tx as unknown as VersionedTransactionResponse)
    expect(err!.message).toContain('expired')
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

  it('tier 1 — resolves MissingRequiredSignature from failed-system-error fixture directly', () => {
    // Uses the fixture as-is (err = { InstructionError: [0, "MissingRequiredSignature"] })
    // and confirms programId is extracted from the System Program at index 2
    const err = resolveError(systemErrTx as unknown as VersionedTransactionResponse)
    expect(err).toBeDefined()
    expect(err!.code).toBe('MissingRequiredSignature')
    expect(err!.programId).toBe('11111111111111111111111111111111')
    expect(err!.message).toContain('Missing required signature')
  })

  it('tier 3b — resolves SPL Token error code 1 (InsufficientFunds) for Token program', () => {
    const err = resolveError(makeSplTx(1) as unknown as VersionedTransactionResponse)
    expect(err).toBeDefined()
    expect(err!.code).toBe(1)
    expect(err!.programId).toBe(SPL_TOKEN_PROGRAM)
    expect(err!.name).toContain('InsufficientFunds')
  })

  it('tier 3b — resolves SPL Token error code 17 (AccountFrozen) for Token program', () => {
    const err = resolveError(makeSplTx(17) as unknown as VersionedTransactionResponse)
    expect(err!.name).toContain('AccountFrozen')
  })

  it('tier 3b — resolves SPL Token error code 1 for Token-2022 program', () => {
    const err = resolveError(makeSplTx(1, SPL_TOKEN_2022_PROGRAM) as unknown as VersionedTransactionResponse)
    expect(err!.programId).toBe(SPL_TOKEN_2022_PROGRAM)
    expect(err!.name).toContain('InsufficientFunds')
  })

  it('tier 3b — does NOT apply SPL Token errors to an unknown custom program', () => {
    // myProgram… with Custom: 1 should fall through to the hex fallback, not "InsufficientFunds"
    const unknownProgTx = {
      ...failedTx,
      meta: { ...failedTx.meta, err: { InstructionError: [0, { Custom: 1 }] } },
    }
    const err = resolveError(unknownProgTx as unknown as VersionedTransactionResponse)
    expect(err!.name).toBeUndefined()
    expect(err!.message).toMatch(/0x1/i)
  })

  it('tier 3a — resolves System Program AccountAlreadyInUse (custom code 0)', () => {
    // systemErrTx has the System Program at programIdIndex 2 — so programId resolves correctly
    const tx = {
      ...systemErrTx,
      meta: { ...systemErrTx.meta, err: { InstructionError: [0, { Custom: 0 }] } },
    }
    const err = resolveError(tx as unknown as VersionedTransactionResponse)
    expect(err).toBeDefined()
    expect(err!.programId).toBe('11111111111111111111111111111111')
    expect(err!.name).toContain('AccountAlreadyInUse')
    expect(err!.message).toContain('already in use')
  })

  it('tier 3a — resolves System Program ResultWithNegativeLamports (custom code 1)', () => {
    const tx = {
      ...systemErrTx,
      meta: { ...systemErrTx.meta, err: { InstructionError: [0, { Custom: 1 }] } },
    }
    const err = resolveError(tx as unknown as VersionedTransactionResponse)
    expect(err!.name).toContain('ResultWithNegativeLamports')
  })

  it('falls back gracefully for an unknown custom error code — AC3', () => {
    // Acceptance criteria: no map entry → name is absent, message is hex, no throw
    const unknownTx = {
      ...failedTx,
      meta: { ...failedTx.meta, err: { InstructionError: [0, { Custom: 9999 }] } },
    }
    const err = resolveError(unknownTx as unknown as VersionedTransactionResponse)
    expect(err).toBeDefined()
    expect(err!.code).toBe(9999)
    expect(err!.name).toBeUndefined()
    expect(err!.message).toMatch(/0x270F/i)
  })
})
