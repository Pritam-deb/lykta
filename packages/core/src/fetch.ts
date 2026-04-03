import { Connection } from '@solana/web3.js'
import type { VersionedTransactionResponse } from '@solana/web3.js'
import type { LyktaTransaction } from './types.js'
import { decodeTransactionFromRaw } from './transaction.js'

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
 *
 * @deprecated Use `decodeTransaction` from `./transaction.js` instead — it runs
 * the full 9-step pipeline including IDL resolution, token diffs, and error
 * resolution. This wrapper is kept for backward compatibility only.
 */
export async function fetchTransaction(
  signature: string,
  connection: Connection,
): Promise<LyktaTransaction> {
  const raw = await fetchRawTransaction(signature, connection)
  return decodeTransactionFromRaw(raw, connection)
}
