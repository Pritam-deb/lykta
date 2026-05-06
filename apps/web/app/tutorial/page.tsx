'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LyktaLogo from '@/components/LyktaLogo'

type TutorialKey = 'web' | 'developer'

type Tutorial = {
  label: string
  videoSrc: string
  videoPath: string
  eyebrow: string
  title: string
  intro: string
  quickStart: [string, string][]
  steps: { n: string; title: string; body: string; command: string }[]
  scenarios: { title: string; steps: string[] }[]
  uses: { title: string; text: string; items: string[] }[]
}

const TUTORIALS: Record<TutorialKey, Tutorial> = {
  web: {
    label: 'Web App',
    videoSrc: '/tutorial/lykta-web-app-tutorial.mp4',
    videoPath: 'public/tutorial/lykta-web-app-tutorial.mp4',
    eyebrow: 'WEB APP TUTORIAL',
    title: 'Use Lykta from the browser.',
    intro:
      'This path is for anyone who has a Solana transaction signature and wants a simple, shareable explanation of what happened.',
    quickStart: [
      ['Best for', 'Viewing and sharing transactions'],
      ['You need', 'A transaction signature'],
      ['Networks', 'Mainnet, devnet, testnet, localnet'],
      ['Use for', 'Online transaction review'],
    ],
    steps: [
      {
        n: '01',
        title: 'Open the Lykta web app',
        body: 'Go to the Lykta website. The first screen gives you one main place to paste a transaction signature.',
        command: 'Open the app page',
      },
      {
        n: '02',
        title: 'Paste the transaction signature',
        body: 'Copy the long transaction ID from a wallet, explorer, test log, support message, or teammate, then paste it into the input.',
        command: 'Paste the signature',
      },
      {
        n: '03',
        title: 'Select the right network',
        body: 'Choose where the transaction happened. Use Mainnet for real user transactions, Devnet or Testnet for testing, and Localnet for local development.',
        command: 'Choose Mainnet, Devnet, Testnet, or Localnet',
      },
      {
        n: '04',
        title: 'Open the analysis page',
        body: 'Submit the form. Lykta opens a readable transaction page with status, fee, balance changes, token changes, error details, and deeper tabs if needed.',
        command: 'Open analysis',
      },
      {
        n: '05',
        title: 'Start with the status',
        body: 'Check whether the transaction succeeded or failed. This tells you whether to inspect balance movement first or read the failure details first.',
        command: 'Read status first',
      },
      {
        n: '06',
        title: 'Check money and token movement',
        body: 'Open Account Diffs and Token Diffs to see who gained or lost SOL or tokens. This is the easiest way to answer what actually changed.',
        command: 'Open Account Diffs and Token Diffs',
      },
      {
        n: '07',
        title: 'Use deeper tabs only when needed',
        body: 'If you need more detail, open CPI Tree, Instructions, Compute, or Raw JSON. These are useful when the simple status and balance view is not enough.',
        command: 'Open CPI Tree, Instructions, Compute, or Raw JSON',
      },
      {
        n: '08',
        title: 'Share the result',
        body: 'Copy the page URL and send it to someone else. They can open the same transaction view without your wallet, account, or local setup.',
        command: 'Copy and share the URL',
      },
    ],
    scenarios: [
      {
        title: 'You only want to know if a transaction worked',
        steps: [
          'Paste the transaction signature.',
          'Choose the correct network.',
          'Open the transaction page.',
          'Read the status at the top.',
          'If it succeeded, check fee and balance changes.',
        ],
      },
      {
        title: 'A transfer, swap, mint, or withdrawal looks wrong',
        steps: [
          'Open the transaction in Lykta.',
          'Use Account Diffs for SOL movement.',
          'Use Token Diffs for token movement.',
          'Compare the before and after values.',
          'Share the link with whoever needs to review it.',
        ],
      },
      {
        title: 'A transaction failed',
        steps: [
          'Open the failed transaction.',
          'Start with the error information.',
          'Check which action failed.',
          'Review the logs or details beside the error.',
          'Use the result to decide what to check next.',
        ],
      },
      {
        title: 'You are checking SVM or local testing output',
        steps: [
          'Use the VS Code / CLI tab for direct LiteSVM or SVM test output.',
          'The web app is for transaction signatures that can be fetched through an RPC endpoint.',
          'If your local test produces an RPC-accessible localnet transaction signature, open it like any other signature.',
          'If the test only runs inside LiteSVM, use the developer workflow instead.',
        ],
      },
    ],
    uses: [
      {
        title: 'User support',
        text: 'Use the web app when a user sends a transaction and asks what happened.',
        items: ['Failed payments', 'Unexpected token balances', 'Wallet support replies', 'Community debugging'],
      },
      {
        title: 'Sharing with a team',
        text: 'Use the web app when multiple people need to look at the same transaction without setting up tools locally.',
        items: ['GitHub issues', 'Audit notes', 'Team chat', 'Client updates'],
      },
      {
        title: 'Checking real app behavior',
        text: 'Use the web app after your product sends a transaction and you want to confirm the chain result matches the user action.',
        items: ['Swaps', 'Deposits', 'Withdrawals', 'Mints'],
      },
      {
        title: 'Localnet review',
        text: 'Use the web app for localnet transactions only when the transaction is available through a reachable local RPC endpoint.',
        items: ['Local validator checks', 'Devnet rehearsals', 'Pre-release debugging', 'Shareable transaction review'],
      },
    ],
  },
  developer: {
    label: 'VS Code / CLI',
    videoSrc: '/tutorial/lykta-developer-tutorial.mp4',
    videoPath: 'public/tutorial/lykta-developer-tutorial.mp4',
    eyebrow: 'DEVELOPER TUTORIAL',
    title: 'Use Lykta inside your workflow.',
    intro:
      'This path is for developers who want Lykta directly in the IDE, terminal, or local SVM test loop.',
    quickStart: [
      ['Best for', 'Developing and debugging Solana apps'],
      ['Use in', 'VS Code, terminal, tests'],
      ['You need', 'A signature, program ID, or test transaction'],
      ['SVM use', 'LiteSVM test failures and local transaction debugging'],
    ],
    steps: [
      {
        n: '01',
        title: 'Use the VS Code extension for IDE debugging',
        body: 'Open VS Code, install or load the Lykta extension, then use the command palette to inspect a transaction without leaving the editor.',
        command: 'Lykta: Inspect Transaction',
      },
      {
        n: '02',
        title: 'Paste a transaction signature in VS Code',
        body: 'When the command asks for a signature, paste the transaction ID and choose the network you want to inspect.',
        command: 'Paste signature and choose network',
      },
      {
        n: '03',
        title: 'Read the IDE panels',
        body: 'Use the panels for CPI tree, account changes, compute usage, and error information. This keeps the transaction next to the code you are debugging.',
        command: 'Open Lykta panels in VS Code',
      },
      {
        n: '04',
        title: 'Use the CLI when you are in a terminal',
        body: 'Run the CLI when you are working from logs, scripts, CI output, or a local development terminal.',
        command: 'npx @lykta/cli inspect <signature> --cluster devnet',
      },
      {
        n: '05',
        title: 'Use diff for balance changes',
        body: 'When you only care about what changed, use the diff command to focus on SOL and token movement.',
        command: 'npx @lykta/cli diff <signature>',
      },
      {
        n: '06',
        title: 'Use error for failed transactions',
        body: 'When a transaction fails, use the error command to get a focused explanation instead of scanning raw logs first.',
        command: 'npx @lykta/cli error <signature>',
      },
      {
        n: '07',
        title: 'Use watch for live program debugging',
        body: 'When you are watching a program during development, stream new transactions and optionally focus only on failures.',
        command: 'npx @lykta/cli watch <programId> --errors-only',
      },
      {
        n: '08',
        title: 'Use LiteSVM for local SVM tests',
        body: 'In tests, use the Lykta LiteSVM wrapper so failed local transactions print a clearer summary with useful debugging context.',
        command: 'LyktaTestContext -> processTransaction(tx)',
      },
    ],
    scenarios: [
      {
        title: 'You are coding in VS Code',
        steps: [
          'Open the command palette.',
          'Run Lykta: Inspect Transaction.',
          'Paste the signature.',
          'Review the panels beside your code.',
          'Use the result to update the code or test.',
        ],
      },
      {
        title: 'You are debugging from terminal logs',
        steps: [
          'Copy the signature from the log.',
          'Run the inspect command.',
          'Use diff if you only need balance changes.',
          'Use error if the transaction failed.',
          'Share the output or web link with your team.',
        ],
      },
      {
        title: 'You are watching a program',
        steps: [
          'Copy the program ID.',
          'Run the watch command.',
          'Add errors-only when failures are the main concern.',
          'Inspect any suspicious signature.',
          'Use the result to narrow down the issue.',
        ],
      },
      {
        title: 'You are running SVM or LiteSVM tests',
        steps: [
          'Wrap the test flow with LyktaTestContext.',
          'Process the transaction through the test context.',
          'When the result fails, print the Lykta summary.',
          'Check account changes, compute usage, and error context.',
          'Fix the program or test setup before deploying.',
        ],
      },
    ],
    uses: [
      {
        title: 'VS Code development',
        text: 'Use Lykta in VS Code when you want transaction debugging next to your source files.',
        items: ['Program debugging', 'Frontend transaction bugs', 'Localnet checks', 'Reviewing failed user flows'],
      },
      {
        title: 'Terminal-first workflows',
        text: 'Use the CLI when your signature comes from scripts, logs, CI, or a local shell.',
        items: ['CI failures', 'Test logs', 'Program watchers', 'Fast inspection'],
      },
      {
        title: 'SVM and LiteSVM tests',
        text: 'Use the LiteSVM integration when you want failed local test transactions to produce useful debugging output immediately.',
        items: ['Local SVM simulation', 'Anchor-style tests', 'Pre-deploy checks', 'Program failure summaries'],
      },
      {
        title: 'Team debugging',
        text: 'Use VS Code or CLI output when engineers need exact details, then share a web link when non-local review is easier.',
        items: ['Developer handoff', 'Issue reports', 'Audit follow-up', 'Support escalation'],
      },
    ],
  },
}

