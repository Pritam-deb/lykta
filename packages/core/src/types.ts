import type { PublicKey, TransactionResponse } from '@solana/web3.js'

/** A single node in the CPI call tree. */
export interface CpiNode {
  /** Index into the transaction's accounts array */
  programId: string
  /** Human-readable program name, resolved from IDL (undefined if not available) */
  programName?: string
  /** Decoded instruction name from IDL discriminator (undefined if not decodeable) */
  instructionName?: string
  /** Decoded instruction arguments (undefined if IDL not available) */
  args?: Record<string, unknown>
  /** Account keys involved in this instruction */
  accounts: string[]
  /** Raw instruction data as base64 */
  data: string
  /** Nesting depth (0 = top-level instruction, 1+ = CPI) */
  depth: number
  /** Child CPI calls made by this instruction */
  children: CpiNode[]
  /** Whether this instruction failed */
  failed: boolean
}

/** Pre/post state diff for a single account touched by the transaction */
export interface AccountDiff {
  address: string
  /** Lamport balance before and after */
  lamports: { pre: number; post: number; delta: number }
  /** Raw account data before (base64) — undefined if account didn't exist */
  dataPre?: string
  /** Raw account data after (base64) — undefined if account was closed */
  dataPost?: string
  /** Owner program before and after */
  ownerPre?: string
  ownerPost?: string
  /** Token balance changes (only present for SPL token accounts) */
  tokenBalance?: {
    mint: string
    pre: string
    post: string
    delta: string
    decimals: number
  }
}

/** Per-instruction compute unit consumption */
export interface CuUsage {
  /** Instruction index (matches position in flattened instruction list) */
  instructionIndex: number
  /** Program that consumed these units */
  programId: string
  /** CUs consumed by this instruction */
  consumed: number
  /** CU limit allocated to this instruction */
  limit: number
  /** Percentage of limit consumed (0–100) */
  percentUsed: number
}

/** Decoded error from a failed transaction */
export interface SolScopeError {
  /** Raw error code as reported by the runtime */
  code: number | string
  /** Program that threw the error */
  programId: string
  /** Error name from IDL or known error map */
  name?: string
  /** Plain-English explanation */
  message: string
  /** AI-generated fix suggestion (only present when Claude API is configured) */
  suggestion?: string
}

/** The fully-enriched transaction object produced by @solscope/core. */
export interface SolScopeTransaction {
  /** Transaction signature */
  signature: string
  /** Slot the transaction was confirmed in */
  slot: number
  /** Block time (unix timestamp) */
  blockTime: number | null
  /** Whether the transaction succeeded */
  success: boolean
  /** Fee paid in lamports */
  fee: number
  /** Decoded CPI call tree */
  cpiTree: CpiNode[]
  /** Account state diffs */
  accountDiffs: AccountDiff[]
  /** Per-instruction compute unit breakdown */
  cuUsage: CuUsage[]
  /** Total compute units consumed across the transaction */
  totalCu: number
  /** Decoded error (only present when success is false) */
  error?: SolScopeError
  /** Raw transaction response from the RPC */
  raw: TransactionResponse
}
