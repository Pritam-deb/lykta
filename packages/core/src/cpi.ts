import type { Message, MessageV0, VersionedTransactionResponse } from '@solana/web3.js'
import type { CpiNode } from './types.js'

/**
 * Parses the transaction's inner instructions into a nested CPI call tree.
 * Handles both legacy Message and MessageV0 (versioned transactions).
 * Top-level instructions sit at depth 0; each inner instruction bumps depth by 1.
 */
export function buildCpiTree(tx: VersionedTransactionResponse): CpiNode[] {
  const message = tx.transaction.message
  const isV0 = 'staticAccountKeys' in message

  // Keys may be PublicKey objects (from RPC) or plain strings (from fixtures/tests)
  const toStr = (k: unknown): string =>
    typeof k === 'string' ? k : (k as { toBase58(): string }).toBase58()

  const accountKeys = isV0
    ? (message as MessageV0).staticAccountKeys.map(toStr)
    : (message as Message).accountKeys.map(toStr)

  const failed = tx.meta?.err !== null
  const innerInstructions = tx.meta?.innerInstructions ?? []
  const innerByParent = new Map<number, (typeof innerInstructions)[number]['instructions']>()
  for (const group of innerInstructions) {
    innerByParent.set(group.index, group.instructions)
  }

  if (isV0) {
    const msg = message as MessageV0
    return msg.compiledInstructions.map((ix, i): CpiNode => {
      const programId = accountKeys[ix.programIdIndex] ?? 'unknown'
      const accounts = ix.accountKeyIndexes.map((idx) => accountKeys[idx] ?? 'unknown')
      const data = Buffer.from(ix.data).toString('base64')
      const children: CpiNode[] = (innerByParent.get(i) ?? []).map((inner): CpiNode => ({
        programId: accountKeys[inner.programIdIndex] ?? 'unknown',
        accounts: inner.accounts.map((idx) => accountKeys[idx] ?? 'unknown'),
        data: inner.data,
        depth: 1,
        children: [],
        failed: false,
      }))
      return { programId, accounts, data, depth: 0, children, failed: i === msg.compiledInstructions.length - 1 ? failed : false }
    })
  }

  // Legacy message
  const msg = message as Message
  return msg.instructions.map((ix, i): CpiNode => {
    const programId = accountKeys[ix.programIdIndex] ?? 'unknown'
    const accounts = ix.accounts.map((idx) => accountKeys[idx] ?? 'unknown')
    const children: CpiNode[] = (innerByParent.get(i) ?? []).map((inner): CpiNode => ({
      programId: accountKeys[inner.programIdIndex] ?? 'unknown',
      accounts: inner.accounts.map((idx) => accountKeys[idx] ?? 'unknown'),
      data: inner.data,
      depth: 1,
      children: [],
      failed: false,
    }))
    return { programId, accounts, data: ix.data, depth: 0, children, failed: i === msg.instructions.length - 1 ? failed : false }
  })
}
