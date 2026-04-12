import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'

// ── Mock litesvm before importing LyktaProvider ───────────────────────────────
//
// LiteSVM is a native NAPI module. We replace it entirely so the test runner
// never touches the native binary and the failure path is fully controlled.
//
// FailedTransactionMetadata shape (what sendTransaction returns on failure):
//   .err()    — callable, so the "isFailed" check (typeof .err === 'function') triggers
//   .meta()   — returns { logs(): string[], innerInstructions(): [] }
//   .toString() — fallback string for unresolvable failures
//
// TransactionMetadata shape (success):
//   .logs()   — string[] (no .err property)

const PROGRAM_ID = 'MyProgram1111111111111111111111111111111111'

const FAILURE_LOGS = [
  `Program ${PROGRAM_ID} invoke [1]`,
  `Program log: Custom program error: 0x1`,
  `Program ${PROGRAM_ID} failed: custom program error: 0x1`,
]

function makeFailedMeta() {
  return {
    err: () => ({ index: 0, err: () => 1 }),
    meta: () => ({
      logs: () => FAILURE_LOGS,
      innerInstructions: () => [],
      computeUnitsConsumed: () => 0n,
    }),
    toString: () => 'FailedTransactionMetadata',
  }
}

function makeSuccessMeta() {
  return {
    logs: () => ['Program 11111111111111111111111111111111 invoke [1]', 'Program 11111111111111111111111111111111 success'],
    innerInstructions: () => [],
    computeUnitsConsumed: () => 500n,
  }
}

vi.mock('litesvm', () => {
  const mockSendTransaction = vi.fn()
  const MockLiteSVM = vi.fn().mockImplementation(() => ({
    withSysvars: vi.fn().mockReturnThis(),
    withBuiltins: vi.fn().mockReturnThis(),
    withDefaultPrograms: vi.fn().mockReturnThis(),
    addProgram: vi.fn(),
    airdrop: vi.fn(),
    getBalance: vi.fn().mockReturnValue(0n),
    getClock: vi.fn().mockReturnValue({ slot: 1n, unixTimestamp: 0n }),
    sendTransaction: mockSendTransaction,
  }))
  return { LiteSVM: MockLiteSVM, __mockSendTransaction: mockSendTransaction }
})

import { LyktaProvider } from '../src/provider.js'

// Reach into the module to get the shared mock function
const { __mockSendTransaction } = await import('litesvm') as unknown as { __mockSendTransaction: ReturnType<typeof vi.fn> }

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Builds a minimal legacy Transaction. signature is null by default — the provider falls back to new Uint8Array(64). */
function makeTx(): Transaction {
  const tx = new Transaction()
  tx.recentBlockhash = '11111111111111111111111111111111'
  tx.feePayer = PublicKey.default
  return tx
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LyktaProvider — failure path', () => {
  let provider: LyktaProvider

  beforeEach(() => {
    provider = new LyktaProvider()
    __mockSendTransaction.mockReturnValue(makeFailedMeta())
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  it('sendAndConfirm() throws on a failed transaction', () => {
    expect(() => provider.sendAndConfirm(makeTx())).toThrow()
  })

  it('thrown message contains the program id and fail reason', () => {
    expect(() => provider.sendAndConfirm(makeTx())).toThrowError(
      /MyProgram1111111111111111111111111111111111/
    )
    expect(() => provider.sendAndConfirm(makeTx())).toThrowError(
      /custom program error/i
    )
  })

  it('getResult() returns the structured failure summary after throw', () => {
    const tx = makeTx()
    expect(() => provider.sendAndConfirm(tx)).toThrow()

    // Encode the zeroed signature to base58 the same way the provider does
    const sig = provider['results'].keys().next().value as string
    const result = provider.getResult(sig)

    expect(result).toBeDefined()
    expect(result!.success).toBe(false)
    expect(result!.errorSummary).toContain(PROGRAM_ID.slice(0, 8))
  })
})

describe('LyktaProvider — success path', () => {
  let provider: LyktaProvider

  beforeEach(() => {
    provider = new LyktaProvider()
    __mockSendTransaction.mockReturnValue(makeSuccessMeta())
  })

  it('sendAndConfirm() returns a base58 signature string', () => {
    const sig = provider.sendAndConfirm(makeTx())
    expect(typeof sig).toBe('string')
    expect(sig.length).toBeGreaterThan(0)
  })

  it('getResult() returns success: true for the returned signature', () => {
    const sig = provider.sendAndConfirm(makeTx())
    const result = provider.getResult(sig)

    expect(result).toBeDefined()
    expect(result!.success).toBe(true)
    expect(result!.errorSummary).toBeNull()
  })
})

describe('LyktaProvider — Anchor shim', () => {
  it('asAnchorProvider() exposes connection, wallet, and sendAndConfirm', () => {
    const provider = new LyktaProvider()
    const shim = provider.asAnchorProvider()

    expect(shim).toHaveProperty('connection')
    expect(shim).toHaveProperty('wallet')
    expect(shim).toHaveProperty('sendAndConfirm')
    expect(typeof shim.sendAndConfirm).toBe('function')
  })

  it('wallet.publicKey is a PublicKey instance', () => {
    const provider = new LyktaProvider()
    expect(provider.wallet.publicKey).toBeInstanceOf(PublicKey)
  })
})
