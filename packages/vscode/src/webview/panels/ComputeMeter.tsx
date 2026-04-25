interface CuUsage {
  instructionIndex: number
  programId: string
  consumed: number
  limit: number
  percentUsed: number
  isOverBudget?: boolean
}

import { colors } from '../theme.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortId(id: string): string {
  return `${id.slice(0, 8)}…`
}

function barColor(percent: number): string {
  if (percent >= 80) return colors.error
  if (percent >= 50) return colors.warning
  return colors.success
}

// ── Single bar row ────────────────────────────────────────────────────────────

function CuBar({ entry }: { entry: CuUsage }) {
  const pct = Math.min(entry.percentUsed, 100)
  const color = barColor(pct)

  return (
    <div style={{ marginBottom: '10px' }}>
      {/* Label row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px',
        marginBottom: '3px',
      }}>
        <span style={{ opacity: 0.8, fontFamily: 'var(--vscode-editor-font-family)' }}>
          [{entry.instructionIndex}] {shortId(entry.programId)}
        </span>
        <span style={{ color, fontWeight: 600 }}>
          {entry.consumed.toLocaleString()} / {entry.limit.toLocaleString()} CU &nbsp;({pct.toFixed(1)}%)
        </span>
      </div>

      {/* Bar track */}
      <div style={{
        width: '100%',
        height: '6px',
        borderRadius: '3px',
        background: 'var(--vscode-panel-border)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: '3px',
          background: color,
          transition: 'width 0.2s ease',
        }} />
      </div>

      {/* Over-budget warning */}
      {entry.isOverBudget && (
        <div style={{ fontSize: '10px', color: colors.error, marginTop: '2px' }}>
          ⚠ Compute budget exceeded
        </div>
      )}
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function ComputeMeterPanel({
  cuUsage,
  totalCu,
}: {
  cuUsage: CuUsage[]
  totalCu: number
}) {
  if (cuUsage.length === 0) {
    return (
      <div style={{ padding: '24px', opacity: 0.5, fontSize: '12px' }}>
        No compute data available for this transaction.
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 16px' }}>
      {/* Summary line */}
      <div style={{
        fontSize: '11px',
        opacity: 0.5,
        marginBottom: '16px',
      }}>
        {totalCu.toLocaleString()} total CU across {cuUsage.length} instruction(s)
        &nbsp;·&nbsp;
        <span style={{ color: colors.success }}>■</span> &lt;50%
        &nbsp;
        <span style={{ color: colors.warning }}>■</span> 50–80%
        &nbsp;
        <span style={{ color: colors.error }}>■</span> &gt;80%
      </div>

      {cuUsage.map((entry) => (
        <CuBar key={entry.instructionIndex} entry={entry} />
      ))}
    </div>
  )
}
