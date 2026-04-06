import { describe, it, expect, vi } from 'vitest'
import type { Connection, VersionedTransactionResponse } from '@solana/web3.js'
import { decodeTransactionFromRaw } from '../src/transaction.js'

// ── Mock connection ───────────────────────────────────────────────────────────
// getAccountInfo returns null → no on-chain IDL found → all instructions unmatched
// getAddressLookupTable returns { value: null } → ALT slots fall back to PublicKey.default

const mockConnection = {
  getAccountInfo: vi.fn().mockResolvedValue(null),
  getAddressLookupTable: vi.fn().mockResolvedValue({ value: null }),
} as unknown as Connection

// ── Fixtures ──────────────────────────────────────────────────────────────────

import simpleTx from './fixtures/simple-transfer.json'
import tokenTx from './fixtures/token-transfer.json'
import failedAnchorTx from './fixtures/failed-anchor.json'
import v0AltSwapTx from './fixtures/v0-alt-swap.json'
import anchorDecodeTx from './fixtures/anchor-decode.json'
import truncatedTx from './fixtures/truncated-logs.json'
import cuExceededTx from './fixtures/compute-budget-exceeded.json'
import multiTx from './fixtures/multi-instruction.json'
import failedSysTx from './fixtures/failed-system-error.json'
import cpiNestedTx from './fixtures/cpi-nested.json'
import failedDriftTx from './fixtures/failed-drift.json'

