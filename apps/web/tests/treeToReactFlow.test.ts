import { describe, it, expect } from 'vitest'
import type { CpiNode } from '@lykta/core'
import { treeToReactFlow, X_SPACING, Y_SPACING } from '../lib/treeToReactFlow'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeNode(programId: string, children: CpiNode[] = []): CpiNode {
  return {
    programId,
    accounts: [],
    data: '',
    depth: 0, // depth field on CpiNode is informational; treeToReactFlow derives its own
    children,
    failed: false,
  }
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

// Mirrors the cpi-nested fixture tree as built by buildCpiTree (innerInstructions, flat):
//   root[0] = ComputeBudget  (no children)
//   root[1] = Jupiter        (5 flat children: Token, Orca, Token, Token, Token)
// → 7 nodes total, 5 edges (all from Jupiter to its children; no edge between root siblings)
const CB  = 'ComputeBudget111111111111111111111111111111'
const JUP = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'
const TOKEN = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const ORCA  = 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'

const cpiNestedRoots: CpiNode[] = [
  makeNode(CB),
  makeNode(JUP, [
    makeNode(TOKEN),
    makeNode(ORCA),
    makeNode(TOKEN),
    makeNode(TOKEN),
    makeNode(TOKEN),
  ]),
]

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('treeToReactFlow — empty input', () => {
  it('returns empty nodes and edges for an empty array', () => {
    const { nodes, edges } = treeToReactFlow([])
    expect(nodes).toHaveLength(0)
    expect(edges).toHaveLength(0)
  })
})

describe('treeToReactFlow — single node', () => {
  const { nodes, edges } = treeToReactFlow([makeNode('11111111111111111111111111111111')])

  it('produces 1 node', () => expect(nodes).toHaveLength(1))
  it('produces 0 edges', () => expect(edges).toHaveLength(0))

  it('positions the node at the origin', () => {
    expect(nodes[0]!.position).toEqual({ x: 0, y: 0 })
  })

  it('sets node type to cpiNode', () => {
    expect(nodes[0]!.type).toBe('cpiNode')
  })

  it('carries the CpiNode as data.cpiNode', () => {
    expect(nodes[0]!.data.cpiNode.programId).toBe('11111111111111111111111111111111')
  })
})

describe('treeToReactFlow — cpi-nested fixture (7 nodes, 5 edges)', () => {
  const { nodes, edges } = treeToReactFlow(cpiNestedRoots)

  it('produces 7 nodes', () => expect(nodes).toHaveLength(7))
  it('produces 5 edges (Jupiter → each of its 5 children)', () => expect(edges).toHaveLength(5))

  it('places root nodes at x=0', () => {
    const rootNodes = nodes.filter((n) => n.position.x === 0)
    expect(rootNodes).toHaveLength(2)
  })

  it('places depth-1 children at x = X_SPACING', () => {
    const depth1 = nodes.filter((n) => n.position.x === X_SPACING)
    expect(depth1).toHaveLength(5)
  })

  it('stacks root siblings vertically by Y_SPACING', () => {
    const roots = nodes.filter((n) => n.position.x === 0)
    const ys = roots.map((n) => n.position.y).sort((a, b) => a - b)
    expect(ys[0]).toBe(0)
    expect(ys[1]).toBe(Y_SPACING)
  })

  it('all edge sources point to the Jupiter node id', () => {
    const jupNode = nodes.find((n) => n.data.cpiNode.programId === JUP)
    expect(jupNode).toBeDefined()
    edges.forEach((e) => expect(e.source).toBe(jupNode!.id))
  })

  it('all edge targets are distinct', () => {
    const targets = edges.map((e) => e.target)
    expect(new Set(targets).size).toBe(edges.length)
  })
})

describe('treeToReactFlow — node ids are unique across the tree', () => {
  it('never generates duplicate ids even when the same program appears multiple times', () => {
    const { nodes } = treeToReactFlow(cpiNestedRoots)
    const ids = nodes.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
