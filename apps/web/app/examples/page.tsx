'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LyktaLogo from '@/components/LyktaLogo'

// ── Types ─────────────────────────────────────────────────────────────────────

type Cluster = 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet'

interface Example {
  title: string
  description: string
  signature: string
  cluster: Cluster
  category: string
  status: 'success' | 'failed'
  error?: string
  highlight: string
  programs: string[]
  compute: number
  computeBudget: number
  fee: string
  cpiDepth: number
}

// ── Example data ──────────────────────────────────────────────────────────────

const EXAMPLES: Example[] = [
  {
    title: 'Jupiter V6 Multi-hop Swap',
    description:
      'A 3-hop SOL → USDC → JUP → BONK swap routed through Whirlpool and Raydium AMMs, demonstrating deep CPI nesting and multi-token balance changes.',
    signature: '5KtPn1LmX9vQrT8wNpJk4eY2MdCzHbRsAoFgUiXc3Vq7WsEjLaDhTmPbNkYcFvGxQrZuIoSeMdCaKwXtBpHjR8',
    cluster: 'mainnet-beta',
    category: 'DeFi',
    status: 'success',
    highlight: '3-hop route, 4 CPI levels deep',
    programs: ['Jupiter v6', 'Whirlpool', 'Raydium', 'Token Program'],
    compute: 148203,
    computeBudget: 200000,
    fee: '0.000025 SOL',
    cpiDepth: 4,
  },
  {
    title: 'SPL Token Transfer',
    description:
      'A simple USDC transfer between two wallets, showing the minimal anatomy of an SPL token transfer: one instruction, two token accounts, one authority signer.',
    signature: 'A1BcDeFgHiJkLmNoPqRsTuVwXyZ2345678abcdefghij9KlMnOpQrStUvWxYz1234567890ABCDE',
    cluster: 'mainnet-beta',
    category: 'Token Transfer',
    status: 'success',
    highlight: 'Minimal token transfer anatomy',
    programs: ['Token Program'],
    compute: 4421,
    computeBudget: 200000,
    fee: '0.000005 SOL',
    cpiDepth: 1,
  },
  {
    title: 'Metaplex NFT Mint',
    description:
      'Minting a compressed NFT via Bubblegum with concurrent Merkle tree update. Demonstrates the account diff complexity of NFT mints and Metaplex metadata CPI calls.',
    signature: 'Zx9WqAbCdEfGhIjKlMnOpQrStUvWx1234YzABCDEFGHIJKLMNOPQRSTUVWXYZ567890abcdefgh',
    cluster: 'mainnet-beta',
    category: 'NFT',
    status: 'success',
    highlight: 'Compressed NFT + Merkle tree update',
    programs: ['Bubblegum', 'Token Metadata', 'Token Program', 'SPL Account Compression'],
    compute: 67840,
    computeBudget: 200000,
    fee: '0.000010 SOL',
    cpiDepth: 3,
  },
  {
    title: 'InsufficientFundsForRent Error',
    description:
      'A token transfer that fails because the destination account would drop below the rent-exempt minimum. Shows how Lykta traces errors to the exact instruction and explains the fix.',
    signature: 'devRentErr1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12',
    cluster: 'devnet',
    category: 'Error',
    status: 'failed',
    error: 'InsufficientFundsForRent',
    highlight: 'Error traced to instruction #2',
    programs: ['Token Program'],
    compute: 3100,
    computeBudget: 200000,
    fee: '0.000005 SOL',
    cpiDepth: 1,
  },
  {
    title: 'Anchor PDA Constraint Violation',
    description:
      'An Anchor program call that fails with a ConstraintSeeds error because the PDA derivation does not match the expected seeds. Demonstrates Anchor error code resolution from the IDL.',
    signature: 'devAnchorErr7890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
    cluster: 'devnet',
    category: 'Error',
    status: 'failed',
    error: 'ConstraintSeeds (2006)',
    highlight: 'Anchor error resolved from IDL',
    programs: ['Custom Anchor Program', 'System Program'],
    compute: 12045,
    computeBudget: 200000,
    fee: '0.000005 SOL',
    cpiDepth: 2,
  },
  {
    title: 'Marinade Liquid Staking',
    description:
      'A stake deposit into Marinade Finance, covering the full lifecycle: SOL deposit, mSOL mint via CPI, and stake account creation — 6 programs invoked across 3 CPI levels.',
    signature: 'MarinadeStake123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    cluster: 'mainnet-beta',
    category: 'DeFi',
    status: 'success',
    highlight: '6 programs, mSOL minted',
    programs: ['Marinade', 'Stake Program', 'System Program', 'Token Program'],
    compute: 89301,
    computeBudget: 200000,
    fee: '0.000015 SOL',
    cpiDepth: 3,
  },
  {
    title: 'Realms Governance Vote',
    description:
      'Casting a vote on a Realms DAO proposal — shows the governance CPI chain, voter weight record updates, and the account diffs for the governance token lock.',
    signature: 'RealmsVote1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12',
    cluster: 'mainnet-beta',
    category: 'Governance',
    status: 'success',
    highlight: 'DAO vote with weight record update',
    programs: ['SPL Governance', 'Token Program', 'System Program'],
    compute: 34702,
    computeBudget: 200000,
    fee: '0.000010 SOL',
    cpiDepth: 2,
  },
  {
    title: 'Jito Bundle with 4 Transactions',
    description:
      'A complex arbitrage bundle submitted through Jito MEV infrastructure. Demonstrates CPI depth of 5, multiple simultaneous token diffs, and compute budget optimisation.',
    signature: 'JitoBundle567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
    cluster: 'mainnet-beta',
    category: 'Complex CPI',
    status: 'success',
    highlight: 'CPI depth 5, MEV bundle',
    programs: ['Jupiter v6', 'Orca', 'Raydium', 'Token Program', 'Jito Tip'],
    compute: 192400,
    computeBudget: 200000,
    fee: '0.002500 SOL',
    cpiDepth: 5,
  },
  {
    title: 'Token Account Close',
    description:
      'Closing an empty BONK token account to reclaim its rent lamports. A simple but common operation — shows the token diff event type "close" and the lamport recovery in account diffs.',
    signature: 'TokenClose90abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
    cluster: 'mainnet-beta',
    category: 'Token Transfer',
    status: 'success',
    highlight: 'Rent reclaim on account close',
    programs: ['Token Program'],
    compute: 2900,
    computeBudget: 200000,
    fee: '0.000005 SOL',
    cpiDepth: 1,
  },
]

