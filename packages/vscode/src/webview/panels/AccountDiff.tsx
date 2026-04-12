interface AccountDiff {
  address: string
  lamports: { pre: number; post: number; delta: number }
  tokenBalance?: {
    mint: string
    pre: string
    post: string
    delta: string
    decimals: number
  }
}

interface TokenDiff {
  accountIndex: number
  address: string
  mint: string
  owner: string
  decimals: number
  uiDelta: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(addr: string): string {
  return `${addr.slice(0, 8)}…${addr.slice(-8)}`
}

function lamportsToSol(lamports: number): string {
  return (lamports / 1e9).toFixed(9)
}

function deltaColor(delta: number): string {
  if (delta > 0) return '#4ade80'
  if (delta < 0) return '#f87171'
  return 'var(--vscode-descriptionForeground)'
}

function formatDelta(delta: number): string {
  if (delta > 0) return `+${lamportsToSol(delta)}`
  if (delta < 0) return `−${lamportsToSol(Math.abs(delta))}`
  return '0'
}

function uiDeltaColor(uiDelta: string): string {
  const n = parseFloat(uiDelta)
  if (n > 0) return '#4ade80'
  if (n < 0) return '#f87171'
  return 'var(--vscode-descriptionForeground)'
}

// ── Shared table styles ───────────────────────────────────────────────────────

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '11px',
  fontFamily: 'var(--vscode-editor-font-family)',
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '4px 8px',
  borderBottom: '1px solid var(--vscode-panel-border)',
  opacity: 0.5,
  fontWeight: 600,
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const tdStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderBottom: '1px solid var(--vscode-panel-border)',
  verticalAlign: 'middle',
}

const sectionLabel: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  opacity: 0.45,
  padding: '16px 8px 6px',
}

// ── SOL diff table ────────────────────────────────────────────────────────────

function SolDiffTable({ diffs }: { diffs: AccountDiff[] }) {
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>Account</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Pre (SOL)</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Post (SOL)</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Δ</th>
        </tr>
      </thead>
      <tbody>
        {diffs.map((d) => (
          <tr key={d.address}>
            <td style={tdStyle} title={d.address}>
              {truncate(d.address)}
            </td>
            <td style={{ ...tdStyle, textAlign: 'right', opacity: 0.7 }}>
              {lamportsToSol(d.lamports.pre)}
            </td>
            <td style={{ ...tdStyle, textAlign: 'right', opacity: 0.7 }}>
              {lamportsToSol(d.lamports.post)}
            </td>
            <td style={{
              ...tdStyle,
              textAlign: 'right',
              color: deltaColor(d.lamports.delta),
              fontWeight: d.lamports.delta !== 0 ? 600 : 400,
            }}>
              {formatDelta(d.lamports.delta)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Token diff table ──────────────────────────────────────────────────────────

function TokenDiffTable({ diffs }: { diffs: TokenDiff[] }) {
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>Account</th>
          <th style={thStyle}>Mint</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Δ Tokens</th>
        </tr>
      </thead>
      <tbody>
        {diffs.map((d) => (
          <tr key={d.address}>
            <td style={tdStyle} title={d.address}>
              {truncate(d.address)}
            </td>
            <td style={{ ...tdStyle, opacity: 0.6 }} title={d.mint}>
              {truncate(d.mint)}
            </td>
            <td style={{
              ...tdStyle,
              textAlign: 'right',
              color: uiDeltaColor(d.uiDelta),
              fontWeight: parseFloat(d.uiDelta) !== 0 ? 600 : 400,
            }}>
              {parseFloat(d.uiDelta) > 0 ? `+${d.uiDelta}` : d.uiDelta}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function AccountDiffPanel({
  accountDiffs,
  tokenDiffs,
}: {
  accountDiffs: AccountDiff[]
  tokenDiffs: TokenDiff[]
}) {
  if (accountDiffs.length === 0 && tokenDiffs.length === 0) {
    return (
      <div style={{ padding: '24px', opacity: 0.5, fontSize: '12px' }}>
        No account changes recorded for this transaction.
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 0' }}>
      {accountDiffs.length > 0 && (
        <>
          <div style={sectionLabel}>SOL Balances</div>
          <SolDiffTable diffs={accountDiffs} />
        </>
      )}

      {tokenDiffs.length > 0 && (
        <>
          <div style={sectionLabel}>Token Balances</div>
          <TokenDiffTable diffs={tokenDiffs} />
        </>
      )}
    </div>
  )
}
