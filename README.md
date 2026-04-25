<p align="center">
  <svg width="180" height="54" viewBox="0 0 180 54" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0,3)">
      <ellipse cx="24" cy="26" rx="13" ry="13" fill="#9945FF" opacity="0.13"/>
      <rect x="16" y="14" width="16" height="22" rx="4" fill="#9945FF"/>
      <rect x="19" y="9" width="10" height="6" rx="2" fill="#7B2FD4"/>
      <rect x="19" y="35" width="10" height="5" rx="2" fill="#7B2FD4"/>
      <rect x="21" y="20" width="6" height="10" rx="2" fill="#F0E6FF" opacity="0.9"/>
      <path d="M24 9 V5" stroke="#7B2FD4" stroke-width="2" stroke-linecap="round" fill="none"/>
      <line x1="10" y1="18" x2="6" y2="15" stroke="#9945FF" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
      <line x1="8" y1="26" x2="3" y2="26" stroke="#9945FF" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>
      <line x1="10" y1="34" x2="6" y2="37" stroke="#9945FF" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
      <line x1="38" y1="18" x2="42" y2="15" stroke="#9945FF" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
      <line x1="40" y1="26" x2="45" y2="26" stroke="#9945FF" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>
      <line x1="38" y1="34" x2="42" y2="37" stroke="#9945FF" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
    </g>
    <text x="56" y="32" font-family="system-ui, sans-serif" font-size="26" font-weight="500" fill="#0A0A0A" letter-spacing="-0.5">lykta</text>
  </svg>
</p>

**Light inside every transaction — CPI graphs, compute unit flamegraphs, account diffs, and error explanations in your IDE, terminal, and test suite.**

## Try it now

```bash
npx @lykta/cli inspect 2dFnV9p5XudD1y4yyKfKi8dJiQgKXvGcajigh9scnzunWDMiR9ieoHw6Ge19pu9oTq5LuBSddwQQYivhccQF8h4Y
```

No API keys. No config. Defaults to Solana devnet.

```
Fetching 2dFnV9p5XudD1y4yyKfKi8dJiQgKXvGcajigh9scnzunWDMiR9ieoHw6Ge19pu9oTq5LuBSddwQQYivhccQF8h4Y on devnet

✓ SUCCESS  slot 452793604  fee 0.000007295 SOL  12343 CU total

CPI Call Tree
▶ Compute Budget
▶ Compute Budget
▶ Squads Protocol:create
  └─ System Program
▶ System Program
▶ System Program

Compute Units
  [███████████░░░░░░░░░] 55%  SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu  12343/22643

Account Changes
  6SsyU88GarRL4KqMWLCqsNWJpLeSxiQiN6jKGdcV9Zbw  -3292735 lamports
  5b2qUSLdLvPyqZv3D8ZQAiNnkQXgJg2TvgGVGbMSxuZq  +2185440 lamports
  BjHVwPgEJ33Kj3BovX8gW3PVxv6j2bdwky439JAVGadX  +1000000 lamports
  DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL  +100000 lamports
```

No custom RPC. No browser required. Paste any transaction signature — mainnet, devnet, or local — and get instant visibility inside VS Code.

---

## Packages

| Package                                 | Description                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| [`@lykta/core`](./packages/core)       | Transaction decode engine, CPI tree builder, account diff, CU analyzer, error explainer |
| [`@lykta/cli`](./packages/cli)         | `npx lykta inspect \| diff \| error \| watch <signature\|programId>`                    |
| [`@lykta/vscode`](./packages/vscode)   | VS Code extension — CPI graph, account diff, CU flamegraph, error explanation panels    |
| [`@lykta/litesvm`](./packages/litesvm) | LiteSVM wrapper with enhanced error output for tests                                    |

---

## Web Dashboard

Paste any Solana transaction signature into the URL and get a fully rendered multi-tab analysis instantly.

```
https://lykta.vercel.app/tx/<SIGNATURE>?cluster=devnet
```

**Example (devnet — Squads Protocol `create`):**
```
https://lykta.vercel.app/tx/2dFnV9p5XudD1y4yyKfKi8dJiQgKXvGcajigh9scnzunWDMiR9ieoHw6Ge19pu9oTq5LuBSddwQQYivhccQF8h4Y?cluster=devnet
```

