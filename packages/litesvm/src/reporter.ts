import type { LyktaTransaction, LyktaError } from '@lykta/core'

/**
 * Formats a plain-text observability summary for a LiteSVM test result.
 * Printed to stdout on transaction failure so developers immediately see the
 * CPI tree, account diffs, CU usage, and error explanation without leaving
 * their test runner.
 *
 * Example output:
 *
 *   ✗ Transaction failed — slot 234567890
 *   ─────────────────────────────────────
 *   Error: ConstraintMut (code 2000) @ myProgram111…
 *   Message: A mut constraint was violated
 *
 *   CPI Tree:
 *     [0] myProgram111… (deposit)
 *       └─ [1] 11111111… (transfer)
 *
 *   Compute Units: 8000 / 200000 (4%)
 *
 *   Account Diffs:
 *     9WzDXw… Δ lamports: -5000
 */
export function formatSummary(tx: LyktaTransaction, error?: LyktaError): string {
  // TODO (Week 4): implement full summary rendering
  // Sections to build:
  //   1. Header — success/fail, signature, slot
  //   2. Error block — code, name, programId, message, suggestion
  //   3. CPI tree — recursive depth-indented list of programId + instructionName
  //   4. Compute units — consumed / limit (%) per top-level instruction
  //   5. Account diffs — address + lamport delta for changed accounts only
  return [
    `${tx.success ? '✓' : '✗'} Transaction ${tx.signature} — slot ${tx.slot}`,
    error ? `Error: ${error.name ?? error.code} @ ${error.programId}\n  ${error.message}` : '',
    error?.suggestion ? `AI Suggestion: ${error.suggestion}` : '',
  ].filter(Boolean).join('\n')
}
