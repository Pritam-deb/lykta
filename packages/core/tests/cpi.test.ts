import { describe, it, expect } from 'vitest'
import { buildCpiTree, parseCpiTree } from '../src/index.js'
import type { VersionedTransactionResponse } from '@solana/web3.js'
import simpleTx from './fixtures/simple-transfer.json'
import failedTx from './fixtures/failed-anchor.json'
import solTransferLogs from './fixtures/logs-sol-transfer.json'
import failedSwapLogs from './fixtures/logs-failed-swap.json'
import jupiterSwapLogs from './fixtures/logs-jupiter-swap.json'

// ── Helpers ───────────────────────────────────────────────────────────────────

const PROG_A = 'Prog1111111111111111111111111111111111111111'
const PROG_B = 'Prog2222222222222222222222222222222222222222'
const PROG_C = 'Prog3333333333333333333333333333333333333333'

const inv = (id: string, depth: number) => `Program ${id} invoke [${depth}]`
const ok  = (id: string) => `Program ${id} success`
const fail = (id: string, reason = 'custom program error') =>
  `Program ${id} failed: ${reason}`
const cu = (id: string, used: number, limit: number) =>
  `Program ${id} consumed ${used} of ${limit} compute units`

// ── parseCpiTree ──────────────────────────────────────────────────────────────

describe('parseCpiTree', () => {
  it('returns empty array for empty log list', () => {
    expect(parseCpiTree([])).toEqual([])
  })

  it('builds a single top-level node', () => {
    const tree = parseCpiTree([inv(PROG_A, 1), ok(PROG_A)])
    expect(tree).toHaveLength(1)
    expect(tree[0]!.programId).toBe(PROG_A)
    expect(tree[0]!.depth).toBe(0)
    expect(tree[0]!.failed).toBe(false)
    expect(tree[0]!.children).toHaveLength(0)
  })

  it('sets failed=true when program fails', () => {
    const tree = parseCpiTree([inv(PROG_A, 1), fail(PROG_A)])
    expect(tree[0]!.failed).toBe(true)
  })

  it('builds two sequential top-level nodes', () => {
    const tree = parseCpiTree([
      inv(PROG_A, 1), ok(PROG_A),
      inv(PROG_B, 1), ok(PROG_B),
    ])
    expect(tree).toHaveLength(2)
    expect(tree[0]!.programId).toBe(PROG_A)
    expect(tree[1]!.programId).toBe(PROG_B)
  })

  it('nests a single child CPI correctly', () => {
    const tree = parseCpiTree([
      inv(PROG_A, 1),
        inv(PROG_B, 2), cu(PROG_B, 3_000, 200_000), ok(PROG_B),
      cu(PROG_A, 10_000, 200_000), ok(PROG_A),
    ])
    expect(tree).toHaveLength(1)
    expect(tree[0]!.children).toHaveLength(1)
    expect(tree[0]!.children[0]!.programId).toBe(PROG_B)
    expect(tree[0]!.children[0]!.depth).toBe(1)
  })

  it('nests three levels deep', () => {
    const tree = parseCpiTree([
      inv(PROG_A, 1),
        inv(PROG_B, 2),
          inv(PROG_C, 3), ok(PROG_C),
        ok(PROG_B),
      ok(PROG_A),
    ])
    const a = tree[0]!
    const b = a.children[0]!
    const c = b.children[0]!
    expect(a.depth).toBe(0)
    expect(b.depth).toBe(1)
    expect(c.depth).toBe(2)
    expect(c.programId).toBe(PROG_C)
  })

  it('attaches computeUnits to the correct node', () => {
    const tree = parseCpiTree([
      inv(PROG_A, 1),
        inv(PROG_B, 2), cu(PROG_B, 5_000, 200_000), ok(PROG_B),
      cu(PROG_A, 15_000, 200_000), ok(PROG_A),
    ])
    expect(tree[0]!.computeUnits).toEqual({ consumed: 15_000, limit: 200_000 })
    expect(tree[0]!.children[0]!.computeUnits).toEqual({ consumed: 5_000, limit: 200_000 })
  })

  it('marks open frames as logsTruncated=true when "Log truncated" is seen', () => {
    const tree = parseCpiTree([
      inv(PROG_A, 1),
        inv(PROG_B, 2),
      'Log truncated',
    ])
    expect(tree).toHaveLength(1)
    expect(tree[0]!.logsTruncated).toBe(true)
    expect(tree[0]!.children[0]!.logsTruncated).toBe(true)
  })

  it('flushes all open frames with correct nesting after truncation', () => {
    const tree = parseCpiTree([
      inv(PROG_A, 1),
        inv(PROG_B, 2),
          inv(PROG_C, 3),
      'Log truncated',
    ])
    expect(tree).toHaveLength(1)
    const c = tree[0]!.children[0]!.children[0]!
    expect(c.programId).toBe(PROG_C)
    expect(c.logsTruncated).toBe(true)
  })

  it('drains unclosed frames when logs end without close markers', () => {
    const tree = parseCpiTree([inv(PROG_A, 1), inv(PROG_B, 2)])
    expect(tree).toHaveLength(1)
    expect(tree[0]!.programId).toBe(PROG_A)
    expect(tree[0]!.children[0]!.programId).toBe(PROG_B)
  })

  it('ignores Program log: and Program data: lines', () => {
    const tree = parseCpiTree([
      inv(PROG_A, 1),
      `Program log: Hello from ${PROG_A}`,
      `Program data: AQIDBA==`,
      cu(PROG_A, 1_000, 200_000),
      ok(PROG_A),
    ])
    expect(tree).toHaveLength(1)
    expect(tree[0]!.computeUnits!.consumed).toBe(1_000)
  })

  it('handles a failed child while parent also fails', () => {
    const tree = parseCpiTree([
      inv(PROG_A, 1),
        inv(PROG_B, 2), fail(PROG_B),
      fail(PROG_A),
    ])
    expect(tree[0]!.failed).toBe(true)
    expect(tree[0]!.children[0]!.failed).toBe(true)
  })

  it('sets data and accounts to empty values (not in logs)', () => {
    const node = parseCpiTree([inv(PROG_A, 1), ok(PROG_A)])[0]!
    expect(node.data).toBe('')
    expect(node.accounts).toEqual([])
  })

  it('handles consumed line with no open frame gracefully', () => {
    expect(() => parseCpiTree([cu(PROG_A, 100, 200_000)])).not.toThrow()
    expect(parseCpiTree([cu(PROG_A, 100, 200_000)])).toEqual([])
  })
})

