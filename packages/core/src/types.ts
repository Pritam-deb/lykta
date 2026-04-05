import type { VersionedTransactionResponse } from '@solana/web3.js'

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
  /** Reason string from "Program X failed: <reason>" log line (log-parsed trees only) */
  failReason?: string
  /** Compute unit consumption for this frame (only present when parsed from logs) */
  computeUnits?: { consumed: number; limit: number }
  /** True when the validator truncated logs before this frame completed */
  logsTruncated?: boolean
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
  /** True when consumed >= limit (instruction hit the compute ceiling) */
  isOverBudget?: boolean
}

/**
 * Per-account SPL token balance change for a single transaction.
 * Uses BigInt for the raw `delta` so no precision is lost on large amounts.
 */
export interface TokenDiff {
  /** Index into the transaction's account keys array */
  accountIndex: number
  /** On-chain address of the token account (base58) */
  address: string
  /** Mint address of the token */
  mint: string
  /** Owner wallet address */
  owner: string
  /** Decimal precision of the mint */
  decimals: number
  /** Raw pre-balance in base units */
  preAmount: bigint
  /** Raw post-balance in base units */
  postAmount: bigint
  /** Net change in base units — exact BigInt arithmetic, never loses precision */
  delta: bigint
  /** Human-readable signed decimal string, e.g. "-5.000000" or "5.000000" */
  uiDelta: string
}

/**
 * A single account entry with its IDL-provided label merged with its
 * runtime address from the transaction.
 */
export interface LabeledAccount {
  /** Human-readable name from the IDL (e.g. "authority", "tokenAccount") */
  name: string
  /** On-chain address (base58) */
  address: string
  writable: boolean
  signer: boolean
}

/**
 * The fully-decoded representation of one CPI instruction node.
 * When an IDL match is found, `name`, `args`, and `accounts` are populated.
 * When no IDL is available the node falls back to raw hex.
 */
export interface DecodedInstruction {
  /** Instruction name from the IDL, or null when no match was found. */
  name: string | null
  /** Decoded Borsh arguments keyed by field name, or null on fallback. */
  args: Record<string, unknown> | null
  /** Accounts in index order with IDL labels merged in. */
  accounts: LabeledAccount[]
  /** Hex-encoded full instruction data (useful for debugging). */
  rawHex: string
  /** Hex-encoded 8-byte discriminator prefix. */
  discriminatorHex: string
  /** True when the discriminator matched an IDL instruction. */
  matched: boolean
  /** The underlying CpiNode (mutated in-place with name/args/programName). */
  node: CpiNode
}

/** Decoded error from a failed transaction */
export interface LyktaError {
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

/** The fully-enriched transaction object produced by @lykta/core. */
export interface LyktaTransaction {
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
  /** Flat list of decoded instructions in tree-traversal order */
  decodedInstructions: DecodedInstruction[]
  /** Account state diffs (lamport-level) */
  accountDiffs: AccountDiff[]
  /** SPL token balance changes with BigInt-precise deltas */
  tokenDiffs: TokenDiff[]
  /** Per-instruction compute unit breakdown (top-level frames only) */
  cuUsage: CuUsage[]
  /** Total compute units consumed across the transaction */
  totalCu: number
  /** Decoded error (only present when success is false) */
  error?: LyktaError
  /** Raw transaction response from the RPC */
  raw: VersionedTransactionResponse
}
