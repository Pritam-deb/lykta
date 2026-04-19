'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LyktaLogo from '@/components/LyktaLogo'

// ── Primitive content components ──────────────────────────────────────────────

function P({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-dm-sans), sans-serif',
        fontSize: 15,
        color: 'var(--text-2)',
        lineHeight: 1.75,
        marginBottom: 18,
      }}
    >
      {children}
    </p>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: 'var(--font-space-grotesk), sans-serif',
        fontWeight: 700,
        fontSize: 16,
        color: 'var(--text-1)',
        marginTop: 32,
        marginBottom: 10,
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </h3>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre
      style={{
        background: 'var(--bg-base)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '14px 16px',
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 12.5,
        color: 'var(--text-1)',
        overflowX: 'auto',
        marginBottom: 18,
        lineHeight: 1.65,
      }}
    >
      {children}
    </pre>
  )
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 12.5,
        color: 'var(--cyan)',
        background: 'var(--bg-2)',
        borderRadius: 4,
        padding: '1px 6px',
      }}
    >
      {children}
    </code>
  )
}

function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, marginBottom: 18 }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            fontFamily: 'var(--font-dm-sans), sans-serif',
            fontSize: 15,
            color: 'var(--text-2)',
            lineHeight: 1.75,
            marginBottom: 8,
          }}
        >
          <span style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }}>›</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Callout({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div
      style={{
        borderLeft: `3px solid ${color}`,
        background: `color-mix(in oklch, ${color} 8%, transparent)`,
        borderRadius: '0 6px 6px 0',
        padding: '12px 16px',
        marginBottom: 18,
        fontFamily: 'var(--font-dm-sans), sans-serif',
        fontSize: 14,
        color: 'var(--text-2)',
        lineHeight: 1.65,
      }}
    >
      {children}
    </div>
  )
}

function Steps({ items }: { items: string[] }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'var(--green)',
              color: 'var(--bg-base)',
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            {i + 1}
          </div>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 15,
              color: 'var(--text-2)',
              lineHeight: 1.75,
              margin: 0,
            }}
          >
            {item}
          </p>
        </div>
      ))}
    </div>
  )
}

function FAQItem({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{
        borderBottom: '1px solid var(--border)',
        paddingBottom: open ? 16 : 0,
        marginBottom: 0,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '16px 0',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontWeight: 600,
            fontSize: 15,
            color: 'var(--text-1)',
            lineHeight: 1.4,
          }}
        >
          {q}
        </span>
        <span
          style={{
            color: 'var(--text-3)',
            fontSize: 18,
            lineHeight: 1,
            flexShrink: 0,
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            display: 'inline-block',
          }}
        >
          +
        </span>
      </button>
      {open && (
        <div
          style={{
            fontFamily: 'var(--font-dm-sans), sans-serif',
            fontSize: 14.5,
            color: 'var(--text-2)',
            lineHeight: 1.7,
            paddingBottom: 4,
          }}
        >
          {a}
        </div>
      )}
    </div>
  )
}

// ── Sidebar data ──────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    label: 'Getting Started',
    items: [
      { id: 'introduction', title: 'Introduction' },
      { id: 'quickstart', title: 'Quickstart' },
      { id: 'clusters', title: 'Supported Clusters' },
    ],
  },
  {
    label: 'Analysis Panels',
    items: [
      { id: 'cpi-tree', title: 'CPI Tree' },
      { id: 'instructions', title: 'Instructions' },
      { id: 'account-diffs', title: 'Account Diffs' },
      { id: 'token-diffs', title: 'Token Diffs' },
      { id: 'compute', title: 'Compute Telemetry' },
      { id: 'raw-json', title: 'Raw JSON' },
    ],
  },
  {
    label: 'Features',
    items: [
      { id: 'shareable-links', title: 'Shareable Links' },
      { id: 'error-explanations', title: 'Error Explanations' },
    ],
  },
  {
    label: 'Reference',
    items: [{ id: 'faq', title: 'FAQ' }],
  },
]

// Flat list for prev/next navigation
const ALL_ITEMS = SECTIONS.flatMap((s) => s.items.map((item) => ({ ...item, section: s.label })))

// ── Doc content ───────────────────────────────────────────────────────────────

type DocContent = {
  title: string
  body: () => React.ReactNode
}