// ── buildCpiTree ──────────────────────────────────────────────────────────────

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

// ── parseCpiTree — fixture-based tests ───────────────────────────────────────

const SYS  = '11111111111111111111111111111111'
const JUP  = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'
const ORCA = 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'
const SPL  = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const CB   = 'ComputeBudget111111111111111111111111111111'

describe('parseCpiTree — fixture: logs-sol-transfer', () => {
  const tree = parseCpiTree(solTransferLogs.logMessages)

  it('produces exactly one root node', () => {
    expect(tree).toHaveLength(1)
  })

  it('root is the System Program at depth 0', () => {
    expect(tree[0]!.programId).toBe(SYS)
    expect(tree[0]!.depth).toBe(0)
  })

  it('root has no children (pure transfer, no CPIs)', () => {
    expect(tree[0]!.children).toHaveLength(0)
  })

  it('root is not failed', () => {
    expect(tree[0]!.failed).toBe(false)
  })

  it('root carries correct compute unit consumption', () => {
    expect(tree[0]!.computeUnits).toEqual({ consumed: 150, limit: 200_000 })
  })
})

describe('parseCpiTree — fixture: logs-failed-swap', () => {
  const tree = parseCpiTree(failedSwapLogs.logMessages)

  it('produces one root node (Jupiter)', () => {
    expect(tree).toHaveLength(1)
    expect(tree[0]!.programId).toBe(JUP)
  })

  it('root is failed', () => {
    expect(tree[0]!.failed).toBe(true)
  })

  it('root failReason contains the error code string', () => {
    expect(tree[0]!.failReason).toBe('custom program error: 0x1781')
  })

  it('root has 2 children: Token Program (success) + Orca (failed)', () => {
    expect(tree[0]!.children).toHaveLength(2)
    expect(tree[0]!.children[0]!.programId).toBe(SPL)
    expect(tree[0]!.children[0]!.failed).toBe(false)
    expect(tree[0]!.children[1]!.programId).toBe(ORCA)
    expect(tree[0]!.children[1]!.failed).toBe(true)
  })

  it('Orca failReason matches the raw error string', () => {
    expect(tree[0]!.children[1]!.failReason).toBe('custom program error: 0x1781')
  })

  it('Orca child has one Token Program child (depth 2)', () => {
    const orca = tree[0]!.children[1]!
    expect(orca.children).toHaveLength(1)
    expect(orca.children[0]!.programId).toBe(SPL)
    expect(orca.children[0]!.depth).toBe(2)
    expect(orca.children[0]!.failed).toBe(false)
  })

  it('root carries compute units even though it failed', () => {
    expect(tree[0]!.computeUnits).toEqual({ consumed: 112_000, limit: 1_200_000 })
  })
})