function NavButton({
  label,
  onClick,
  primary = false,
}: {
  label: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: primary ? 'var(--green)' : 'var(--bg-2)',
        border: primary ? 'none' : '1px solid var(--border)',
        borderRadius: 6,
        padding: '6px 14px',
        fontFamily: 'var(--font-dm-sans), sans-serif',
        fontWeight: primary ? 600 : 400,
        fontSize: 13.5,
        color: primary ? 'var(--bg-base)' : 'var(--text-2)',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

export default function TutorialPage() {
  const router = useRouter()
  const [animIn, setAnimIn] = useState(false)
  const [activeTab, setActiveTab] = useState<TutorialKey>('web')
  const tutorial = TUTORIALS[activeTab]

  useEffect(() => {
    const t = setTimeout(() => setAnimIn(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ color: 'var(--text-1)', minHeight: '100vh' }}>
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
            Tutorial
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NavButton label="Docs" onClick={() => router.push('/docs')} />
          <NavButton label="Examples" onClick={() => router.push('/examples')} />
          <NavButton label="Open App ->" onClick={() => router.push('/')} primary />
        </div>
      </nav>

      <main
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: 'clamp(2.5rem,5vw,4rem) clamp(1.5rem,4vw,3rem)',
          opacity: animIn ? 1 : 0,
          transform: animIn ? 'none' : 'translateY(14px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        <section style={{ marginBottom: 32 }}>
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
            STEP BY STEP GUIDE
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(2.4rem,5vw,4.5rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              color: 'var(--text-1)',
              marginBottom: 18,
              maxWidth: 820,
            }}
          >
            Choose how you want to use Lykta.
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 17,
              lineHeight: 1.7,
              color: 'var(--text-2)',
              maxWidth: 720,
            }}
          >
            Use the web app when you want a simple online transaction view. Use the developer
            workflow when you want Lykta inside VS Code, the CLI, or local SVM tests.
          </p>
        </section>

        <div
          role="tablist"
          aria-label="Tutorial type"
          style={{
            display: 'inline-flex',
            gap: 6,
            padding: 5,
            background: 'var(--bg-2)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            marginBottom: 40,
          }}
        >
          {(Object.keys(TUTORIALS) as TutorialKey[]).map((key) => {
            const active = key === activeTab
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(key)}
                style={{
                  background: active ? 'var(--green)' : 'transparent',
                  border: 'none',
                  borderRadius: 7,
                  padding: '9px 16px',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontWeight: active ? 700 : 600,
                  fontSize: 14,
                  color: active ? 'var(--bg-base)' : 'var(--text-2)',
                  cursor: 'pointer',
                }}
              >
                {TUTORIALS[key].label}
              </button>
            )
          })}
        </div>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, 0.65fr)',
            gap: 24,
            alignItems: 'stretch',
            marginBottom: 56,
          }}
        >
          <div
            style={{
              background: 'var(--bg-1)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 24px 70px var(--shadow-heavy)',
            }}
          >
            <video
              controls
              preload="metadata"
              style={{
                display: 'block',
                width: '100%',
                aspectRatio: '16 / 9',
                background: 'var(--bg-base)',
                objectFit: 'cover',
              }}
            >
              <source src={tutorial.videoSrc} type="video/mp4" />
            </video>
            <div
              style={{
                borderTop: '1px solid var(--border)',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                background: 'var(--bg-2)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: 13.5,
                  color: 'var(--text-2)',
                }}
              >
                Add your tutorial video here
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 12,
                  color: 'var(--text-3)',
                }}
              >
                {tutorial.videoPath}
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 24,
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--cyan)',
                letterSpacing: '0.12em',
                marginBottom: 16,
              }}
            >
              {tutorial.eyebrow}
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontWeight: 700,
                fontSize: 28,
                letterSpacing: '-0.03em',
                marginBottom: 12,
              }}
            >
              {tutorial.title}
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 14.5,
                color: 'var(--text-2)',
                lineHeight: 1.65,
                marginBottom: 18,
              }}
            >
              {tutorial.intro}
            </p>
            {tutorial.quickStart.map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    fontSize: 13,
                    color: 'var(--text-3)',
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: 'var(--text-1)',
                    textAlign: 'right',
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 56 }}>
          <div style={{ marginBottom: 28 }}>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 12.5,
                fontWeight: 700,
                color: 'var(--amber)',
                letterSpacing: '0.12em',
                marginBottom: 10,
              }}
            >
              PROCEDURE
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontWeight: 700,
                fontSize: 'clamp(1.8rem,3vw,2.7rem)',
                letterSpacing: '-0.03em',
              }}
            >
              {activeTab === 'web' ? 'Simple steps to use the web app' : 'Simple steps for VS Code, CLI, and SVM'}
            </h2>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {tutorial.steps.map((step) => (
              <article
                key={step.n}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '72px minmax(0, 1fr)',
                  gap: 20,
                  padding: 22,
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-space-grotesk), sans-serif',
                    fontWeight: 700,
                    fontSize: 32,
                    color: 'var(--border-2)',
                    letterSpacing: '-0.04em',
                  }}
                >
                  {step.n}
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-space-grotesk), sans-serif',
                      fontWeight: 700,
                      fontSize: 20,
                      color: 'var(--text-1)',
                      letterSpacing: '-0.02em',
                      marginBottom: 8,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      fontSize: 15,
                      color: 'var(--text-2)',
                      lineHeight: 1.65,
                      marginBottom: 12,
                    }}
                  >
                    {step.body}
                  </p>
                  <code
                    style={{
                      display: 'inline-block',
                      maxWidth: '100%',
                      overflowX: 'auto',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '6px 9px',
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      fontSize: 12,
                      color: 'var(--green)',
                    }}
                  >
                    {step.command}
                  </code>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 56 }}>
          <div style={{ marginBottom: 28 }}>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 12.5,
                fontWeight: 700,
                color: 'var(--green)',
                letterSpacing: '0.12em',
                marginBottom: 10,
              }}
            >
              COMMON SCENARIOS
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontWeight: 700,
                fontSize: 'clamp(1.8rem,3vw,2.7rem)',
                letterSpacing: '-0.03em',
              }}
            >
              What to do in each situation
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {tutorial.scenarios.map((scenario) => (
              <article
                key={scenario.title}
                style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 24,
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-space-grotesk), sans-serif',
                    fontWeight: 700,
                    fontSize: 19,
                    color: 'var(--text-1)',
                    marginBottom: 16,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {scenario.title}
                </h3>
                <ol style={{ display: 'grid', gap: 10, paddingLeft: 18, margin: 0 }}>
                  {scenario.steps.map((item) => (
                    <li
                      key={item}
                      style={{
                        fontFamily: 'var(--font-dm-sans), sans-serif',
                        fontSize: 14.5,
                        color: 'var(--text-2)',
                        lineHeight: 1.55,
                        paddingLeft: 4,
                      }}
                    >
                      {item}
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div style={{ marginBottom: 28 }}>
            <p
              style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 12.5,
                fontWeight: 700,
                color: 'var(--cyan)',
                letterSpacing: '0.12em',
                marginBottom: 10,
              }}
            >
              WHERE TO USE IT
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontWeight: 700,
                fontSize: 'clamp(1.8rem,3vw,2.7rem)',
                letterSpacing: '-0.03em',
              }}
            >
              Where this workflow fits best
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {tutorial.uses.map((workflow) => (
              <article
                key={workflow.title}
                style={{
                  background: 'var(--bg-1)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 24,
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-space-grotesk), sans-serif',
                    fontWeight: 700,
                    fontSize: 19,
                    color: 'var(--text-1)',
                    marginBottom: 10,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {workflow.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    fontSize: 14.5,
                    color: 'var(--text-2)',
                    lineHeight: 1.65,
                    marginBottom: 18,
                  }}
                >
                  {workflow.text}
                </p>
                <div style={{ display: 'grid', gap: 8 }}>
                  {workflow.items.map((item) => (
                    <span
                      key={item}
                      style={{
                        fontFamily: 'var(--font-jetbrains-mono), monospace',
                        fontSize: 12,
                        color: 'var(--text-2)',
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '7px 9px',
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
