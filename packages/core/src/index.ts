// @lykta/core — public API surface
// Everything exported here is the contract consumed by @lykta/cli, @lykta/vscode, and @lykta/litesvm.

export type {
  CpiNode,
  LyktaTransaction,
  AccountDiff,
  CuUsage,
  LyktaError,
  TokenDiff,
  DecodedInstruction,
  LabeledAccount,
} from './types.js'
export { fetchRawTransaction, fetchTransaction } from './fetch.js'
export { resolveAllAccountKeys } from './accounts.js'
export { buildCpiTree, parseCpiTree } from './cpi.js'
export { extractAccountDiffs, computeAccountDiffs, computeTokenDiffs } from './diff.js'
export { parseCuUsage, extractComputeUnits } from './compute.js'
export { fetchIdl, fetchIdlsForPrograms, decodeInstruction, resolveIdl } from './idl.js'
export { BorshReader, readField } from './borsh.js'
export { decodeInstructions, findInstructionByDiscriminator, deserializeArgs, computeDiscriminator } from './decode.js'
export { KNOWN_PROGRAMS, SYSTEM_ERRORS, SPL_TOKEN_ERRORS } from './registry.js'
export { explainError, resolveError } from './errors.js'
export { decodeTransaction, decodeTransactionFromRaw } from './transaction.js'
