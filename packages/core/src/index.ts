// @lykta/core — public API surface
// Everything exported here is the contract consumed by @lykta/cli, @lykta/vscode, and @lykta/litesvm.

export type { CpiNode, LyktaTransaction, AccountDiff, CuUsage, LyktaError } from './types.js'
export { fetchRawTransaction, fetchTransaction } from './fetch.js'
export { resolveAllAccountKeys } from './accounts.js'
export { buildCpiTree } from './cpi.js'
export { extractAccountDiffs } from './diff.js'
export { parseCuUsage } from './compute.js'
export { fetchIdl, fetchIdlsForPrograms, decodeInstruction, resolveIdl } from './idl.js'
export { BorshReader, readField } from './borsh.js'
export type { DecodedInstruction, LabeledAccount } from './decode.js'
export { decodeInstructions, findInstructionByDiscriminator, deserializeArgs, computeDiscriminator } from './decode.js'
export { KNOWN_PROGRAMS, SYSTEM_ERRORS, SPL_TOKEN_ERRORS } from './registry.js'
export { explainError } from './errors.js'
