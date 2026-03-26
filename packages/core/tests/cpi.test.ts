import { describe, it, expect } from 'vitest'
import { buildCpiTree } from '../src/cpi.js'
import type { VersionedTransactionResponse } from '@solana/web3.js'
import simpleTx from './fixtures/simple-transfer.json'
import failedTx from './fixtures/failed-anchor.json'

describe('buildCpiTree', () => {
  it('builds a single-instruction tree for a simple SOL transfer', () => {
    const tree = buildCpiTree(simpleTx as unknown as VersionedTransactionResponse)

    expect(tree).toHaveLength(1)
    const root = tree[0]!
    expect(root.depth).toBe(0)
    expect(root.programId).toBe('11111111111111111111111111111111')
    expect(root.accounts).toEqual([
      '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      'BrG44HdsEhzapvs8bEqzvkq4egwevS2y3W5D5zMtWen',
    ])
    expect(root.children).toHaveLength(0)
  })

  it('marks the last instruction as failed when meta.err is set', () => {
    const tree = buildCpiTree(failedTx as unknown as VersionedTransactionResponse)

    expect(tree).toHaveLength(1)
    expect(tree[0]!.failed).toBe(true)
  })

  it('marks instructions as not failed when transaction succeeds', () => {
    const tree = buildCpiTree(simpleTx as unknown as VersionedTransactionResponse)
    expect(tree[0]!.failed).toBe(false)
  })
})
