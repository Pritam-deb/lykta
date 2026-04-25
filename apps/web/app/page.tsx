'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LyktaLogo from '@/components/LyktaLogo'

const FEATURES = [
  {
    icon: '⬡',
    label: 'CPI Call Graph',
    desc: 'Visualize the full cross-program invocation tree. See every program call, depth, and execution path.',
  },
  {
    icon: '◈',
    label: 'Decoded Instructions',
    desc: 'Human-readable instruction data. Deserialized arguments, program IDs, and signer accounts.',
  },
  {
    icon: '⊕',
    label: 'Account Diffs',
    desc: 'Before and after state for every account touched. Lamport changes, owner shifts, data mutations.',
  },
  {
    icon: '◎',
    label: 'Token Diffs',
    desc: 'Token balance changes at a glance. Mint, burn, transfer, and close events across all SPL tokens.',
  },
  {
    icon: '▣',
    label: 'Compute Telemetry',
    desc: 'Per-instruction compute unit breakdown. Identify bottlenecks before they hit mainnet limits.',
  },
  {
    icon: '◬',
    label: 'Error Intelligence',
    desc: 'Plain-language failure explanations. Trace errors back to the exact instruction and cause.',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Paste a signature',
    body: 'Drop any transaction signature — mainnet, devnet, testnet, or localnet. Lykta fetches and parses it instantly.',
  },
  {
    n: '02',
    title: 'Inspect everything',
    body: 'CPI graph, decoded args, compute breakdown, account diffs, and token movements — all in one unified workspace.',
  },
  {
    n: '03',
    title: 'Share your analysis',
    body: 'Every analysis lives at a stable URL. Share with your team, link in issues, attach to audit reports.',
  },
]

