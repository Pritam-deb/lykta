import type { Connection } from '@solana/web3.js'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { LyktaError, LyktaTransaction } from './types.js'

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
