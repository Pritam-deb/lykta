# SolScope

**Developer observability for Solana — CPI graphs, compute unit flamegraphs, account diffs, and error explanations in your IDE, terminal, and test suite.**

No custom RPC. No browser required. Paste any transaction signature — mainnet, devnet, or local — and get instant visibility inside VS Code.

---

## Packages

| Package                                   | Description                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------------- |
| [`@solscope/core`](./packages/core)       | Transaction decode engine, CPI tree builder, account diff, CU analyzer, error explainer |
| [`@solscope/cli`](./packages/cli)         | `npx solscope inspect \| diff \| error <signature>`                                     |
| [`@solscope/vscode`](./packages/vscode)   | VS Code extension — CPI graph, account diff, CU flamegraph, error explanation panels    |
| [`@solscope/litesvm`](./packages/litesvm) | LiteSVM wrapper with enhanced error output for tests                                    |

---

## Quick Start

### CLI

```bash
# Inspect any transaction — CPI tree + compute units + account changes
npx @solscope/cli inspect <SIGNATURE> --cluster devnet

# Show account state diffs
npx @solscope/cli diff <SIGNATURE>

# Explain why a transaction failed
npx @solscope/cli error <SIGNATURE>

# Set ANTHROPIC_API_KEY for AI-powered fix suggestions
ANTHROPIC_API_KEY=sk-ant-... npx @solscope/cli error <SIGNATURE>
```

### VS Code

1. Install the **SolScope** extension from the VS Code Marketplace (or install the `.vsix` directly during the hackathon)
2. Open the command palette (`Cmd+Shift+P`) and run **SolScope: Inspect Transaction**
3. Paste a transaction signature
4. CPI graph, account diff, and compute unit flamegraph panels open automatically

### LiteSVM (tests)

Replace raw LiteSVM calls with `SolScopeTestContext` to get enhanced error output on test failure:

```ts
import { SolScopeTestContext } from '@solscope/litesvm'

const ctx = new SolScopeTestContext()
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
git clone https://github.com/pritam-deb/solscope
cd solscope
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
node dist/bin.js inspect <SIGNATURE> --cluster devnet
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
    types.ts        ← SolScopeTransaction, CpiNode, AccountDiff, CuUsage, SolScopeError

packages/cli        ← Commander.js CLI. Consumes @solscope/core.
    commands/
        inspect.ts  ← npx solscope inspect <sig>
        diff.ts     ← npx solscope diff <sig>
        error.ts    ← npx solscope error <sig>

packages/vscode     ← VS Code extension. Consumes @solscope/core.
    extension.ts    ← Activation, command registration
    panels/
        CpiGraphPanel.ts    ← WebView panel — vis.js CPI tree (Week 2)
        AccountDiffPanel.ts ← WebView panel — before/after account view (Week 3)
        CuFlamegraph.ts     ← WebView panel — per-instruction CU bars (Week 3)
        ErrorPanel.ts       ← WebView panel — error + Claude suggestion (Week 4)

packages/litesvm    ← LiteSVM wrapper. Consumes @solscope/core.
    context.ts      ← SolScopeTestContext — intercepts tx processing (Week 4)

apps/demo           ← Anchor program used as the live demo subject
```

### Key design constraint: WebView networking

**All RPC calls happen in the extension host process, not the WebView.** VS Code WebViews run in a sandboxed iframe that cannot make arbitrary network requests. The extension host fetches data, builds the `SolScopeTransaction` object, and sends it to the WebView via `panel.webview.postMessage()`. The WebView is purely a renderer.

---

## Configuration

### CLI

Create `solscope.config.json` in your project root:

```json
{
  "rpcUrl": "https://your-rpc-url.com",
  "cluster": "devnet"
}
```

Or pass flags directly:

```bash
solscope inspect <sig> --rpc https://your-rpc.com
solscope inspect <sig> --cluster mainnet
```

### VS Code

Open Settings (`Cmd+,`) and search for **SolScope**:

| Setting            | Default                         | Description                                                   |
| ------------------ | ------------------------------- | ------------------------------------------------------------- |
| `solscope.rpcUrl`  | `https://api.devnet.solana.com` | RPC endpoint                                                  |
| `solscope.cluster` | `devnet`                        | Cluster shorthand (`mainnet \| devnet \| localnet \| custom`) |

Claude API key for AI error suggestions: set `ANTHROPIC_API_KEY` in your shell environment, or configure it in VS Code settings (stored in SecretStorage, never in plaintext).

---

## Competitive positioning

| Tool            | Where it works      | CPI graph      | Account diff      | Per-instruction CU | VS Code      | Test integration   |
| --------------- | ------------------- | -------------- | ----------------- | ------------------ | ------------ | ------------------ |
| **SolScope**    | Any tx, anywhere    | ✅ Interactive | ✅ Full data diff | ✅ Flamegraph      | ✅ Extension | ✅ LiteSVM wrapper |
| Helius Orb      | Web browser         | ❌ Flat list   | ❌ Balance only   | ❌                 | ❌           | ❌                 |
| Seer            | Custom RPC required | ❌             | ❌                | ❌                 | ❌           | ❌                 |
| Surfpool Studio | Local env only      | ❌             | ✅ Byte-level     | ❌                 | ❌           | ❌                 |
| Phalcon         | Web browser         | ✅ Multi-level | ❌ Balance only   | ❌                 | ❌           | ❌                 |

---

## Contributing

This project is built for the [Colosseum April 2026 Hackathon](https://www.colosseum.org/). The build plan is in [`docs/`](./docs/solscope_5week_plan.md).

### Week-by-week build targets

- **Week 1 (Apr 6–12):** `@solscope/core` — fetch, CPI tree, account diff, CU parser + devnet fixture tests
- **Week 2 (Apr 13–19):** IDL resolution + `@solscope/vscode` CPI Graph panel (vis.js)
- **Week 3 (Apr 20–26):** `@solscope/cli` + Account Diff panel + CU Flamegraph panel
- **Week 4 (Apr 27–May 3):** Error explainer (Claude API) + `@solscope/litesvm` + Error panel
- **Week 5 (May 4–11):** Demo program, pitch video, npm publish, submission

### Before submitting a PR

```bash
pnpm build && pnpm test && pnpm lint
```

---

## License

MIT
