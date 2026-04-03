import type { Connection, VersionedTransactionResponse } from '@solana/web3.js'
import type { Idl } from '@coral-xyz/anchor'
import type { LyktaTransaction, CpiNode, DecodedInstruction } from './types.js'
import { fetchRawTransaction } from './fetch.js'
import { resolveAllAccountKeys } from './accounts.js'
import { buildCpiTree } from './cpi.js'
import { fetchIdlsForPrograms } from './idl.js'
import { decodeInstructions } from './decode.js'
import { computeAccountDiffs, computeTokenDiffs } from './diff.js'
import { extractComputeUnits } from './compute.js'
import { resolveError } from './errors.js'

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Collects every unique programId in the CPI tree (all depths). */
function collectProgramIds(nodes: CpiNode[]): string[] {
  const ids = new Set<string>()
  function walk(node: CpiNode): void {
    ids.add(node.programId)
    for (const child of node.children) walk(child)
  }
  for (const node of nodes) walk(node)
  return [...ids]
}

// ── Core pipeline ─────────────────────────────────────────────────────────────

/**
 * Runs the full 9-step Lykta analysis pipeline on a pre-fetched transaction.
 *
 * Separating the fetch from the decode lets tests inject fixture data without
 * hitting the network, while the public `decodeTransaction` entry point handles
 * both steps transparently.
 *
 * Steps:
 *  1. Resolve full account key list — expands v0 ALT slots via `connection`
 *  2. Build CPI tree from `innerInstructions` (with resolved keys)
 *  3. Collect unique program IDs from the tree
 *  4. Fetch IDLs for all programs (`fetchIdlsForPrograms`, best-effort)
 *  5. Decode instructions per program → flat `DecodedInstruction[]`
 *  6. Compute lamport-level account diffs
 *  7. Compute BigInt-precise token diffs
 *  8. Extract top-level CU breakdown (with `isOverBudget`)
 *  9. Resolve error via 3-tier registry lookup
 *
 * Both the `resolveAllAccountKeys` and `fetchIdlsForPrograms` steps degrade
 * gracefully when `connection` is a stub (unit tests, offline fixtures): the
 * error is caught, and the pipeline continues with static keys / null IDLs.
 */
export async function decodeTransactionFromRaw(
  raw: VersionedTransactionResponse,
  connection: Connection,
): Promise<LyktaTransaction> {
  const signature = raw.transaction.signatures[0] ?? ''
  const success   = raw.meta?.err === null || raw.meta?.err === undefined

  // ── Step 1: Resolve full account key list (handles v0 ALT) ─────────────────
  let resolvedKeys: string[]
  try {
    const pks = await resolveAllAccountKeys(raw.transaction.message, connection)
    resolvedKeys = pks.map((k) => k.toBase58())
  } catch {
    // Stub connection (unit tests) or deactivated ALT — fall back to static keys.
    // CPI tree account lists will be incomplete for v0+ALT transactions.
    const msg    = raw.transaction.message
    const toStr  = (k: unknown): string =>
      typeof k === 'string' ? k : (k as { toBase58(): string }).toBase58()
    resolvedKeys = 'staticAccountKeys' in msg
      ? msg.staticAccountKeys.map(toStr)
      : (msg as { accountKeys: unknown[] }).accountKeys.map(toStr)
  }

  // ── Step 2: Build CPI tree ──────────────────────────────────────────────────
  const cpiTree = buildCpiTree(raw, resolvedKeys)

  // ── Step 3: Collect unique program IDs ─────────────────────────────────────
  const programIds = collectProgramIds(cpiTree)

  // ── Step 4: Fetch IDLs (best-effort; null = no on-chain IDL) ───────────────
  let idlMap: Map<string, Idl | null>
  try {
    idlMap = await fetchIdlsForPrograms(programIds, connection)
  } catch {
    // Connection stub has no getAccountInfo — all IDLs default to null.
    idlMap = new Map(programIds.map((id) => [id, null]))
  }

  // ── Step 5: Decode instructions per top-level program ──────────────────────
  // Each top-level node is decoded with its own program's IDL. Children from
  // other programs within the same subtree will return matched=false, which is
  // the correct behaviour until per-node IDL routing is added.
  const decodedInstructions: DecodedInstruction[] = []
  for (const node of cpiTree) {
    const idl = idlMap.get(node.programId) ?? null
    decodedInstructions.push(...decodeInstructions([node], idl))
  }

  // ── Step 6: Account diffs (lamport-level) ───────────────────────────────────
  const accountDiffs = computeAccountDiffs(raw)

  // ── Step 7: Token diffs (BigInt-precise) ───────────────────────────────────
  const tokenDiffs = computeTokenDiffs(raw)

  // ── Step 8: Compute unit breakdown (top-level frames only) ─────────────────
  const cuUsage = extractComputeUnits(raw)
  const totalCu = cuUsage.reduce((sum, cu) => sum + cu.consumed, 0)

  // ── Step 9: Error resolution (3-tier registry lookup) ──────────────────────
  const error = resolveError(raw)

  return {
    signature,
    slot:      raw.slot,
    blockTime: raw.blockTime ?? null,
    success,
    fee:       raw.meta?.fee ?? 0,
    cpiTree,
    decodedInstructions,
    accountDiffs,
    tokenDiffs,
    cuUsage,
    totalCu,
    ...(error !== undefined ? { error } : {}),
    raw,
  }
}

/**
 * Fetches and fully decodes a transaction by signature.
 *
 * This is the primary public entry point for the Lykta analysis pipeline.
 * It fetches the raw RPC response and then delegates to `decodeTransactionFromRaw`.
 *
 * @param signature  Base58-encoded transaction signature.
 * @param connection Active RPC connection (devnet / mainnet).
 */
export async function decodeTransaction(
  signature: string,
  connection: Connection,
): Promise<LyktaTransaction> {
  const raw = await fetchRawTransaction(signature, connection)
  return decodeTransactionFromRaw(raw, connection)
}
