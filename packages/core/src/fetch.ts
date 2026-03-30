import { Connection } from '@solana/web3.js'
import type { VersionedTransactionResponse } from '@solana/web3.js'
import type { LyktaTransaction } from './types.js'
import { buildCpiTree } from './cpi.js'
import { extractAccountDiffs } from './diff.js'
import { parseCuUsage } from './compute.js'

/**
 * Fetches the raw RPC transaction response without running any analysis.
 * Always requests maxSupportedTransactionVersion: 0 so v0 (versioned) transactions
 * are returned rather than throwing an UnsupportedTransactionVersion error.
 *
 * @throws {Error} with a descriptive message when the signature is not found on the cluster.
 */
export async function fetchRawTransaction(
  signature: string,
  connection: Connection,
): Promise<VersionedTransactionResponse> {
  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: 'confirmed',
  })

  if (!tx) {
    const cluster =
      (connection as unknown as { _rpcEndpoint?: string })._rpcEndpoint ??
      'unknown cluster'
    throw new Error(
      `Transaction not found: ${signature} (cluster: ${cluster}). ` +
        `The transaction may not yet be confirmed, may have been dropped, ` +
        `or the signature may be incorrect.`,
    )
  }

  return tx as VersionedTransactionResponse
}

/**
 * Fetches and fully decodes a transaction by signature.
 * This is the primary entry point for all Lykta analysis.
 */
export async function fetchTransaction(
  signature: string,
  connection: Connection,
): Promise<LyktaTransaction> {
  const vtx = await fetchRawTransaction(signature, connection)

  const cpiTree = buildCpiTree(vtx)
  const accountDiffs = await extractAccountDiffs(vtx, connection)
  const cuUsage = parseCuUsage(vtx)
  const totalCu = cuUsage.reduce((sum, cu) => sum + cu.consumed, 0)
  const success = vtx.meta?.err === null

  return {
    signature,
    slot: vtx.slot,
    blockTime: vtx.blockTime ?? null,
    success,
    fee: vtx.meta?.fee ?? 0,
    cpiTree,
    accountDiffs,
    cuUsage,
    totalCu,
    // error is omitted here; populate it by calling explainError() on the result
    raw: vtx,
  }
}
