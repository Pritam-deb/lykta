import { useState } from 'react'

interface CpiNode {
  programId: string
  programName?: string
  instructionName?: string
  accounts: string[]
  data: string
  depth: number
  children: CpiNode[]
  failed: boolean
  failReason?: string
  computeUnits?: { consumed: number; limit: number }
  logsTruncated?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortId(id: string): string {
  return `${id.slice(0, 8)}…`
}

// ── Single node row ───────────────────────────────────────────────────────────

function CpiNodeRow({ node }: { node: CpiNode }) {
  const [expanded, setExpanded] = useState(true)

  const hasChildren = node.children.length > 0
  const label = node.programName ?? shortId(node.programId)
  const accent = node.failed ? '#f87171' : '#4ade80'
  const icon = node.failed ? '✗' : '✓'

  return (
    <div style={{ marginLeft: node.depth === 0 ? 0 : 16 }}>
      {/* Row */}
      <div
        onClick={() => hasChildren && setExpanded((e) => !e)}
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '6px',
          padding: '3px 6px',
          borderRadius: '4px',
          cursor: hasChildren ? 'pointer' : 'default',
          userSelect: 'none',
        }}
        title={node.programId}
      >
        {/* Expand toggle */}
        <span style={{ fontSize: '10px', opacity: 0.4, minWidth: '10px' }}>
          {hasChildren ? (expanded ? '▾' : '▸') : ' '}
        </span>

        {/* Status icon */}
        <span style={{ color: accent, fontWeight: 600, fontSize: '12px' }}>
          {icon}
        </span>

        {/* Program label */}
        <span style={{ color: accent, fontSize: '12px', fontWeight: 500 }}>
          {label}
        </span>

        {/* Instruction name */}
        {node.instructionName && (
          <span style={{ fontSize: '11px', opacity: 0.6 }}>
            · {node.instructionName}
          </span>
        )}

        {/* CU usage inline */}
        {node.computeUnits && (
          <span style={{ fontSize: '10px', opacity: 0.45, marginLeft: 'auto' }}>
            {node.computeUnits.consumed.toLocaleString()} CU
          </span>
        )}

        {/* Truncation warning */}
        {node.logsTruncated && (
          <span style={{ fontSize: '10px', color: '#fbbf24', marginLeft: '4px' }}>
            [logs truncated]
          </span>
        )}
      </div>

      {/* Fail reason — shown below the row, indented */}
      {node.failed && node.failReason && (
        <div style={{
          marginLeft: 32,
          fontSize: '11px',
          color: '#fca5a5',
          opacity: 0.85,
          padding: '1px 0 4px',
        }}>
          {node.failReason}
        </div>
      )}

      {/* Children */}
      {expanded && hasChildren && (
        <div style={{
          borderLeft: '1px solid var(--vscode-panel-border)',
          marginLeft: 14,
          paddingLeft: 4,
        }}>
          {node.children.map((child, i) => (
            <CpiNodeRow key={i} node={child} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function CpiTreePanel({ cpiTree }: { cpiTree: CpiNode[] }) {
  if (cpiTree.length === 0) {
    return (
      <div style={{ padding: '24px', opacity: 0.5, fontSize: '12px' }}>
        No CPI data available for this transaction.
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 8px' }}>
      {cpiTree.map((node, i) => (
        <CpiNodeRow key={i} node={node} />
      ))}
    </div>
  )
}