const DOC_CONTENT: Record<string, DocContent> = {
  introduction: {
    title: 'Introduction',
    body: () => (
      <>
        <P>
          Lykta is a Solana transaction inspector built for developers, auditors, and protocol teams
          who need to understand exactly what a transaction did — not just whether it succeeded.
        </P>
        <P>
          Paste any transaction signature and Lykta fetches, parses, and renders a full analysis
          workspace: CPI call graph, decoded instruction arguments, compute unit breakdown, account
          state diffs, token balance changes, and plain-language error explanations.
        </P>
        <Callout color="var(--green)">
          Lykta works on mainnet-beta, devnet, testnet, and localnet. No account required — every
          analysis is available instantly at a stable, shareable URL.
        </Callout>
        <H3>Who is Lykta for?</H3>
        <UL
          items={[
            'Smart contract developers debugging failed transactions or verifying on-chain behaviour',
            'Protocol teams auditing cross-program invocation flows and compute usage',
            'Security researchers and auditors tracing exploit transactions post-incident',
            'DApp builders and integrators who need a quick human-readable view of any signature',
          ]}
        />
      </>
    ),
  },
  quickstart: {
    title: 'Quickstart',
    body: () => (
      <>
        <Steps
          items={[
            'Open Lykta at lykta.dev (or run it locally). The landing page shows a signature input field.',
            'Paste a Solana transaction signature into the input. Select the correct cluster using the cluster pills (mainnet-beta is selected by default).',
            'Press Analyze or hit Enter. Lykta will fetch and decode the transaction, then redirect you to the full analysis workspace.',
          ]}
        />
        <H3>Example signature</H3>
        <Code>{`5KtPn1LmX9vQrT8wNpJk4eY2MdCzHbRsAoFgUiXc3Vq\n  7WsEjLaDhTmPbNkYcFvGxQrZuIoSeMdCaKwXtBpHjR8`}</Code>
        <P>
          You can also navigate directly to a transaction by constructing the URL manually. For
          mainnet, the path is simply:
        </P>
        <Code>{`https://lykta.dev/tx/<signature>`}</Code>
        <P>
          For other clusters, append a <InlineCode>cluster</InlineCode> query parameter:
        </P>
        <Code>{`https://lykta.dev/tx/<signature>?cluster=devnet`}</Code>
      </>
    ),
  },
  clusters: {
    title: 'Supported Clusters',
    body: () => (
      <>
        <P>
          Lykta supports all four Solana network environments. The cluster determines which RPC
          endpoint is used to fetch transaction data.
        </P>
        <div style={{ overflowX: 'auto', marginBottom: 18 }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Cluster', 'URL parameter', 'Notes'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 12px 10px',
                      textAlign: 'left',
                      color: 'var(--text-3)',
                      fontWeight: 600,
                      fontSize: 12,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                [
                  'mainnet-beta',
                  '(omit parameter)',
                  'Default cluster. No query param needed in the URL.',
                ],
                ['devnet', 'cluster=devnet', 'Public devnet, faucet-funded test environment.'],
                ['testnet', 'cluster=testnet', 'Validator stress-testing network.'],
                [
                  'localnet',
                  'cluster=localnet',
                  'Connects to your local test validator on port 8899.',
                ],
              ].map(([cluster, param, note], i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <InlineCode>{cluster}</InlineCode>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>
                    <InlineCode>{param}</InlineCode>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout color="var(--amber)">
          Localnet requires a local Solana test validator running at{' '}
          <InlineCode>http://127.0.0.1:8899</InlineCode>. The Lykta web app must be running locally
          as well — the hosted version at lykta.dev cannot reach your machine&apos;s localhost.
        </Callout>
      </>
    ),
  },
  'cpi-tree': {
    title: 'CPI Tree',
    body: () => (
      <>
        <P>
          The CPI Tree panel renders the complete cross-program invocation graph for a transaction as
          an interactive tree. Each node represents a program invocation; edges represent parent–child
          call relationships.
        </P>
        <H3>Reading the tree</H3>
        <UL
          items={[
            'The root node is always the top-level instruction — the program invoked directly by the transaction.',
            'Child nodes are programs invoked via CPI from the parent. Indentation reflects nesting depth.',
            'Each node shows the program name (resolved from on-chain metadata where available) and the instruction discriminator or name.',
            'A depth counter on each edge indicates how deep into the call stack that invocation occurred.',
            'Failed invocations are highlighted in red; reverted sub-trees are visually collapsed.',
          ]}
        />
        <H3>Interactivity</H3>
        <P>
          Click any node to expand the detail panel, which shows the full account list and raw
          instruction data for that specific CPI call. Hover over edges to see compute units consumed
          by that branch.
        </P>
        <Callout color="var(--green)">
          Program names are resolved using a curated registry of known Solana programs. If a program
          is not in the registry, its address is displayed in truncated form with a copy button.
        </Callout>
        <H3>What to look for</H3>
        <UL
          items={[
            'Unexpected programs appearing in the tree — this can indicate reentrancy or misconfigured authority accounts.',
            'Unusually deep nesting (depth &gt; 4) which approaches Solana&apos;s CPI depth limit of 4 and can cause hard failures.',
            'Programs invoking Token Program with unexpected amounts or accounts.',
          ]}
        />
      </>
    ),
  },
  instructions: {
    title: 'Instructions',
    body: () => (
      <>
        <P>
          The Instructions panel lists every top-level instruction in the transaction, with decoded
          arguments and account annotations rendered in a structured, human-readable format.
        </P>
        <H3>Decoded arguments</H3>
        <P>
          Lykta attempts to decode instruction data using the program&apos;s on-chain IDL (Anchor
          programs) or a built-in decoder for native and well-known programs. Successfully decoded
          instructions show named fields with their values:
        </P>
        <Code>{`{
  "instruction": "swap",
  "args": {
    "amount_in": 1000000,
    "minimum_amount_out": 987654,
    "sqrt_price_limit": "0"
  }
}`}</Code>
        <H3>Account list</H3>
        <P>
          Each instruction lists its accounts in order, annotated with their roles: signer, writable,
          program, or read-only. Accounts are linked to their diff entries in the Account Diffs panel
          for quick cross-reference.
        </P>
        <Callout color="var(--cyan)">
          For Anchor programs, account names from the IDL are shown alongside the address. For
          unrecognised programs, generic labels (account[0], account[1], …) are used.
        </Callout>
      </>
    ),
  },
  'account-diffs': {
    title: 'Account Diffs',
    body: () => (
      <>
        <P>
          The Account Diffs panel shows the state of every account touched by the transaction both
          before and after execution — lamport balances, owner programs, executable flags, and raw
          data changes.
        </P>
        <H3>Columns</H3>
        <UL
          items={[
            <><strong style={{ color: 'var(--text-1)' }}>Account</strong> — truncated public key with copy-to-clipboard button.</>,
            <><strong style={{ color: 'var(--text-1)' }}>Before</strong> — lamport balance and data length pre-transaction.</>,
            <><strong style={{ color: 'var(--text-1)' }}>After</strong> — lamport balance and data length post-transaction.</>,
            <><strong style={{ color: 'var(--text-1)' }}>Δ Lamports</strong> — net change in SOL balance, coloured green for gains and red for losses.</>,
            <><strong style={{ color: 'var(--text-1)' }}>Flags</strong> — any ownership or executable flag changes that occurred.</>,
          ]}
        />
        <H3>Data changes</H3>
        <P>
          If an account&apos;s raw data changed, a collapsible diff viewer shows a hex-level before/after
          comparison. Changed bytes are highlighted. For Anchor accounts, the data is decoded using
          the IDL and shown as a structured field diff.
        </P>
        <Callout color="var(--amber)">
          Accounts with zero lamport balance before and after are system-created temporary accounts
          (often PDAs used as intermediaries). They appear in the diff list but are collapsed by
          default.
        </Callout>
      </>
    ),
  },
  'token-diffs': {
    title: 'Token Diffs',
    body: () => (
      <>
        <P>
          The Token Diffs panel surfaces every SPL token balance change in the transaction, grouped
          by mint. It presents a clear view of which wallets gained or lost which tokens, and at what
          amounts.
        </P>
        <H3>Reading a token diff</H3>
        <UL
          items={[
            'Each row represents one token account that was written during the transaction.',
            'The mint address is resolved to a token symbol and logo where available via the Jupiter token list.',
            'Before and after balances are shown in their human-readable, decimals-adjusted form.',
            'The delta column shows the net change, coloured green for positive and red for negative.',
            'UI amount and raw amount are both shown on hover to aid debugging of decimal mismatches.',
          ]}
        />
        <H3>Event types</H3>
        <UL
          items={[
            <><strong style={{ color: 'var(--text-1)' }}>Transfer</strong> — tokens moved between two accounts with the same mint.</>,
            <><strong style={{ color: 'var(--text-1)' }}>Mint</strong> — token supply increased; source is the mint authority.</>,
            <><strong style={{ color: 'var(--text-1)' }}>Burn</strong> — tokens permanently removed from supply.</>,
            <><strong style={{ color: 'var(--text-1)' }}>Close</strong> — token account closed; remaining balance returned to owner.</>,
          ]}
        />
      </>
    ),
  },
  compute: {
    title: 'Compute Telemetry',
    body: () => (
      <>
        <P>
          The Compute Telemetry panel reports compute unit (CU) consumption for the transaction at
          both the transaction level and per-program level, helping you identify hotspots and
          optimise before hitting mainnet limits.
        </P>
        <H3>Key metrics</H3>
        <UL
          items={[
            <><strong style={{ color: 'var(--text-1)' }}>Consumed</strong> — total CUs used by the transaction.</>,
            <><strong style={{ color: 'var(--text-1)' }}>Budget</strong> — the compute budget requested (or the default 200,000 CU cap).</>,
            <><strong style={{ color: 'var(--text-1)' }}>Utilisation</strong> — consumed / budget as a percentage, with a colour-coded indicator.</>,
          ]}
        />
        <H3>Per-program breakdown</H3>
        <P>
          A horizontal bar chart shows each program&apos;s share of total compute, labelled with the
          program name and absolute CU count. Programs are sorted from highest to lowest consumer.
          Hover over a bar to see the exact figures.
        </P>
        <Callout color="var(--red)">
          Transactions that exceed the compute budget fail with a{' '}
          <InlineCode>ComputationalBudgetExceeded</InlineCode> error. If utilisation is above 90%,
          Lykta highlights the bar in amber as a warning that you are close to the limit.
        </Callout>
        <H3>Compute budget instructions</H3>
        <P>
          If the transaction includes a <InlineCode>SetComputeUnitLimit</InlineCode> or{' '}
          <InlineCode>SetComputeUnitPrice</InlineCode> instruction, the values are prominently
          surfaced at the top of this panel alongside the priority fee in lamports per CU and the
          total priority fee paid.
        </P>
      </>
    ),
  },
  'raw-json': {
    title: 'Raw JSON',
    body: () => (
      <>
        <P>
          The Raw JSON panel exposes the complete, unmodified RPC response for the transaction as
          returned by <InlineCode>getTransaction</InlineCode> with{' '}
          <InlineCode>maxSupportedTransactionVersion: 0</InlineCode> and{' '}
          <InlineCode>encoding: jsonParsed</InlineCode>.
        </P>
        <H3>When to use</H3>
        <UL
          items={[
            'Debugging a discrepancy between what Lykta shows and the raw on-chain data.',
            'Copying the full transaction payload for offline analysis or scripting.',
            'Verifying account keys, signers, or program data at the byte level.',
            'Exporting data for ingestion into your own tooling or dashboards.',
          ]}
        />
        <H3>Syntax highlighting</H3>
        <P>
          The JSON viewer includes collapsible nodes, syntax highlighting, and a search bar for
          navigating large payloads. Arrays of more than 20 items are collapsed by default but can be
          expanded inline. String values longer than 64 characters are truncated with an expand
          toggle.
        </P>
        <Code>{`{
  "slot": 285432109,
  "transaction": {
    "signatures": ["5KtPn1LmX9vQrT8…"],
    "message": { ... }
  },
  "meta": {
    "err": null,
    "fee": 5000,
    "preBalances": [...],
    "postBalances": [...]
  }
}`}</Code>
      </>
    ),
  },
  'shareable-links': {
    title: 'Shareable Links',
    body: () => (
      <>
        <P>
          Every Lykta analysis lives at a stable, permanent URL that encodes the transaction
          signature and cluster. There is no login, no session, and no expiry — the link works for
          anyone with a browser.
        </P>
        <Code>{`https://lykta.dev/tx/<signature>
https://lykta.dev/tx/<signature>?cluster=devnet`}</Code>
        <H3>Copying a link</H3>
        <P>
          A copy button in the top-right of every analysis page writes the current URL to your
          clipboard. The active panel tab and scroll position are not encoded in the URL — recipients
          always land on the CPI Tree tab by default.
        </P>
        <Callout color="var(--green)">
          Shareable links are ideal for including in GitHub issues, audit reports, Discord threads,
          or Notion docs. The recipient sees the same data without needing a Lykta account or any
          special access.
        </Callout>
      </>
    ),
  },
  'error-explanations': {
    title: 'Error Explanations',
    body: () => (
      <>
        <P>
          When a transaction fails, Lykta generates a plain-language explanation of the error — what
          it means, where in the instruction sequence it occurred, and how to fix it. This is
          surfaced as a prominent error card at the top of the analysis workspace.
        </P>
        <H3>What Lykta explains</H3>
        <UL
          items={[
            'Native program errors such as insufficient lamports, account ownership mismatches, and invalid account data.',
            'Anchor error codes resolved to their human-readable message from the program IDL.',
            'Token program errors including insufficient balance, frozen accounts, and authority violations.',
            'Compute budget errors with specific guidance on increasing the compute unit limit.',
          ]}
        />
        <H3>Error card</H3>
        <P>
          The error card shows the error name, a one-sentence description, the instruction index
          where the failure occurred, and a suggested fix. For known errors, a link to the relevant
          Solana documentation or program source is included.
        </P>
        <Callout color="var(--amber)">
          Error explanations are generated from a curated dictionary of known error codes. For
          custom program errors not in the registry, Lykta displays the raw error code alongside any
          IDL-sourced message it can resolve.
        </Callout>
      </>
    ),
  },
  faq: {
    title: 'FAQ',
    body: () => (
      <>
        <FAQItem
          q="Is Lykta free to use?"
          a="Yes. Lykta is fully free and open source under the MIT licence. There is no pricing tier, no rate limit imposed by Lykta itself, and no account required. The only constraint is the rate limit of the underlying RPC endpoint."
        />
        <FAQItem
          q="Does Lykta store my transaction data?"
          a="No. Lykta is a read-only client-side tool. It fetches transaction data directly from the Solana RPC on your behalf and renders it in your browser. No transaction data is stored on Lykta servers."
        />
        <FAQItem
          q="Which RPC endpoint does Lykta use?"
          a={
            <>
              Lykta uses a public RPC endpoint by default. For high-volume use or access to private
              RPC features, you can configure a custom endpoint in the settings panel. For localnet,
              it always connects to{' '}
              <InlineCode>http://127.0.0.1:8899</InlineCode>.
            </>
          }
        />
        <FAQItem
          q="Why can't Lykta decode my instruction arguments?"
          a="Lykta decodes instructions using on-chain IDLs (for Anchor programs) and a built-in decoder registry for native and well-known programs. If your program's IDL is not published on-chain, the instruction data will be shown as raw bytes. Publishing your IDL with `anchor idl init` enables full decoding."
        />
        <FAQItem
          q="Does Lykta support versioned transactions?"
          a="Yes. Lykta handles both legacy transactions and versioned transactions (version 0) including those that use address lookup tables. ALT-resolved accounts are displayed with their resolved addresses."
        />
        <FAQItem
          q="Can I run Lykta locally?"
          a={
            <>
              Yes. Clone the repository at{' '}
              <InlineCode>github.com/Pritam-deb/lykta</InlineCode> and run{' '}
              <InlineCode>pnpm install && pnpm dev</InlineCode> from the repo root. The web app
              starts on <InlineCode>localhost:3000</InlineCode>. Localnet support requires a
              running Solana test validator.
            </>
          }
        />
        <FAQItem
          q="How do I report a bug or request a feature?"
          a={
            <>
              Open an issue on GitHub at{' '}
              <InlineCode>github.com/Pritam-deb/lykta/issues</InlineCode>. Please include the
              transaction signature, cluster, and a description of what you expected vs. what you
              saw.
            </>
          }
        />
      </>
    ),
  },
}

// ── Page component ────────────────────────────────────────────────────────────

export default function DocsPage() {
  const router = useRouter()
  const [activeId, setActiveId] = useState('introduction')
  const [animIn, setAnimIn] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimIn(true), 50)
    return () => clearTimeout(t)
  }, [])

  const currentIndex = ALL_ITEMS.findIndex((item) => item.id === activeId)
  const prevItem = currentIndex > 0 ? ALL_ITEMS[currentIndex - 1] : null
  const nextItem = currentIndex < ALL_ITEMS.length - 1 ? ALL_ITEMS[currentIndex + 1] : null
  const currentSection = ALL_ITEMS[currentIndex]?.section ?? ''
  const currentTitle = DOC_CONTENT[activeId]?.title ?? ''
  const BodyContent = DOC_CONTENT[activeId]?.body

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
            Docs
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => router.push('/examples')}
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
            Examples
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

      {/* BODY */}
      <div
        style={{
          display: 'flex',
          maxWidth: 1200,
          margin: '0 auto',
          minHeight: 'calc(100vh - 60px)',
        }}
      >
        {/* SIDEBAR */}
        <aside
          style={{
            width: 240,
            flexShrink: 0,
            position: 'sticky',
            top: 60,
            height: 'calc(100vh - 60px)',
            overflowY: 'auto',
            borderRight: '1px solid var(--border)',
            padding: '32px 0 32px 24px',
          }}
        >
          {SECTIONS.map((section) => (
            <div key={section.label} style={{ marginBottom: 28 }}>
              <p
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-3)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                  paddingRight: 16,
                }}
              >
                {section.label}
              </p>
              {section.items.map((item) => {
                const isActive = item.id === activeId
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveId(item.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '6px 16px 6px 10px',
                      borderLeft: isActive
                        ? '2px solid var(--green)'
                        : '2px solid transparent',
                      background: isActive ? 'var(--bg-2)' : 'transparent',
                      border: 'none',
                      borderLeftStyle: 'solid',
                      borderLeftWidth: 2,
                      borderLeftColor: isActive ? 'var(--green)' : 'transparent',
                      borderRadius: '0 6px 6px 0',
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      fontSize: 13.5,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--text-1)' : 'var(--text-2)',
                      cursor: 'pointer',
                      marginBottom: 2,
                      transition: 'all 0.15s',
                    }}
                  >
                    {item.title}
                  </button>
                )
              })}
            </div>
          ))}
        </aside>

        {/* MAIN CONTENT */}
        <main
          style={{
            flex: 1,
            maxWidth: 720,
            padding: 'clamp(2rem,4vw,3.5rem) clamp(2rem,5vw,5rem)',
            opacity: animIn ? 1 : 0,
            transform: animIn ? 'none' : 'translateY(12px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          {/* Breadcrumb */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 20,
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 12.5,
            }}
          >
            <span style={{ color: 'var(--text-3)' }}>{currentSection}</span>
            <span style={{ color: 'var(--text-3)' }}>›</span>
            <span style={{ color: 'var(--text-2)' }}>{currentTitle}</span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              color: 'var(--text-1)',
              letterSpacing: '-0.03em',
              marginBottom: 28,
              lineHeight: 1.15,
            }}
          >
            {currentTitle}
          </h1>

          {/* Content body */}
          {BodyContent && <BodyContent />}

          {/* Prev / Next */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
              marginTop: 56,
              paddingTop: 24,
              borderTop: '1px solid var(--border)',
            }}
          >
            {prevItem ? (
              <button
                onClick={() => setActiveId(prevItem.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 3,
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  flex: 1,
                  maxWidth: '48%',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    fontSize: 11.5,
                    color: 'var(--text-3)',
                  }}
                >
                  ← Previous
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-space-grotesk), sans-serif',
                    fontWeight: 600,
                    fontSize: 13.5,
                    color: 'var(--text-1)',
                  }}
                >
                  {prevItem.title}
                </span>
              </button>
            ) : (
              <div style={{ flex: 1 }} />
            )}

            {nextItem ? (
              <button
                onClick={() => setActiveId(nextItem.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 3,
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  flex: 1,
                  maxWidth: '48%',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    fontSize: 11.5,
                    color: 'var(--text-3)',
                  }}
                >
                  Next →
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-space-grotesk), sans-serif',
                    fontWeight: 600,
                    fontSize: 13.5,
                    color: 'var(--text-1)',
                  }}
                >
                  {nextItem.title}
                </span>
              </button>
            ) : (
              <div style={{ flex: 1 }} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
