// @solscope/core — public API surface
// Everything exported here is the contract consumed by @solscope/cli, @solscope/vscode, and @solscope/litesvm.

export type { CpiNode, SolScopeTransaction, AccountDiff, CuUsage, SolScopeError } from './types.js'
export { fetchTransaction } from './fetch.js'
export { buildCpiTree } from './cpi.js'
export { extractAccountDiffs } from './diff.js'
export { parseCuUsage } from './compute.js'
export { resolveIdl, decodeInstruction } from './idl.js'
export { explainError } from './errors.js'
