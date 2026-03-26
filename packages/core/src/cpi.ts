import type { TransactionResponse } from '@solana/web3.js'
import type { CpiNode } from './types.js'

/**
 * Parses the transaction's inner instructions into a nested CPI call tree.
 * Top-level instructions sit at depth 0; each inner instruction bumps depth by 1.
 */
export function buildCpiTree(tx: TransactionResponse): CpiNode[] {
  const message = tx.transaction.message
  const accountKeys =
    'staticAccountKeys' in message
      ? message.staticAccountKeys.map((k) => k.toBase58())
      : message.accountKeys.map((k) => k.toBase58())

  const instructions = message.instructions
  const innerInstructions = tx.meta?.innerInstructions ?? []
  const failed = tx.meta?.err !== null

  // Build a flat map of inner instruction groups keyed by their parent index
  const innerByParent = new Map<number, typeof innerInstructions[number]['instructions']>()
  for (const group of innerInstructions) {
    innerByParent.set(group.index, group.instructions)
  }

  return instructions.map((ix, i): CpiNode => {
    const programId = accountKeys[ix.programIdIndex] ?? 'unknown'
    const accounts = ix.accounts.map((idx) => accountKeys[idx] ?? 'unknown')
    const children: CpiNode[] = (innerByParent.get(i) ?? []).map((innerIx): CpiNode => ({
      programId: accountKeys[innerIx.programIdIndex] ?? 'unknown',
      accounts: innerIx.accounts.map((idx) => accountKeys[idx] ?? 'unknown'),
      data: innerIx.data,
      depth: 1,
      children: [],
      failed: false, // inner instructions don't individually report errors
    }))

    return {
      programId,
      accounts,
      data: ix.data,
      depth: 0,
      children,
      failed: i === instructions.length - 1 ? failed : false,
    }
  })
}