function raw(fixture: unknown): VersionedTransactionResponse {
  return fixture as VersionedTransactionResponse
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('simple-transfer', () => {
  it('decodes successfully', async () => {
    const tx = await decodeTransactionFromRaw(raw(simpleTx), mockConnection)

    expect(tx.success).toBe(true)
    expect(tx.signature).toBe('5KtP4R8dg1a7HmcP5Q9wJtMWwVBwmhHsDQdqNP7PbmEm')
    expect(tx.slot).toBe(123456789)
    expect(tx.fee).toBe(5000)
    expect(tx.error).toBeUndefined()
  })

  it('builds a single-node CPI tree for the System Program', async () => {
    const tx = await decodeTransactionFromRaw(raw(simpleTx), mockConnection)

    expect(tx.cpiTree).toHaveLength(1)
    expect(tx.cpiTree[0]!.programId).toBe('11111111111111111111111111111111')
    expect(tx.cpiTree[0]!.depth).toBe(0)
    expect(tx.cpiTree[0]!.children).toHaveLength(0)
  })

  it('extracts compute units', async () => {
    const tx = await decodeTransactionFromRaw(raw(simpleTx), mockConnection)

    expect(tx.cuUsage).toHaveLength(1)
    expect(tx.cuUsage[0]!.consumed).toBe(150)
    expect(tx.cuUsage[0]!.limit).toBe(200000)
    expect(tx.cuUsage[0]!.isOverBudget).toBeFalsy()
    expect(tx.totalCu).toBe(150)
  })

  it('returns empty token diffs for a lamport-only transfer', async () => {
    const tx = await decodeTransactionFromRaw(raw(simpleTx), mockConnection)
    expect(tx.tokenDiffs).toHaveLength(0)
  })

  it('returns one unmatched decoded instruction (no IDL)', async () => {
    const tx = await decodeTransactionFromRaw(raw(simpleTx), mockConnection)
    expect(tx.decodedInstructions).toHaveLength(1)
    expect(tx.decodedInstructions[0]!.matched).toBe(false)
    expect(tx.decodedInstructions[0]!.name).toBeNull()
  })

  it('computes lamport account diffs', async () => {
    const tx = await decodeTransactionFromRaw(raw(simpleTx), mockConnection)
    // Payer: 1_000_000_000 → 999_495_000 = -505_000
    const payer = tx.accountDiffs.find((d) => d.address === '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
    expect(payer).toBeDefined()
    expect(payer!.lamports.delta).toBe(-505000)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('token-transfer', () => {
  it('decodes successfully', async () => {
    const tx = await decodeTransactionFromRaw(raw(tokenTx), mockConnection)
    expect(tx.success).toBe(true)
    expect(tx.error).toBeUndefined()
  })

  it('builds a single-node CPI tree for the SPL Token program', async () => {
    const tx = await decodeTransactionFromRaw(raw(tokenTx), mockConnection)
    expect(tx.cpiTree).toHaveLength(1)
    expect(tx.cpiTree[0]!.programId).toBe('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
  })

  it('computes two BigInt token diffs for USDC sender and receiver', async () => {
    const tx = await decodeTransactionFromRaw(raw(tokenTx), mockConnection)

    expect(tx.tokenDiffs).toHaveLength(2)

    const sender = tx.tokenDiffs.find((d) => d.accountIndex === 1)
    expect(sender).toBeDefined()
    expect(sender!.delta).toBe(-5_000_000n)
    expect(sender!.mint).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')

    const receiver = tx.tokenDiffs.find((d) => d.accountIndex === 2)
    expect(receiver).toBeDefined()
    expect(receiver!.delta).toBe(5_000_000n)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('failed-anchor', () => {
  it('marks success=false', async () => {
    const tx = await decodeTransactionFromRaw(raw(failedAnchorTx), mockConnection)
    expect(tx.success).toBe(false)
  })

  it('resolves the Anchor ConstraintMut error (code 2000)', async () => {
    const tx = await decodeTransactionFromRaw(raw(failedAnchorTx), mockConnection)

    expect(tx.error).toBeDefined()
    expect(tx.error!.code).toBe(2000)
    expect(tx.error!.name).toContain('ConstraintMut')
    expect(tx.error!.message).toContain('mut constraint')
  })

  it('identifies the failing program', async () => {
    const tx = await decodeTransactionFromRaw(raw(failedAnchorTx), mockConnection)
    expect(tx.error!.programId).toBe('myProgram11111111111111111111111111111111111')
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('v0-alt-swap', () => {
  it('decodes a v0 transaction successfully', async () => {
    const tx = await decodeTransactionFromRaw(raw(v0AltSwapTx), mockConnection)
    expect(tx.success).toBe(true)
    expect(tx.error).toBeUndefined()
  })

  it('builds a two-node CPI tree (ComputeBudget + Jupiter)', async () => {
    const tx = await decodeTransactionFromRaw(raw(v0AltSwapTx), mockConnection)

    expect(tx.cpiTree).toHaveLength(2)
    expect(tx.cpiTree[0]!.programId).toBe('ComputeBudget111111111111111111111111111111')
    expect(tx.cpiTree[1]!.programId).toBe('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4')
  })

  it('attaches one inner instruction (Token CPI) to the Jupiter node', async () => {
    const tx = await decodeTransactionFromRaw(raw(v0AltSwapTx), mockConnection)
    expect(tx.cpiTree[1]!.children).toHaveLength(1)
  })

  it('emits two decoded instructions (one per top-level node + child)', async () => {
    const tx = await decodeTransactionFromRaw(raw(v0AltSwapTx), mockConnection)
    // CB (no children) + JUP + 1 child = 3
    expect(tx.decodedInstructions).toHaveLength(3)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('anchor-decode', () => {
  it('decodes successfully', async () => {
    const tx = await decodeTransactionFromRaw(raw(anchorDecodeTx), mockConnection)
    expect(tx.success).toBe(true)
    expect(tx.error).toBeUndefined()
  })

  it('exposes the Anchor deposit discriminator hex without an IDL', async () => {
    const tx = await decodeTransactionFromRaw(raw(anchorDecodeTx), mockConnection)

    expect(tx.decodedInstructions).toHaveLength(1)
    expect(tx.decodedInstructions[0]!.discriminatorHex).toBe('f223c68952e1f2b6')
    // No IDL is available → matched=false
    expect(tx.decodedInstructions[0]!.matched).toBe(false)
    expect(tx.decodedInstructions[0]!.name).toBeNull()
  })

  it('extracts CU usage for the Anchor program', async () => {
    const tx = await decodeTransactionFromRaw(raw(anchorDecodeTx), mockConnection)
    expect(tx.cuUsage).toHaveLength(1)
    expect(tx.cuUsage[0]!.consumed).toBe(8200)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('truncated-logs', () => {
  it('decodes successfully (truncated logs ≠ failed tx)', async () => {
    const tx = await decodeTransactionFromRaw(raw(truncatedTx), mockConnection)
    expect(tx.success).toBe(true)
    expect(tx.error).toBeUndefined()
  })

  it('builds a two-node CPI tree from innerInstructions', async () => {
    const tx = await decodeTransactionFromRaw(raw(truncatedTx), mockConnection)
    expect(tx.cpiTree).toHaveLength(2)
    // ComputeBudget node
    expect(tx.cpiTree[0]!.programId).toBe('ComputeBudget111111111111111111111111111111')
    // Jupiter node with 1 inner instruction from innerInstructions block
    expect(tx.cpiTree[1]!.children).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('compute-budget-exceeded', () => {
  it('marks success=false', async () => {
    const tx = await decodeTransactionFromRaw(raw(cuExceededTx), mockConnection)
    expect(tx.success).toBe(false)
  })

  it('resolves a tier-1 ComputationalBudgetExceeded error', async () => {
    const tx = await decodeTransactionFromRaw(raw(cuExceededTx), mockConnection)

    expect(tx.error).toBeDefined()
    expect(tx.error!.code).toBe('ComputationalBudgetExceeded')
    expect(tx.error!.name).toBe('ComputationalBudgetExceeded')
  })

  it('marks the frame as over budget (consumed === limit)', async () => {
    const tx = await decodeTransactionFromRaw(raw(cuExceededTx), mockConnection)

    expect(tx.cuUsage).toHaveLength(1)
    expect(tx.cuUsage[0]!.consumed).toBe(200000)
    expect(tx.cuUsage[0]!.limit).toBe(200000)
    expect(tx.cuUsage[0]!.isOverBudget).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('multi-instruction', () => {
  it('decodes successfully', async () => {
    const tx = await decodeTransactionFromRaw(raw(multiTx), mockConnection)
    expect(tx.success).toBe(true)
    expect(tx.error).toBeUndefined()
  })

  it('builds a two-node CPI tree (ComputeBudget + SPL Token)', async () => {
    const tx = await decodeTransactionFromRaw(raw(multiTx), mockConnection)
    expect(tx.cpiTree).toHaveLength(2)
  })

  it('extracts exactly one CU frame (CB emits no consumed line)', async () => {
    const tx = await decodeTransactionFromRaw(raw(multiTx), mockConnection)
    expect(tx.cuUsage).toHaveLength(1)
    expect(tx.cuUsage[0]!.programId).toBe('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
  })

  it('computes two token diffs for the USDC transfer', async () => {
    const tx = await decodeTransactionFromRaw(raw(multiTx), mockConnection)
    expect(tx.tokenDiffs).toHaveLength(2)

    const sender = tx.tokenDiffs.find((d) => d.accountIndex === 1)
    expect(sender!.delta).toBe(-10_000_000n)

    const receiver = tx.tokenDiffs.find((d) => d.accountIndex === 2)
    expect(receiver!.delta).toBe(10_000_000n)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('failed-system-error', () => {
  it('marks success=false', async () => {
    const tx = await decodeTransactionFromRaw(raw(failedSysTx), mockConnection)
    expect(tx.success).toBe(false)
  })

  it('resolves a tier-1 MissingRequiredSignature system error', async () => {
    const tx = await decodeTransactionFromRaw(raw(failedSysTx), mockConnection)

    expect(tx.error).toBeDefined()
    expect(tx.error!.code).toBe('MissingRequiredSignature')
    expect(tx.error!.name).toBe('MissingRequiredSignature')
    expect(tx.error!.message).toContain('Missing required signature')
  })

  it('identifies the System Program as the failing program', async () => {
    const tx = await decodeTransactionFromRaw(raw(failedSysTx), mockConnection)
    expect(tx.error!.programId).toBe('11111111111111111111111111111111')
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('failed-drift (AC3 — unknown custom code fallback)', () => {
  it('marks success=false', async () => {
    const tx = await decodeTransactionFromRaw(raw(failedDriftTx), mockConnection)
    expect(tx.success).toBe(false)
  })

  it('populates error with code 6000 and hex fallback message (no IDL available)', async () => {
    const tx = await decodeTransactionFromRaw(raw(failedDriftTx), mockConnection)

    expect(tx.error).toBeDefined()
    expect(tx.error!.code).toBe(6000)
    expect(tx.error!.programId).toBe('dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH')
    expect(tx.error!.name).toBeUndefined()
    expect(tx.error!.message).toMatch(/0x1770/i)
  })

  it('still populates cuUsage from the Drift instruction logs', async () => {
    const tx = await decodeTransactionFromRaw(raw(failedDriftTx), mockConnection)

    expect(tx.cuUsage).toHaveLength(1)
    expect(tx.cuUsage[0]!.consumed).toBe(8000)
    expect(tx.cuUsage[0]!.limit).toBe(200000)
    expect(tx.cuUsage[0]!.isOverBudget).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('cpi-nested', () => {
  it('decodes successfully', async () => {
    const tx = await decodeTransactionFromRaw(raw(cpiNestedTx), mockConnection)
    expect(tx.success).toBe(true)
    expect(tx.error).toBeUndefined()
  })

  it('builds a two-node top-level CPI tree', async () => {
    const tx = await decodeTransactionFromRaw(raw(cpiNestedTx), mockConnection)
    expect(tx.cpiTree).toHaveLength(2)
    expect(tx.cpiTree[0]!.programId).toBe('ComputeBudget111111111111111111111111111111')
    expect(tx.cpiTree[1]!.programId).toBe('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4')
  })

  it('attaches 5 inner instructions to the Jupiter node', async () => {
    const tx = await decodeTransactionFromRaw(raw(cpiNestedTx), mockConnection)
    expect(tx.cpiTree[1]!.children).toHaveLength(5)
  })

  it('emits 7 decoded instructions in tree-traversal order', async () => {
    const tx = await decodeTransactionFromRaw(raw(cpiNestedTx), mockConnection)
    // CB (1) + JUP (1) + 5 children = 7
    expect(tx.decodedInstructions).toHaveLength(7)
  })

  it('annotates the Jupiter node with its known program name', async () => {
    const tx = await decodeTransactionFromRaw(raw(cpiNestedTx), mockConnection)
    const jupNode = tx.cpiTree[1]!
    expect(jupNode.programName).toBe('Jupiter Aggregator v6')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC1 / AC2 — explicit joint assertions per Day-4 acceptance criteria

describe('AC1 — successful tx: error absent, cuUsage populated', () => {
  it('simple-transfer has no error and at least one cuUsage entry', async () => {
    const tx = await decodeTransactionFromRaw(raw(simpleTx), mockConnection)

    expect(tx.success).toBe(true)
    expect(tx.error).toBeUndefined()
    expect(tx.cuUsage.length).toBeGreaterThan(0)
    expect(tx.totalCu).toBeGreaterThan(0)
  })
})

describe('AC2 — failed tx: error resolved and cuUsage still populated', () => {
  it('failed-anchor has a resolved error and a non-empty cuUsage', async () => {
    const tx = await decodeTransactionFromRaw(raw(failedAnchorTx), mockConnection)

    expect(tx.success).toBe(false)
    expect(tx.error).toBeDefined()
    expect(tx.error!.name).toContain('ConstraintMut')
    expect(tx.cuUsage.length).toBeGreaterThan(0)
  })
})
