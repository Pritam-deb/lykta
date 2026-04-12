interface LyktaError {
  code: number | string
  programId: string
  name?: string
  message: string
  suggestion?: string
}

import { colors } from '../theme.js'

function truncate(addr: string): string {
  return `${addr.slice(0, 8)}…${addr.slice(-8)}`
}

export function ErrorPanel({ error }: { error: LyktaError | undefined }) {
  if (!error) {
    return (
      <div style={{ padding: '24px', opacity: 0.5, fontSize: '12px' }}>
        No errors — transaction succeeded.
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Badge row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{
          background: colors.errorBg,
          color: colors.error,
          borderRadius: '4px',
          padding: '2px 10px',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.04em',
        }}>
          {error.name ?? 'Custom Error'}
        </span>
        <span style={{
          background: 'var(--vscode-textBlockQuote-background)',
          borderRadius: '4px',
          padding: '2px 8px',
          fontSize: '11px',
          fontFamily: 'var(--vscode-editor-font-family)',
          opacity: 0.8,
        }}>
          code {typeof error.code === 'number'
            ? `${error.code} (0x${error.code.toString(16).toUpperCase()})`
            : error.code}
        </span>
      </div>

      {/* Program */}
      <div style={{ fontSize: '11px' }}>
        <span style={{ opacity: 0.45, marginRight: '6px' }}>Program</span>
        <span
          style={{ fontFamily: 'var(--vscode-editor-font-family)', opacity: 0.85 }}
          title={error.programId}
        >
          {truncate(error.programId)}
        </span>
      </div>

      {/* Error message */}
      <div>
        <div style={{
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          opacity: 0.45,
          marginBottom: '6px',
        }}>
          Message
        </div>
        <pre style={{
          margin: 0,
          padding: '10px 12px',
          background: 'var(--vscode-textBlockQuote-background)',
          borderRadius: '4px',
          fontSize: '11px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          borderLeft: `3px solid ${colors.errorBorder}`,
        }}>
          {error.message}
        </pre>
      </div>

      {/* AI suggestion */}
      {error.suggestion && (
        <div>
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            opacity: 0.45,
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}>
            <span>✦</span>
            <span>AI Suggestion</span>
          </div>
          <div style={{
            padding: '10px 12px',
            background: 'var(--vscode-textBlockQuote-background)',
            borderRadius: '4px',
            fontSize: '12px',
            lineHeight: '1.6',
            borderLeft: `3px solid ${colors.accentBorder}`,
          }}>
            {error.suggestion}
          </div>
        </div>
      )}
    </div>
  )
}