function CPIPreview() {
  const nodes = [
    { label: 'Jupiter Aggregator v6', depth: 0, call: null, idx: 0 },
    { label: 'Token Program', depth: 1, call: 'transfer', idx: 1 },
    { label: 'Whirlpool Program', depth: 1, call: 'swap', idx: 2 },
    { label: 'Token Program', depth: 2, call: 'transfer', idx: 3 },
    { label: 'Token Program', depth: 2, call: 'transfer', idx: 4 },
    { label: 'Token Program', depth: 1, call: 'closeAccount', idx: 5 },
  ]
  return (
    <div
      style={{ padding: 24, fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 12.5 }}
    >
      <p style={{ color: 'var(--text-3)', fontSize: 11, letterSpacing: '0.1em', marginBottom: 16 }}>
        CPI CALL GRAPH
      </p>
      {nodes.map((n, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingLeft: n.depth * 24,
            marginBottom: 10,
          }}
        >
          <span style={{ color: 'var(--text-3)', fontSize: 11 }}>
            {n.depth > 0
              ? i < nodes.length - 1 && (nodes[i + 1]?.depth ?? 0) >= n.depth
                ? '├──'
                : '└──'
              : ''}
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg-3)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '5px 10px',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--green)',
                flexShrink: 0,
                display: 'inline-block',
              }}
            />
            <span style={{ color: 'var(--text-1)', fontSize: 12 }}>{n.label}</span>
            {n.call && <span style={{ color: 'var(--text-3)', fontSize: 11 }}>· {n.call}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

function ComputePreview() {
  const items = [
    { label: 'Jupiter Aggregator v6', cu: 48203, max: 200000 },
    { label: 'Whirlpool Program', cu: 28100, max: 200000 },
    { label: 'Token Program (×3)', cu: 9600, max: 200000 },
  ]
  return (
    <div style={{ padding: 24 }}>
      <p
        style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          color: 'var(--text-3)',
          fontSize: 11,
          letterSpacing: '0.1em',
          marginBottom: 20,
        }}
      >
        COMPUTE UNITS
      </p>
      <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
        {[
          ['48,203', 'consumed'],
          ['200,000', 'budget'],
          ['24.1%', 'utilization'],
        ].map(([v, l]) => (
          <div key={l}>
            <div
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--cyan)',
                letterSpacing: '-0.02em',
              }}
            >
              {v}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 11,
                color: 'var(--text-3)',
                marginTop: 2,
              }}
            >
              {l}
            </div>
          </div>
        ))}
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span
              style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 12.5,
                color: 'var(--text-2)',
              }}
            >
              {item.label}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 12,
                color: 'var(--text-1)',
              }}
            >
              {item.cu.toLocaleString()} CU
            </span>
          </div>
          <div
            style={{ height: 6, background: 'var(--bg-base)', borderRadius: 3, overflow: 'hidden' }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 3,
                width: `${(item.cu / item.max) * 100}%`,
                background: 'linear-gradient(90deg, var(--cyan), var(--green))',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function DiffPreview() {
  const rows = [
    { account: '7xKXtg…Qm2Z', before: '1.204832', after: '1.203827', delta: '-0.001005' },
    { account: 'So1111…1112', before: '0.000000', after: '0.001000', delta: '+0.001000' },
    { account: 'EPjFWd…7GDJ', before: '100.00', after: '0.00', delta: '-100.00' },
  ]
  return (
    <div style={{ padding: 24 }}>
      <p
        style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          color: 'var(--text-3)',
          fontSize: 11,
          letterSpacing: '0.1em',
          marginBottom: 16,
        }}
      >
        ACCOUNT DIFFS
      </p>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 12,
        }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Account', 'Before', 'After', 'Δ'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '4px 8px 8px',
                  textAlign: 'left',
                  color: 'var(--text-3)',
                  fontWeight: 500,
                  fontSize: 11,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '8px', color: 'var(--text-2)' }}>{r.account}</td>
              <td style={{ padding: '8px', color: 'var(--text-2)' }}>{r.before}</td>
              <td style={{ padding: '8px', color: 'var(--text-2)' }}>{r.after}</td>
              <td
                style={{
                  padding: '8px',
                  color: r.delta.startsWith('+') ? 'var(--green)' : 'var(--red)',
                  fontWeight: 600,
                }}
              >
                {r.delta}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ErrorPreview() {
  return (
    <div style={{ padding: 24 }}>
      <p
        style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          color: 'var(--text-3)',
          fontSize: 11,
          letterSpacing: '0.1em',
          marginBottom: 16,
        }}
      >
        ERROR ANALYSIS
      </p>
      <div
        style={{
          background: 'var(--bg-base)',
          border: '1px solid var(--red)',
          borderLeft: '3px solid var(--red)',
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ marginBottom: 10 }}>
          <span
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 11,
              color: 'var(--red)',
              background: 'color-mix(in oklch, var(--red) 12%, transparent)',
              padding: '2px 8px',
              borderRadius: 4,
            }}
          >
            InsufficientFundsForRent
          </span>
        </div>
        <p
          style={{
            fontFamily: 'var(--font-dm-sans), sans-serif',
            fontSize: 13.5,
            color: 'var(--text-1)',
            lineHeight: 1.6,
            marginBottom: 12,
          }}
        >
          The destination account does not hold enough SOL to remain rent-exempt after this
          transfer.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-dm-sans), sans-serif',
            fontSize: 13,
            color: 'var(--text-2)',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: 'var(--text-1)' }}>Fix:</strong> Ensure the recipient has at least{' '}
          <span
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--amber)' }}
          >
            0.00203928 SOL
          </span>{' '}
          remaining after the transfer.
        </p>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 11,
          color: 'var(--text-3)',
        }}
      >
        Failed at instruction <span style={{ color: 'var(--amber)' }}>#2</span> · Token Program ·
        transfer
      </div>
    </div>
  )
}

const OUTPUTS = [
  { tag: 'CPI Tree', color: 'var(--green)', Preview: CPIPreview },
  { tag: 'Compute', color: 'var(--cyan)', Preview: ComputePreview },
  { tag: 'Account Diffs', color: 'var(--amber)', Preview: DiffPreview },
  { tag: 'Error', color: 'var(--red)', Preview: ErrorPreview },
]

type Cluster = 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet'

const CLUSTERS: { value: Cluster; label: string }[] = [
  { value: 'mainnet-beta', label: 'Mainnet'  },
  { value: 'devnet',       label: 'Devnet'   },
  { value: 'testnet',      label: 'Testnet'  },
  { value: 'localnet',     label: 'Localnet' },
]

