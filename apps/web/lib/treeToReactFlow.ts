import type { Node, Edge } from 'reactflow'
import type { CpiNode } from '@lykta/core'

export const X_SPACING = 250
export const Y_SPACING = 120

export interface CpiNodeData {
  cpiNode: CpiNode
}

/**
 * Converts a CPI call tree into React Flow nodes and edges.
 *
 * Layout: x = depth × X_SPACING, y = siblingIndex × Y_SPACING.
 * Node ids are unique across the whole tree via a per-call counter.
 * Each Node carries the original CpiNode as `data.cpiNode` for the
 * custom card renderer to consume.
 */
export function treeToReactFlow(roots: CpiNode[]): {
  nodes: Node<CpiNodeData>[]
  edges: Edge[]
} {
  const nodes: Node<CpiNodeData>[] = []
  const edges: Edge[] = []
  let counter = 0

  function visit(
    cpiNode: CpiNode,
    depth: number,
    siblingIndex: number,
    parentId: string | null,
  ) {
    const id = `${cpiNode.programId}-${depth}-${counter++}`

    nodes.push({
      id,
      type: 'cpiNode',
      position: { x: depth * X_SPACING, y: siblingIndex * Y_SPACING },
      data: { cpiNode },
    })

    if (parentId !== null) {
      edges.push({
        id: `e-${parentId}__${id}`,
        source: parentId,
        target: id,
      })
    }

    cpiNode.children.forEach((child, i) => visit(child, depth + 1, i, id))
  }

  roots.forEach((root, i) => visit(root, 0, i, null))

  return { nodes, edges }
}
