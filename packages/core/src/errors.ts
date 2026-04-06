import type { Connection, VersionedTransactionResponse } from '@solana/web3.js'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { LyktaError, LyktaTransaction } from './types.js'
import { SYSTEM_ERRORS, SPL_TOKEN_ERRORS, SPL_TOKEN_PROGRAM_IDS, SYSTEM_PROGRAM_ERRORS, TRANSACTION_ERRORS } from './registry.js'

/** Known Anchor framework error codes → human-readable messages */
const ANCHOR_ERRORS: Record<number, string> = {
  100: 'InstructionMissing: 8 byte instruction identifier not provided',
  101: 'InstructionFallbackNotFound: Fallback functions are not supported',
  102: 'InstructionDidNotDeserialize: The program could not deserialize the given instruction',
  2000: 'ConstraintMut: A mut constraint was violated',
  2001: 'ConstraintHasOne: A has_one constraint was violated',
  2002: 'ConstraintSigner: A signer constraint was violated',
  2003: 'ConstraintRaw: A raw constraint was violated',
  2006: 'ConstraintOwner: An owner constraint was violated',
  2007: 'ConstraintRentExempt: A rent exemption constraint was violated',
  2008: 'ConstraintSeeds: A seeds constraint was violated',
  2012: 'ConstraintAddress: An address constraint was violated',
  3000: 'AccountDiscriminatorAlreadySet: The account discriminator was already set on this account',
  3001: 'AccountDiscriminatorNotFound: No 8-byte discriminator was found on the account',
  3002: 'AccountDiscriminatorMismatch: 8-byte discriminator did not match what was expected',
  3003: 'AccountDidNotDeserialize: Failed to deserialize the account',
  3004: 'AccountDidNotSerialize: Failed to serialize the account',
  3007: 'AccountNotMutable: The given account is not mutable',
  3008: 'AccountOwnedByWrongProgram: The given account is owned by a different program than expected',
}

/**
 * Resolves the error from a failed `VersionedTransactionResponse` without requiring
 * a `LyktaTransaction` wrapper or network calls.
 *
 * Resolution order for `{ InstructionError: [idx, detail] }` errors:
 *  1. **System/runtime errors** — `detail` is a string → look up in `SYSTEM_ERRORS`
 *  2. **Anchor framework errors** — `detail` is `{ Custom: N }` in range 100–3999
 *  3a. **System Program errors** — `programId` is `11111…` → look up in `SYSTEM_PROGRAM_ERRORS`
 *  3b. **SPL Token errors** — `programId` is a known Token program → look up in `SPL_TOKEN_ERRORS`
 *  4. **Unknown custom error** — falls back to `"Custom program error: 0xNNN"`
 *
 * The `programId` is extracted from the instruction at `idx` inside the transaction
 * message, so no additional arguments are needed.
 *
 * A Claude API tier is intentionally omitted here — it will be wired up in Week 3.
 */
