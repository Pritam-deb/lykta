import type { TransactionResponse } from '@solana/web3.js'
import type { CuUsage } from './types.js'

// Matches: "Program <id> consumed <X> of <Y> compute units"
const CU_CONSUMED_RE = /Program (\S+) consumed (\d+) of (\d+) compute units/

/**
 * Extracts per-instruction compute unit consumption by parsing the transaction log messages.
 * Each top-level program invocation emits a "consumed X of Y compute units" log line.
 */
export function parseCuUsage(tx: TransactionResponse): CuUsage[] {
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