### Tabs

| Tab | What you see |
|-----|-------------|
| **CPI Tree** | Interactive ReactFlow graph of every cross-program invocation, color-coded by success/failure |
| **Instructions** | Decoded instruction names and Borsh-parsed args for every Anchor program with an on-chain IDL |
| **Account Diffs** | Pre/post lamport balances for every account touched by the transaction |
| **Token Diffs** | SPL token balance changes with mint, owner, and UI-formatted delta |
| **Compute** | Per-instruction compute unit consumption bar chart |
| **Raw JSON** | Full decoded transaction object for copy-paste into scripts |

### Shareable links

Every URL is shareable as-is. The page generates dynamic Open Graph tags — paste the link into Slack or Twitter to see a preview with the transaction status, slot, fee, and instruction count.

Supported clusters: `mainnet-beta` (default), `devnet`, `testnet`.

---

## Quick Start

### CLI

```bash
# Inspect any transaction — CPI tree + compute units + account changes
npx @lykta/cli inspect <SIGNATURE> --cluster devnet

# Use a custom RPC URL
npx @lykta/cli inspect <SIGNATURE> --url https://your-rpc.com

# Show account state diffs
npx @lykta/cli diff <SIGNATURE>

# Explain why a transaction failed
npx @lykta/cli error <SIGNATURE>

# Add AI-powered fix suggestion (requires ANTHROPIC_API_KEY in env)
ANTHROPIC_API_KEY=sk-ant-... npx @lykta/cli error <SIGNATURE> --ai

# Watch a program in real-time via websocket
npx @lykta/cli watch <PROGRAM_ID> --cluster devnet

# Watch but only print failed transactions
npx @lykta/cli watch <PROGRAM_ID> --errors-only
```

### VS Code

1. Install the **Lykta** extension from the VS Code Marketplace (or install the `.vsix` directly during the hackathon)
2. Open the command palette (`Cmd+Shift+P`) and run **Lykta: Inspect Transaction**
3. Paste a transaction signature
4. CPI graph, account diff, and compute unit flamegraph panels open automatically

### LiteSVM (tests)

Replace raw LiteSVM calls with `LyktaTestContext` to get enhanced error output on test failure:

```ts
import { LyktaTestContext } from '@lykta/litesvm'

const ctx = new LyktaTestContext()
await ctx.loadProgram(fs.readFileSync('./target/deploy/my_program.so'))

const result = await ctx.processTransaction(tx)
if (!result.success) {
  // Prints CPI tree, account diffs, CU usage, and error explanation
  console.log(result.summary)
}
```

---

## Development

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm`)
- Rust + Solana CLI (for the demo Anchor program only)

### Setup

```bash
git clone https://github.com/pritam-deb/lykta
cd lykta
pnpm install
pnpm build
```

### Monorepo commands

```bash
pnpm build          # Build all packages (Turborepo, respects dependency order)
pnpm dev            # Watch mode for all packages
pnpm test           # Run all tests
pnpm lint           # Type-check all packages
pnpm format         # Format all files with Prettier
pnpm clean          # Remove all dist/ and node_modules/
```

### Working on a single package

```bash
cd packages/core
pnpm dev            # Watch mode for this package only
pnpm test           # Tests for this package only
```

### Running the CLI locally

```bash
cd packages/cli
pnpm build
node dist/bin.mjs inspect <SIGNATURE> --cluster devnet
```

### Running the VS Code extension locally

```bash
cd packages/vscode
pnpm build
# Then in VS Code: Run → Start Debugging (launches Extension Development Host)
```

---

## Architecture

```
packages/core       ← All analysis logic. No UI, no CLI concerns.
    fetch.ts        ← fetchTransaction() — RPC fetch + full decode pipeline
    cpi.ts          ← buildCpiTree() — nested CpiNode[] from innerInstructions
    diff.ts         ← extractAccountDiffs() — pre/post lamports + token balances
    compute.ts      ← parseCuUsage() — per-instruction CU from log messages
    idl.ts          ← resolveIdl() + decodeInstruction() — Anchor IDL resolution
    errors.ts       ← explainError() — error code map + optional Claude API call
    types.ts        ← LyktaTransaction, CpiNode, AccountDiff, CuUsage, LyktaError

