import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { CpiTreePanel } from './panels/CpiTree.js'
import { AccountDiffPanel } from './panels/AccountDiff.js'
import { ComputeMeterPanel } from './panels/ComputeMeter.js'
import { ErrorPanel } from './panels/ErrorPanel.js'
import { colors } from './theme.js'

// ── Types (mirrored from @lykta/core — no imports allowed in the webview bundle) ──

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

interface CuUsage {
  instructionIndex: number
  programId: string
  consumed: number
  limit: number
  percentUsed: number
  isOverBudget?: boolean
}

interface TokenDiff {
  accountIndex: number
  address: string
  mint: string
  owner: string
  decimals: number
  uiDelta: string
}

interface LyktaError {
  code: number | string
  programId: string
  name?: string
  message: string
  suggestion?: string
}

interface LyktaTransaction {
  signature: string
  slot: number
  blockTime: number | null
  success: boolean
  fee: number
  cpiTree: CpiNode[]
  accountDiffs: AccountDiff[]
  tokenDiffs: TokenDiff[]
  cuUsage: CuUsage[]
  totalCu: number
  error?: LyktaError
}

type WebviewMessage =
  | { type: 'loading' }
  | { type: 'decoded'; data: LyktaTransaction }
  | { type: 'error'; message: string }

type Tab = 'cpi' | 'diff' | 'compute' | 'error'

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  root: {
    fontFamily: 'var(--vscode-font-family)',
    fontSize: 'var(--vscode-font-size)',
    color: 'var(--vscode-foreground)',
    background: 'var(--vscode-editor-background)',
    minHeight: '100vh',
    padding: '0',
  } as React.CSSProperties,

  header: {
    padding: '12px 16px 0',
    borderBottom: '1px solid var(--vscode-panel-border)',
  } as React.CSSProperties,

  sigLine: {
    fontSize: '11px',
    opacity: 0.6,
    marginBottom: '8px',
    fontFamily: 'var(--vscode-editor-font-family)',
  } as React.CSSProperties,

  statusBadge: (success: boolean): React.CSSProperties => ({
    display: 'inline-block',
    padding: '1px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 600,
    marginRight: '8px',
    background: success ? colors.successBg : colors.errorBg,
    color: success ? colors.success : colors.error,
  }),

  tabs: {
    display: 'flex',
    gap: '2px',
    marginTop: '8px',
  } as React.CSSProperties,

  tab: (active: boolean): React.CSSProperties => ({
    padding: '5px 14px',
    border: 'none',
    borderBottom: active
      ? '2px solid var(--vscode-focusBorder)'
      : '2px solid transparent',
    background: 'transparent',
    color: active ? 'var(--vscode-foreground)' : 'var(--vscode-descriptionForeground)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: active ? 600 : 400,
  }),

  panel: {
    padding: '16px',
  } as React.CSSProperties,

  centered: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '40px 24px',
    opacity: 0.7,
  } as React.CSSProperties,
}

// ── Placeholder panels (replaced in Steps 3–6) ───────────────────────────────





// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [phase, setPhase] = useState<'loading' | 'decoded' | 'error'>('loading')
  const [tx, setTx] = useState<LyktaTransaction | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [activeTab, setActiveTab] = useState<Tab>('cpi')

  useEffect(() => {
    function handleMessage(event: MessageEvent<WebviewMessage>) {
      const msg = event.data
      switch (msg.type) {
        case 'loading':
          setPhase('loading')
          setTx(null)
          break
        case 'decoded':
          setTx(msg.data)
          setPhase('decoded')
          // If the transaction failed, default to the Error tab.
          setActiveTab(msg.data.success ? 'cpi' : 'error')
          break
        case 'error':
          setErrorMsg(msg.message)
          setPhase('error')
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (phase === 'loading') {
    return (
      <div style={S.root}>
        <div style={S.centered}>
          <span style={{ fontSize: '18px' }}>⏳</span>
          <span>Fetching transaction…</span>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div style={S.root}>
        <div style={{ padding: '24px' }}>
          <p style={{ color: colors.error, marginBottom: '8px', fontWeight: 600 }}>
            ✗ Failed to decode transaction
          </p>
          <pre style={{
            background: 'var(--vscode-textBlockQuote-background)',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            {errorMsg}
          </pre>
        </div>
      </div>
    )
  }

  // phase === 'decoded'
  const decoded = tx!
  const tabs: { id: Tab; label: string }[] = [
    { id: 'cpi',     label: 'CPI Tree' },
    { id: 'diff',    label: 'Account Diff' },
    { id: 'compute', label: 'Compute Meter' },
    { id: 'error',   label: 'Error' },
  ]

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.sigLine}>
          {decoded.signature} &nbsp;·&nbsp; slot {decoded.slot}
          {decoded.blockTime ? ` · ${new Date(decoded.blockTime * 1000).toUTCString()}` : ''}
        </div>
        <div>
          <span style={S.statusBadge(decoded.success)}>
            {decoded.success ? '✓ Success' : '✗ Failed'}
          </span>
          <span style={{ fontSize: '11px', opacity: 0.6 }}>
            {(decoded.fee / 1e9).toFixed(6)} SOL fee &nbsp;·&nbsp; {decoded.totalCu.toLocaleString()} CU
          </span>
        </div>
        <div style={S.tabs}>
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              style={S.tab(activeTab === id)}
              onClick={() => setActiveTab(id)}
            >
              {label}
              {id === 'error' && decoded.error && (
                <span style={{
                  marginLeft: '5px',
                  background: colors.errorBg,
                  color: colors.error,
                  borderRadius: '8px',
                  padding: '0 5px',
                  fontSize: '10px',
                }}>!</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'cpi'     && <CpiTreePanel cpiTree={decoded.cpiTree} />}
      {activeTab === 'diff'    && <AccountDiffPanel accountDiffs={decoded.accountDiffs} tokenDiffs={decoded.tokenDiffs} />}
      {activeTab === 'compute' && <ComputeMeterPanel cuUsage={decoded.cuUsage} totalCu={decoded.totalCu} />}
      {activeTab === 'error'   && <ErrorPanel error={decoded.error} />}
    </div>
  )
}

// ── Mount ─────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(<App />)
