import { Connection } from '@solana/web3.js'
import type { SolScopeTransaction } from './types.js'
import { buildCpiTree } from './cpi.js'
import { extractAccountDiffs } from './diff.js'
import { parseCuUsage } from './compute.js'

/**
 * Fetches and fully decodes a transaction by signature.
 * This is the primary entry point for all SolScope analysis.
 */
export async function fetchTransaction(
  signature: string,
  connection: Connection,
): Promise<SolScopeTransaction> {
  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: 'confirmed',
  })

  if (!tx) {
    throw new Error(`Transaction not found: ${signature}`)
  }

  // tx is VersionedTransactionResponse when maxSupportedTransactionVersion is set
  const vtx = tx as import('@solana/web3.js').VersionedTransactionResponse

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