describe('parseCpiTree — fixture: logs-jupiter-swap (3 CPI levels)', () => {
  const tree = parseCpiTree(jupiterSwapLogs.logMessages)

  it('produces two root nodes: ComputeBudget + Jupiter', () => {
    expect(tree).toHaveLength(2)
    expect(tree[0]!.programId).toBe(CB)
    expect(tree[1]!.programId).toBe(JUP)
  })

  it('ComputeBudget root has no children and is not failed', () => {
    expect(tree[0]!.children).toHaveLength(0)
    expect(tree[0]!.failed).toBe(false)
  })

  it('Jupiter root has 3 children (depth 1)', () => {
    const jup = tree[1]!
    expect(jup.children).toHaveLength(3)
    expect(jup.children[0]!.programId).toBe(SPL)  // pre-swap transfer
    expect(jup.children[1]!.programId).toBe(ORCA) // whirlpool swap
    expect(jup.children[2]!.programId).toBe(SPL)  // post-swap transfer
  })

  it('all Jupiter children are at depth 1', () => {
    for (const child of tree[1]!.children) {
      expect(child.depth).toBe(1)
    }
  })

  it('Orca Whirlpool has 2 Token Program children (depth 2 — the 3rd CPI level)', () => {
    const orca = tree[1]!.children[1]!
    expect(orca.children).toHaveLength(2)
    expect(orca.children[0]!.programId).toBe(SPL)
    expect(orca.children[0]!.depth).toBe(2)
    expect(orca.children[1]!.programId).toBe(SPL)
    expect(orca.children[1]!.depth).toBe(2)
  })

  it('no node in the tree is failed', () => {
    function allOk(nodes: ReturnType<typeof parseCpiTree>): boolean {
      return nodes.every((n) => !n.failed && allOk(n.children))
    }
    expect(allOk(tree)).toBe(true)
  })

  it('Orca CU consumption is attached correctly', () => {
    const orca = tree[1]!.children[1]!
    expect(orca.computeUnits).toEqual({ consumed: 72_890, limit: 1_334_136 })
  })

  it('Jupiter CU consumption is attached to the root', () => {
    expect(tree[1]!.computeUnits).toEqual({ consumed: 144_000, limit: 1_200_000 })
  })

  it('maximum depth across the tree is 2', () => {
    function maxDepth(nodes: ReturnType<typeof parseCpiTree>): number {
      return Math.max(0, ...nodes.map((n) => Math.max(n.depth, maxDepth(n.children))))
    }
    expect(maxDepth(tree)).toBe(2)
  })
})
