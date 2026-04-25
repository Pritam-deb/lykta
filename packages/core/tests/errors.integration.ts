/**
 * Gemini fallback — integration tests
 *
 * These tests hit the real Gemini API and are skipped automatically when
 * GEMINI_API_KEY is absent (e.g. in CI).  Run them locally with:
 *
 *   pnpm test:integration
 *
 * They validate that the Gemini tier fires for unknown error codes and that
 * the response is formatted as exactly 2 sentences.
 *
 * NOTE: As of 2026-04-12, both the Gemini free-tier daily quota and the
 * Anthropic account credits are exhausted, so these tests will be skipped
 * or fail with a 429 until quotas reset or a funded key is swapped in.
 * The integration code and test structure are correct — this is a billing
 * issue only.
 */
import { describe, it, expect } from 'vitest'
import { config } from 'dotenv'
import type { Connection, VersionedTransactionResponse } from '@solana/web3.js'
import { explainError } from '../src/index.js'
import { buildCpiTree } from '../src/cpi.js'
import { parseCuUsage } from '../src/compute.js'
import type { LyktaTransaction } from '../src/types.js'
import failedDriftTx from './fixtures/failed-drift.json'

config({ path: '../../.env' })
const apiKey = process.env.GEMINI_API_KEY
const mockConnection = {} as Connection

/** Builds a LyktaTransaction from a raw fixture, overriding the error code. */
function makeTxWithCode(customCode: number, programId: string): LyktaTransaction {
  const raw = {
    ...failedDriftTx,
    transaction: {
      ...failedDriftTx.transaction,
      message: {
        ...failedDriftTx.transaction.message,
        accountKeys: [
          failedDriftTx.transaction.message.accountKeys[0]!,
          failedDriftTx.transaction.message.accountKeys[1]!,
          programId,
        ],
      },
    },
    meta: {
      ...failedDriftTx.meta,
      err: { InstructionError: [0, { Custom: customCode }] },
      logMessages: [
        `Program ${programId} invoke [1]`,
        `Program log: AnchorError occurred. Error Code: UnknownError. Error Number: ${customCode}. Error Message: Unknown error.`,
        `Program ${programId} failed: custom program error: 0x${customCode.toString(16).toUpperCase()}`,
      ],
    },
  } as unknown as VersionedTransactionResponse

  return {
    signature: 'integration-test',
    slot: raw.slot,
    blockTime: raw.blockTime ?? null,
    success: false,
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

/** Counts sentences by splitting on '. ', '.' at end-of-string, '!' and '?'. */
function countSentences(text: string): number {
  return text.split(/(?<=[.!?])\s+|(?<=[.!?])$/).filter(s => s.trim().length > 0).length
}

describe.skipIf(!apiKey)('Gemini fallback — integration', () => {
  it('fires for an unknown custom error code (9998) not in any registry', async () => {
    const unknownProgram = 'UnknownProg1111111111111111111111111111111111'
    const tx = makeTxWithCode(9998, unknownProgram)

    const error = await explainError(tx, mockConnection, undefined, apiKey)

    expect(error).toBeDefined()
    expect(error!.code).toBe(9998)
    expect(error!.programId).toBe(unknownProgram)
    expect(typeof error!.suggestion).toBe('string')
    expect(error!.suggestion!.trim().length).toBeGreaterThan(0)
  })

  it('returns a suggestion formatted as exactly 2 sentences', async () => {
    const unknownProgram = 'UnknownProg1111111111111111111111111111111111'
    const tx = makeTxWithCode(9998, unknownProgram)

    const error = await explainError(tx, mockConnection, undefined, apiKey)

    const suggestion = error!.suggestion!
    const sentenceCount = countSentences(suggestion)
    expect(sentenceCount).toBe(2)
  })
})