export function resolveError(tx: VersionedTransactionResponse): LyktaError | undefined {
  const rawErr = tx.meta?.err
  if (!rawErr) return undefined

  // Transaction-level errors are plain strings (e.g. "BlockhashNotFound", "InsufficientFundsForFee")
  if (typeof rawErr === 'string') {
    const txMsg = TRANSACTION_ERRORS.get(rawErr)
    return { code: rawErr, programId: 'unknown', name: rawErr, message: txMsg ?? rawErr }
  }

  const errObj = rawErr as Record<string, unknown>

  // Transaction-level object errors with no InstructionError key (rare edge cases)
  if (!('InstructionError' in errObj)) {
    const code = String(rawErr)
    const txMsg = TRANSACTION_ERRORS.get(code)
    return { code, programId: 'unknown', name: code, message: txMsg ?? code }
  }

  const [ixIndex, detail] = errObj['InstructionError'] as [number, unknown]

  // Resolve programId from the failing instruction index
  const message = tx.transaction.message
  const toStr = (k: unknown): string =>
    typeof k === 'string' ? k : (k as { toBase58(): string }).toBase58()
  const accountKeys = 'staticAccountKeys' in message
    ? message.staticAccountKeys.map(toStr)
    : (message as { accountKeys: unknown[] }).accountKeys.map(toStr)
  const ixList = 'compiledInstructions' in message
    ? message.compiledInstructions
    : (message as { instructions: { programIdIndex: number }[] }).instructions
  const ixMeta  = ixList[ixIndex as number]
  const programId = ixMeta ? (accountKeys[ixMeta.programIdIndex] ?? 'unknown') : 'unknown'

  // ── Tier 1: named runtime/system error (detail is a string) ─────────────────
  if (typeof detail === 'string') {
    const sysMsg = SYSTEM_ERRORS.get(detail)
    return { code: detail, programId, name: detail, message: sysMsg ?? detail }
  }

  // ── Custom error code (detail is { Custom: N }) ──────────────────────────────
  if (typeof detail === 'object' && detail !== null && 'Custom' in detail) {
    const code = (detail as { Custom: number }).Custom

    // ── Tier 2: Anchor framework errors (100–3999) ────────────────────────────
    const anchorMsg = ANCHOR_ERRORS[code]
    if (anchorMsg) {
      const name = anchorMsg.split(':')[0] ?? anchorMsg
      return { code, programId, name, message: anchorMsg }
    }

    // ── Tier 3a: System Program errors (program-specific, checked before SPL) ─
    if (programId === '11111111111111111111111111111111') {
      const sysProgMsg = SYSTEM_PROGRAM_ERRORS.get(code)
      if (sysProgMsg) {
        const name = sysProgMsg.split(':')[0] ?? sysProgMsg
        return { code, programId, name, message: sysProgMsg }
      }
    }

    // ── Tier 3b: SPL Token errors (only for known Token / Token-2022 programs) ─
    if (SPL_TOKEN_PROGRAM_IDS.has(programId)) {
      const splMsg = SPL_TOKEN_ERRORS.get(code)
      if (splMsg) {
        const name = splMsg.split(':')[0] ?? splMsg
        return { code, programId, name, message: splMsg }
      }
    }

    // Unrecognised custom code
    return {
      code,
      programId,
      message: `Custom program error: 0x${code.toString(16).toUpperCase()}`,
    }
  }

  // Fallback: unknown error shape
  return { code: String(detail), programId, message: String(rawErr) }
}

/**
 * Decodes the error from a failed transaction and optionally generates a fix suggestion
 * using the Claude API (when ANTHROPIC_API_KEY is set in the environment).
 */
export async function explainError(
  tx: LyktaTransaction,
  _connection: Connection,
): Promise<LyktaError | undefined> {
  if (tx.success) return undefined

  const rawErr = tx.raw.meta?.err
  if (!rawErr) return undefined

  // Parse Anchor custom error codes from log messages
  const logs = tx.raw.meta?.logMessages ?? []
  let code: number | string = 'unknown'
  let programId = 'unknown'

  for (const log of logs) {
    // "Program log: AnchorError occurred. Error Code: <name>. Error Number: <N>."
    const anchorMatch = /Error Number: (\d+)/.exec(log)
    if (anchorMatch) {
      code = parseInt(anchorMatch[1] ?? '0', 10)
    }
    // "Program <id> failed: ..."
    const failedMatch = /Program (\S+) failed/.exec(log)
    if (failedMatch) {
      programId = failedMatch[1] ?? 'unknown'
    }
  }

  const name = typeof code === 'number' ? ANCHOR_ERRORS[code] : undefined
  const message = name ?? `Transaction failed with error: ${JSON.stringify(rawErr)}`

  const error: LyktaError = name
    ? { code, programId, name, message }
    : { code, programId, message }

  // TODO (Week 4): call Claude API for AI-generated fix suggestion
  // if (process.env.ANTHROPIC_API_KEY) {
  //   error.suggestion = await callClaude({ logs, error, idl })
  // }

  return error
}