packages/cli        ← Commander.js CLI. Consumes @lykta/core.
    commands/
        inspect.ts  ← npx lykta inspect <sig>  (renderInspect shared renderer)
        diff.ts     ← npx lykta diff <sig>
        error.ts    ← npx lykta error <sig> [--ai]
        watch.ts    ← npx lykta watch <programId> [--errors-only]

packages/vscode     ← VS Code extension. Consumes @lykta/core.
    extension.ts    ← Activation, command registration
    panels/
        CpiGraphPanel.ts    ← WebView panel — vis.js CPI tree (Week 2)
        AccountDiffPanel.ts ← WebView panel — before/after account view (Week 3)
        CuFlamegraph.ts     ← WebView panel — per-instruction CU bars (Week 3)
        ErrorPanel.ts       ← WebView panel — error + Claude suggestion (Week 4)

packages/litesvm    ← LiteSVM wrapper. Consumes @lykta/core.
    context.ts      ← LyktaTestContext — intercepts tx processing (Week 4)

apps/demo           ← Anchor program used as the live demo subject
```

### Key design constraint: WebView networking

**All RPC calls happen in the extension host process, not the WebView.** VS Code WebViews run in a sandboxed iframe that cannot make arbitrary network requests. The extension host fetches data, builds the `LyktaTransaction` object, and sends it to the WebView via `panel.webview.postMessage()`. The WebView is purely a renderer.

---

## Configuration

### CLI

Create `lykta.config.json` in your project root:

```json
{
  "rpcUrl": "https://your-rpc-url.com",
  "cluster": "devnet"
}
```

Or pass flags directly:

```bash
lykta inspect <sig> --rpc https://your-rpc.com
lykta inspect <sig> --cluster mainnet
```

### VS Code

Open Settings (`Cmd+,`) and search for **Lykta**:

| Setting          | Default                         | Description                                                   |
| ---------------- | ------------------------------- | ------------------------------------------------------------- |
| `lykta.rpcUrl`  | `https://api.devnet.solana.com` | RPC endpoint                                                  |
| `lykta.cluster` | `devnet`                        | Cluster shorthand (`mainnet \| devnet \| localnet \| custom`) |

Claude API key for AI error suggestions: set `ANTHROPIC_API_KEY` in your shell environment, or configure it in VS Code settings (stored in SecretStorage, never in plaintext).

---

## Competitive positioning

| Tool        | Where it works      | CPI graph      | Account diff      | Per-instruction CU | VS Code      | Test integration   |
| ----------- | ------------------- | -------------- | ----------------- | ------------------ | ------------ | ------------------ |
| **Lykta**   | Any tx, anywhere    | ✅ Interactive | ✅ Full data diff | ✅ Flamegraph      | ✅ Extension | ✅ LiteSVM wrapper |
| Helius Orb  | Web browser         | ❌ Flat list   | ❌ Balance only   | ❌                 | ❌           | ❌                 |
| Seer        | Custom RPC required | ❌             | ❌                | ❌                 | ❌           | ❌                 |
| Surfpool Studio | Local env only  | ❌             | ✅ Byte-level     | ❌                 | ❌           | ❌                 |
| Phalcon     | Web browser         | ✅ Multi-level | ❌ Balance only   | ❌                 | ❌           | ❌                 |

---

## Contributing

This project is built for the [Colosseum April 2026 Hackathon](https://www.colosseum.org/). The build plan is in [`docs/`](./docs/lykta_5week_plan.md).

### Week-by-week build targets

- **Week 1 (Apr 6–12):** `@lykta/core` — fetch, CPI tree, account diff, CU parser + devnet fixture tests
- **Week 2 (Apr 13–19):** IDL resolution + `@lykta/vscode` CPI Graph panel (vis.js)
- **Week 3 (Apr 20–26):** `@lykta/cli` + Account Diff panel + CU Flamegraph panel
- **Week 4 (Apr 27–May 3):** Error explainer (Claude API) + `@lykta/litesvm` + Error panel
- **Week 5 (May 4–11):** Demo program, pitch video, npm publish, submission

### Before submitting a PR

```bash
pnpm build && pnpm test && pnpm lint
```

---

## License

MIT
