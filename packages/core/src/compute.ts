import type { VersionedTransactionResponse } from '@solana/web3.js'
import type { CuUsage } from './types.js'

// Matches: "Program <id> consumed <X> of <Y> compute units"
const CU_CONSUMED_RE = /Program (\S+) consumed (\d+) of (\d+) compute units/

// Log patterns used by extractComputeUnits
const INV_RE   = /^Program (\S+) invoke \[(\d+)\]$/
const CLOSE_RE = /^Program \S+ (?:success|failed)/
const CU_RE    = /^Program \S+ consumed (\d+) of (\d+) compute units$/

/**
 * Extracts per-instruction CU consumption for the **top-level** instructions only.
 *
 * Unlike `parseCuUsage`, which picks up every `consumed N of M` line (including
 * nested CPIs), this function uses a stack to track call depth and only emits a
 * `CuUsage` entry when a depth-1 frame (direct child of the transaction) closes.
 *
 * Additional field vs `parseCuUsage`:
 *  - `isOverBudget`: `true` when `consumed >= limit` (instruction hit the ceiling)
 */
export function extractComputeUnits(tx: VersionedTransactionResponse): CuUsage[] {
  const logs = tx.meta?.logMessages ?? []
  const results: CuUsage[] = []
  let instructionIndex = 0

  type Frame = { programId: string; isTopLevel: boolean; consumed?: number; limit?: number }
  const stack: Frame[] = []

  for (const line of logs) {
    const invMatch = INV_RE.exec(line)
    if (invMatch) {
      stack.push({ programId: invMatch[1]!, isTopLevel: invMatch[2] === '1' })
      continue
    }

    const cuMatch = CU_RE.exec(line)
    if (cuMatch && stack.length > 0) {
      const top = stack[stack.length - 1]!
      top.consumed = parseInt(cuMatch[1]!, 10)
      top.limit    = parseInt(cuMatch[2]!, 10)
      continue
    }

    if (CLOSE_RE.test(line) && stack.length > 0) {
      const frame = stack.pop()!
      if (frame.isTopLevel && frame.consumed !== undefined && frame.limit !== undefined) {
        const percentUsed = frame.limit > 0
          ? Math.round((frame.consumed / frame.limit) * 100)
          : 0
        results.push({
          instructionIndex: instructionIndex++,
          programId: frame.programId,
          consumed:  frame.consumed,
          limit:     frame.limit,
          percentUsed,
          isOverBudget: frame.consumed >= frame.limit,
        })
      }
    }
  }

  return results
}

/**
 * Extracts per-instruction compute unit consumption by parsing the transaction log messages.
 * Each top-level program invocation emits a "consumed X of Y compute units" log line.
 */
export function parseCuUsage(tx: VersionedTransactionResponse): CuUsage[] {
  const logs = tx.meta?.logMessages ?? []
  const usage: CuUsage[] = []
  let instructionIndex = 0

  for (const line of logs) {
    const match = CU_CONSUMED_RE.exec(line)
    if (match) {
      const programId = match[1] ?? 'unknown'
      const consumed = parseInt(match[2] ?? '0', 10)
      const limit = parseInt(match[3] ?? '0', 10)
      usage.push({
        instructionIndex: instructionIndex++,
        programId,
        consumed,
        limit,
        percentUsed: limit > 0 ? Math.round((consumed / limit) * 100) : 0,
      })
    }
  }

  return usage
}