export default function HomePage() {
  const router = useRouter()
  const [sig, setSig] = useState('')
  const [focused, setFocused] = useState(false)
  const [animIn, setAnimIn] = useState(false)
  const [activeOutput, setActiveOutput] = useState(0)
  const [cluster, setCluster] = useState<Cluster>('mainnet-beta')

  useEffect(() => {
    const t = setTimeout(() => setAnimIn(true), 50)
    return () => clearTimeout(t)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = sig.trim()
    if (!trimmed) return
    const url = cluster === 'mainnet-beta' ? `/tx/${trimmed}` : `/tx/${trimmed}?cluster=${cluster}`
    router.push(url)
  }

  const ActivePreview = OUTPUTS[activeOutput]!.Preview

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', color: 'var(--text-1)' }}>
      {/* NAV */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(1.5rem, 5vw, 4rem)',
          height: 60,
          borderBottom: '1px solid var(--border)',
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LyktaLogo />
          <span
            style={{
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: '-0.02em',
              color: 'var(--text-1)',
            }}
          >
            Lykta
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {[
            { label: 'Docs', href: '/docs' },
            { label: 'Examples', href: '/examples' },
            { label: 'GitHub', href: 'https://github.com/Pritam-deb/lykta' },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              style={{
                fontSize: 13.5,
                color: 'var(--text-2)',
                textDecoration: 'none',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => {
                ;(e.target as HTMLElement).style.color = 'var(--text-1)'
              }}
              onMouseLeave={(e) => {
                ;(e.target as HTMLElement).style.color = 'var(--text-2)'
              }}
            >
              {l.label}
            </a>
          ))}
          <button
            onClick={() => document.getElementById('hero-input')?.focus()}
            style={{
              background: 'var(--green)',
              color: 'var(--bg-base)',
              border: 'none',
              borderRadius: 6,
              padding: '7px 16px',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontWeight: 600,
              fontSize: 13.5,
              cursor: 'pointer',
              letterSpacing: '0.01em',
            }}
          >
            Open App →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          paddingTop: 160,
          paddingBottom: 120,
          paddingLeft: 'clamp(1.5rem, 5vw, 4rem)',
          paddingRight: 'clamp(1.5rem, 5vw, 4rem)',
          maxWidth: 1200,
          margin: '0 auto',
          position: 'relative',
          opacity: animIn ? 1 : 0,
          transform: animIn ? 'none' : 'translateY(16px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 700,
            height: 400,
            background: 'radial-gradient(ellipse at center, var(--hero-glow) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', textAlign: 'center' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 100,
              padding: '5px 14px 5px 10px',
              marginBottom: 32,
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 12.5,
            }}
          >
            <span
              style={{
                background: 'var(--green)',
                color: 'var(--bg-base)',
                borderRadius: 100,
                padding: '1px 8px',
                fontWeight: 700,
                fontSize: 10.5,
                letterSpacing: '0.08em',
              }}
            >
              NEW
            </span>
            <span style={{ color: 'var(--text-2)' }}>Localnet support now available</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(2.8rem, 6vw, 5.5rem)',
              lineHeight: 1.04,
              letterSpacing: '-0.04em',
              color: 'var(--text-1)',
              marginBottom: 24,
            }}
          >
            Light inside every
            <br />
            <span style={{ color: 'var(--green)' }}>transaction.</span>
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: 'var(--text-2)',
              lineHeight: 1.7,
              maxWidth: 560,
              margin: '0 auto 48px',
              fontWeight: 400,
            }}
          >
            Decode any Solana transaction instantly. CPI graphs, compute telemetry, account diffs,
            and human-readable failure explanations — in one analysis workspace.
          </p>

          {/* Search form */}
          <form onSubmit={handleSubmit} style={{ maxWidth: 680, margin: '0 auto 16px' }}>
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-2)',
                border: `1.5px solid ${focused ? 'var(--green)' : 'var(--border-2)'}`,
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: focused ? '0 0 0 3px var(--green-glow)' : '0 2px 12px var(--shadow)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 16,
                  color: 'var(--text-3)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M10 10l3 3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <input
                id="hero-input"
                value={sig}
                onChange={(e) => setSig(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Paste a transaction signature…"
                spellCheck={false}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '16px 12px',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 13.5,
                  color: 'var(--text-1)',
                  letterSpacing: '0.01em',
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--green)',
                  color: 'var(--bg-base)',
                  border: 'none',
                  padding: '0 24px',
                  margin: 6,
                  borderRadius: 7,
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.01em',
                }}
              >
                Analyze →
              </button>
            </div>
          </form>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {CLUSTERS.map((c) => {
              const active = cluster === c.value
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCluster(c.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 14px',
                    borderRadius: 100,
                    border: `1px solid ${active ? 'var(--green)' : 'var(--border)'}`,
                    background: active ? 'color-mix(in oklch, var(--green) 12%, transparent)' : 'transparent',
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    fontSize: 12.5,
                    fontWeight: active ? 600 : 400,
                    color: active ? 'var(--green)' : 'var(--text-3)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: active ? 'var(--green)' : 'var(--text-3)',
                    display: 'inline-block', flexShrink: 0,
                  }} />
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Product preview */}
        <div
          style={{
            marginTop: 80,
            borderRadius: 14,
            border: '1px solid var(--border)',
            overflow: 'hidden',
            background: 'var(--bg-1)',
            boxShadow: '0 32px 80px var(--shadow-heavy)',
          }}
        >
          {/* Browser chrome */}
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-2)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', gap: 6 }}>
              {['var(--red)', '#F5A623', 'var(--green)'].map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: c,
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                flex: 1,
                background: 'var(--bg-base)',
                borderRadius: 5,
                padding: '3px 12px',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 11,
                color: 'var(--text-3)',
                maxWidth: 500,
                margin: '0 auto',
              }}
            >
              lykta.dev/tx/5KtPn1LmX9…8xQm2Z
            </div>
          </div>
          {/* Preview body */}
          <div style={{ padding: '20px 24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  background: 'color-mix(in oklch, var(--green) 12%, transparent)',
                  border: '1px solid color-mix(in oklch, var(--green) 30%, transparent)',
                  color: 'var(--green)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                ✓ Success
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 12,
                  color: 'var(--text-2)',
                }}
              >
                5KtPn1LmX9vQrT8…8xQm2Z
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  ['Block', '285,432,109'],
                  ['Fee', '0.000005 SOL'],
                  ['Compute', '48,203 CU'],
                ].map(([l, v]) => (
                  <div key={l} style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-dm-sans), sans-serif',
                        fontSize: 10.5,
                        color: 'var(--text-3)',
                      }}
                    >
                      {l}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-jetbrains-mono), monospace',
                        fontSize: 12.5,
                        color: 'var(--text-1)',
                      }}
                    >
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto' }}>
              {['CPI Tree', 'Instructions', 'Account Diffs', 'Token Diffs', 'Compute', 'Raw'].map(
                (t, i) => (
                  <div
                    key={t}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      fontSize: 12,
                      background: i === 0 ? 'var(--bg-3)' : 'transparent',
                      color: i === 0 ? 'var(--text-1)' : 'var(--text-3)',
                      border: i === 0 ? '1px solid var(--border-2)' : '1px solid transparent',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t}
                  </div>
                ),
              )}
            </div>
            <CPIPreview />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        style={{
          padding: 'clamp(4rem, 8vw, 8rem) clamp(1.5rem, 5vw, 4rem)',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 12.5,
              color: 'var(--green)',
              fontWeight: 700,
              letterSpacing: '0.12em',
              marginBottom: 12,
            }}
          >
            CAPABILITIES
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(1.8rem, 3vw, 2.8rem)',
              letterSpacing: '-0.03em',
              color: 'var(--text-1)',
              marginBottom: 16,
            }}
          >
            Every signal. One view.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 16,
              color: 'var(--text-2)',
              maxWidth: 480,
              margin: '0 auto',
              lineHeight: 1.65,
            }}
          >
            Lykta surfaces everything a developer, auditor, or protocol team needs to understand
            what a transaction actually did.
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 1,
            background: 'var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid var(--border)',
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-1)',
                padding: '32px 28px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.background = 'var(--bg-2)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.background = 'var(--bg-1)'
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'var(--bg-3)',
                  border: '1px solid var(--border-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  marginBottom: 20,
                  color: 'var(--green)',
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  fontWeight: 700,
                  fontSize: 16,
                  color: 'var(--text-1)',
                  marginBottom: 10,
                  letterSpacing: '-0.02em',
                }}
              >
                {f.label}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 14,
                  color: 'var(--text-2)',
                  lineHeight: 1.65,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        style={{
          padding: 'clamp(4rem, 8vw, 8rem) clamp(1.5rem, 5vw, 4rem)',
          maxWidth: 1200,
          margin: '0 auto',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 12.5,
              color: 'var(--cyan)',
              fontWeight: 700,
              letterSpacing: '0.12em',
              marginBottom: 12,
            }}
          >
            HOW IT WORKS
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(1.8rem, 3vw, 2.8rem)',
              letterSpacing: '-0.03em',
              color: 'var(--text-1)',
            }}
          >
            From signature to insight
            <br />
            in seconds.
          </h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 32,
          }}
        >
          {STEPS.map((s, i) => (
            <div key={i}>
              <div
                style={{
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  fontWeight: 700,
                  fontSize: 40,
                  color: 'var(--border-2)',
                  letterSpacing: '-0.04em',
                  marginBottom: 16,
                }}
              >
                {s.n}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  fontWeight: 700,
                  fontSize: 20,
                  color: 'var(--text-1)',
                  letterSpacing: '-0.02em',
                  marginBottom: 12,
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 15,
                  color: 'var(--text-2)',
                  lineHeight: 1.65,
                }}
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* OUTPUT SHOWCASE */}
      <section
        style={{
          padding: 'clamp(4rem, 8vw, 8rem) clamp(1.5rem, 5vw, 4rem)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-1)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 12.5,
                color: 'var(--amber)',
                fontWeight: 700,
                letterSpacing: '0.12em',
                marginBottom: 12,
              }}
            >
              OUTPUT PANELS
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontWeight: 700,
                fontSize: 'clamp(1.8rem, 3vw, 2.8rem)',
                letterSpacing: '-0.03em',
                color: 'var(--text-1)',
              }}
            >
              Built for deep inspection.
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
              {OUTPUTS.map((o, i) => (
                <button
                  key={i}
                  onClick={() => setActiveOutput(i)}
                  style={{
                    background: activeOutput === i ? 'var(--bg-3)' : 'transparent',
                    border: `1px solid ${activeOutput === i ? o.color : 'transparent'}`,
                    borderRadius: 8,
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: o.color,
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      fontWeight: 600,
                      fontSize: 14,
                      color: activeOutput === i ? 'var(--text-1)' : 'var(--text-2)',
                    }}
                  >
                    {o.tag}
                  </span>
                </button>
              ))}
            </div>
            <div
              style={{
                flex: 1,
                minHeight: 280,
                background: 'var(--bg-2)',
                borderRadius: 12,
                border: '1px solid var(--border)',
                overflow: 'hidden',
                minWidth: 300,
              }}
            >
              <ActivePreview />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: 'clamp(5rem, 10vw, 10rem) clamp(1.5rem, 5vw, 4rem)',
          textAlign: 'center',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 'clamp(3rem, 6vw, 6rem) clamp(2rem, 5vw, 5rem)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: -80,
              right: -80,
              width: 400,
              height: 400,
              background: 'radial-gradient(circle, var(--green-glow) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 12.5,
              color: 'var(--green)',
              fontWeight: 700,
              letterSpacing: '0.12em',
              marginBottom: 16,
            }}
          >
            FREE & OPEN SOURCE
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              letterSpacing: '-0.04em',
              color: 'var(--text-1)',
              marginBottom: 20,
            }}
          >
            Start debugging now.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 16,
              color: 'var(--text-2)',
              maxWidth: 440,
              margin: '0 auto 40px',
              lineHeight: 1.7,
            }}
          >
            No account required. Paste any signature and get a full analysis instantly.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
                setTimeout(() => document.getElementById('hero-input')?.focus(), 500)
              }}
              style={{
                background: 'var(--green)',
                color: 'var(--bg-base)',
                border: 'none',
                borderRadius: 8,
                padding: '13px 28px',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              Try Lykta →
            </button>
            <button
              style={{
                background: 'transparent',
                color: 'var(--text-1)',
                border: '1px solid var(--border-2)',
                borderRadius: 8,
                padding: '13px 28px',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
              }}
              onClick={() => window.open('https://github.com/Pritam-deb/lykta', '_blank')}
            >
              View on GitHub
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          padding: '24px clamp(1.5rem, 5vw, 4rem)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LyktaLogo small />
          <span
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 13,
              color: 'var(--text-3)',
            }}
          >
            Lykta — Solana Transaction Intelligence
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-dm-sans), sans-serif',
            fontSize: 12.5,
            color: 'var(--text-3)',
          }}
        >
          Open source · MIT License
        </span>
      </footer>
    </div>
  )
}
