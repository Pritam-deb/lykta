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

  const cpiTree = buildCpiTree(tx)
  const accountDiffs = await extractAccountDiffs(tx, connection)
  const cuUsage = parseCuUsage(tx)
  const totalCu = cuUsage.reduce((sum, cu) => sum + cu.consumed, 0)
  const success = tx.meta?.err === null

  return {
    signature,
    slot: tx.slot,
    blockTime: tx.blockTime ?? null,
    success,
    fee: tx.meta?.fee ?? 0,
    cpiTree,
    accountDiffs,
    cuUsage,
    totalCu,
    error: undefined, // populated by explainError() if called
    raw: tx,
  }
}