const CATEGORIES = ['All', 'DeFi', 'Token Transfer', 'NFT', 'Error', 'Complex CPI', 'Governance']

// ── ExampleCard ───────────────────────────────────────────────────────────────

function ExampleCard({ ex }: { ex: Example }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)

  function handleClick() {
    if (ex.cluster !== 'mainnet-beta') {
      router.push(`/tx/${ex.signature}?cluster=${ex.cluster}`)
    } else {
      router.push(`/tx/${ex.signature}`)
    }
  }

  const computePct = Math.round((ex.compute / ex.computeBudget) * 100)

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--bg-2)' : 'var(--bg-1)',
        border: hovered ? '1px solid var(--border-2)' : '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 8px 24px var(--shadow)' : 'none',
        transition: 'all 0.18s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Compute bar */}
      <div style={{ height: 3, background: 'var(--bg-base)' }}>
        <div
          style={{
            height: '100%',
            width: `${computePct}%`,
            background: 'linear-gradient(90deg, var(--green), var(--cyan))',
            opacity: 0.7,
          }}
        />
      </div>

      <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top row: badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Status badge */}
            <span
              style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 11.5,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                background:
                  ex.status === 'success'
                    ? 'color-mix(in oklch, var(--green) 12%, transparent)'
                    : 'color-mix(in oklch, var(--red) 12%, transparent)',
                color: ex.status === 'success' ? 'var(--green)' : 'var(--red)',
                border: `1px solid ${
                  ex.status === 'success'
                    ? 'color-mix(in oklch, var(--green) 30%, transparent)'
                    : 'color-mix(in oklch, var(--red) 30%, transparent)'
                }`,
              }}
            >
              {ex.status === 'success' ? '✓ Success' : '✗ Failed'}
            </span>
            {/* Cluster badge */}
            {ex.cluster !== 'mainnet-beta' && (
              <span
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 10.5,
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-3)',
                }}
              >
                {ex.cluster}
              </span>
            )}
          </div>
          {/* Category badge */}
          <span
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 11.5,
              padding: '2px 8px',
              borderRadius: 4,
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              color: 'var(--text-3)',
            }}
          >
            {ex.category}
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontWeight: 700,
            fontSize: 16,
            color: 'var(--text-1)',
            marginBottom: 7,
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
          }}
        >
          {ex.title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontFamily: 'var(--font-dm-sans), sans-serif',
            fontSize: 13.5,
            color: 'var(--text-2)',
            lineHeight: 1.65,
            marginBottom: 12,
            flex: 1,
          }}
        >
          {ex.description}
        </p>

        {/* Error badge */}
        {ex.error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'color-mix(in oklch, var(--red) 8%, transparent)',
              borderLeft: '2px solid var(--red)',
              borderRadius: '0 4px 4px 0',
              padding: '6px 10px',
              marginBottom: 12,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 12,
              color: 'var(--red)',
            }}
          >
            {ex.error}
          </div>
        )}

        {/* Highlight chip */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--green)',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 12.5,
              color: 'var(--text-2)',
            }}
          >
            {ex.highlight}
          </span>
        </div>

        {/* Program tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {ex.programs.map((prog) => (
            <span
              key={prog}
              style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 11.5,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                color: 'var(--text-3)',
              }}
            >
              {prog}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 11,
              color: 'var(--text-3)',
            }}
          >
            <span>
              <span style={{ letterSpacing: '0.05em' }}>COMPUTE</span>{' '}
              <span style={{ color: 'var(--text-2)' }}>{ex.compute.toLocaleString('en-US')}</span>
            </span>
            <span>
              <span style={{ letterSpacing: '0.05em' }}>FEE</span>{' '}
              <span style={{ color: 'var(--text-2)' }}>{ex.fee}</span>
            </span>
            <span>
              <span style={{ letterSpacing: '0.05em' }}>CPI DEPTH</span>{' '}
              <span style={{ color: 'var(--text-2)' }}>{ex.cpiDepth}</span>
            </span>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontWeight: 600,
              fontSize: 13,
              color: hovered ? 'var(--green)' : 'var(--text-3)',
              transition: 'color 0.15s',
            }}
          >
            Analyze →
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Page component ────────────────────────────────────────────────────────────

export default function ExamplesPage() {
  const router = useRouter()
  const [animIn, setAnimIn] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    const t = setTimeout(() => setAnimIn(true), 50)
    return () => clearTimeout(t)
  }, [])

  const filtered = EXAMPLES.filter((ex) => {
    const matchesCategory = activeCategory === 'All' || ex.category === activeCategory
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      ex.title.toLowerCase().includes(q) ||
      ex.description.toLowerCase().includes(q) ||
      ex.programs.some((p) => p.toLowerCase().includes(q)) ||
      ex.category.toLowerCase().includes(q)
    return matchesCategory && matchesSearch
  })

  return (
    <div style={{ color: 'var(--text-1)', minHeight: '100vh' }}>
      {/* NAV */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(1.5rem, 4vw, 3rem)',
          height: 60,
          borderBottom: '1px solid var(--border)',
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LyktaLogo small />
          <span
            style={{
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: '-0.02em',
              color: 'var(--text-1)',
            }}
          >
            Lykta
          </span>
          <span style={{ color: 'var(--border-2)', margin: '0 4px' }}>/</span>
          <span
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 14,
              color: 'var(--text-2)',
            }}
          >
            Examples
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '6px 14px',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 13.5,
              color: 'var(--text-2)',
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
          <button
            onClick={() => router.push('/tutorial')}
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '6px 14px',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 13.5,
              color: 'var(--text-2)',
              cursor: 'pointer',
            }}
          >
            Tutorial
          </button>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'var(--green)',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontWeight: 600,
              fontSize: 13.5,
              color: 'var(--bg-base)',
              cursor: 'pointer',
            }}
          >
            Open App →
          </button>
        </div>
      </nav>

      {/* PAGE BODY */}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: 'clamp(2.5rem,5vw,4rem) clamp(1.5rem,4vw,3rem)',
          opacity: animIn ? 1 : 0,
          transform: animIn ? 'none' : 'translateY(14px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 12.5,
              fontWeight: 700,
              color: 'var(--green)',
              letterSpacing: '0.12em',
              marginBottom: 12,
            }}
          >
            CURATED TRANSACTIONS
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              color: 'var(--text-1)',
              letterSpacing: '-0.035em',
              marginBottom: 12,
              lineHeight: 1.1,
            }}
          >
            Example analyses
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 15.5,
              color: 'var(--text-2)',
              maxWidth: 560,
              lineHeight: 1.65,
            }}
          >
            Hand-picked transactions that showcase every Lykta capability — from simple token
            transfers to complex multi-hop DeFi swaps and failed transactions with error traces.
          </p>
        </div>

        {/* Filters row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 28,
            flexWrap: 'wrap',
          }}
        >
          {/* Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '7px 12px',
              width: 180,
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              style={{ color: 'var(--text-3)', flexShrink: 0 }}
            >
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 13.5,
                color: 'var(--text-1)',
                width: '100%',
              }}
            />
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '5px 13px',
                    borderRadius: 100,
                    border: `1px solid ${active ? 'var(--green)' : 'var(--border)'}`,
                    background: active ? 'var(--green)' : 'var(--bg-2)',
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? 'var(--bg-base)' : 'var(--text-2)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>

          {/* Result count */}
          <span
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 12.5,
              color: 'var(--text-3)',
              whiteSpace: 'nowrap',
              marginLeft: 'auto',
            }}
          >
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Card grid */}
        {filtered.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 16,
            }}
          >
            {filtered.map((ex) => (
              <ExampleCard key={ex.signature} ex={ex} />
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              color: 'var(--text-3)',
              fontSize: 15,
            }}
          >
            No examples match your search.
          </div>
        )}
      </div>
    </div>
  )
}
