# SolScope — 5-Week Hackathon Build Plan
## Colosseum April 2026 · April 6 – May 11, 2026

---

## Context

SolScope is a developer observability suite for Solana — competing in the Colosseum April 2026 hackathon (Infrastructure track). The core gap it fills: no tool today brings transaction-level visibility (CPI graphs, account diffs, per-instruction compute units, error explanation) into the IDE, CLI, or test framework. The main competitors — Helius Orb (web only), Seer (custom RPC required), Surfpool Studio (local-only) — all have a critical limitation SolScope can exploit: **none work on any transaction, anywhere, from inside VS Code**.

Key constraints:
- 5 weeks (April 6 – May 11)
- Team: Pritam + 1 teammate
- Stack: ~80% TypeScript, ~20% Rust/Anchor (only for sample programs, not SolScope itself)
- Bankrun is deprecated — must use **LiteSVM** throughout
- Seer already owns "Tenderly for Solana" framing — SolScope's pitch is **"observability anywhere, inside your workflow"**

---

## Monorepo Package Structure

```
solscope/
├── packages/
│   ├── core/         → @solscope/core      (Pritam — primary)
│   ├── vscode/       → @solscope/vscode    (Teammate — primary)
│   ├── cli/          → @solscope/cli       (Pritam)
│   └── litesvm/      → @solscope/litesvm   (Pritam)
├── apps/
│   └── demo/         → demo Anchor program for showcase
└── turbo.json / pnpm-workspace.yaml
```

---

## Week 1 — Foundation & Core Engine (April 6–12)

**Goal:** Working decode pipeline and data structures. By Friday you can paste any transaction signature and get back a structured object.

### Both (Day 1–2)
- [ ] Init monorepo (`pnpm` + Turborepo)
- [ ] Scaffold all 4 packages with TypeScript + tsup build config
- [ ] Set up shared eslint/prettier/tsconfig
- [ ] Write and deploy a demo Anchor program to devnet (counter + token mint) — this is the test subject for the entire project

### Pritam — `@solscope/core`
- [ ] `fetchTransaction(signature, connection)` — wrap `getTransaction` with `maxSupportedTransactionVersion: 0`
- [ ] `decodeMeta(tx)` — extract accounts, signers, fee payer, recent blockhash, pre/post balances
- [ ] `buildCpiTree(tx)` — parse inner instructions into a nested tree structure (`CpiNode[]`)
  - Each node: `programId`, `instruction data`, `accounts`, `depth`, `children[]`
  - Use `innerInstructions` array from `TransactionResponse`
- [ ] `extractAccountDiffs(tx)` — compare `preTokenBalances`/`postTokenBalances` + raw account data snapshots
  - Fetch account state at slot N-1 and slot N via `getAccountInfo` with commitment
- [ ] `parseCuUsage(tx)` — extract per-instruction compute unit consumption from log messages
  - Parse `ComputeBudget: consumed X of Y` lines in `logMessages`
  - Map CU to instruction index
- [ ] Write unit tests using recorded devnet transaction fixtures (commit JSON snapshots)

### Teammate — `@solscope/vscode` scaffolding
- [ ] Init VS Code extension (`yo code`, TypeScript template)
- [ ] Get a Hello World WebView panel rendering in VS Code
- [ ] Learn VS Code WebView message-passing API (panel ↔ extension host)
- [ ] Read existing extensions for reference: Gimlet, Ackee Blockchain extension

**End-of-week checkpoint:** `core` can decode a real devnet transaction into a typed `SolScopeTransaction` object. Extension can open a blank WebView panel.

---

## Week 2 — CPI Graph & VS Code Views (April 13–19)

**Goal:** The primary "aha moment" — an interactive CPI call tree visible inside VS Code. This is the demo centerpiece.

### Pritam — `@solscope/core` (continued)
- [ ] `resolveIdl(programId)` — fetch verified Anchor IDL from chain (use `@coral-xyz/anchor` `Program.fetchIdl`)
  - Fallback: fetch from `api.shyft.to` or `anchor.so` API
- [ ] `decodeInstruction(ix, idl)` — decode instruction data bytes using IDL discriminator + borsh layout
- [ ] `buildCpiGraph(cpiTree, idls)` — annotate each CPI node with decoded instruction name + args
- [ ] Export `SolScopeTransaction` type (the full enriched object the VS Code views consume)

### Teammate — `@solscope/vscode` — CPI Graph panel
- [ ] WebView React app (bundled with esbuild inside the extension)
- [ ] **CPI Graph view** using `vis.js` Network or `D3.js` hierarchical tree
  - Nodes: program name (resolved from IDL), instruction name, depth level
  - Edges: parent → child CPI call
  - Click a node → side panel shows instruction args, accounts list
  - Color coding: system programs (gray), user programs (blue), failed nodes (red)
- [ ] VS Code command: `SolScope: Inspect Transaction` → prompts for signature → fetches via `core` → renders graph
- [ ] VS Code sidebar tree view showing all instructions in flat list (fallback if WebView fails)

**End-of-week checkpoint:** Paste a signature in VS Code command palette → interactive CPI tree renders in a panel. Record a 30-second screen capture.

---

## Week 3 — Account Diffs, CU Flamegraph & CLI (April 20–26)

**Goal:** Complete the three core novel features. Add CLI.

### Pritam — `@solscope/cli`
- [ ] `npx solscope inspect <signature> [--cluster devnet|mainnet|localnet]`
  - Terminal table output: instructions, programs, accounts touched
  - ASCII CPI tree (using `treeify` or manual indent rendering)
  - Per-instruction CU bar chart in terminal (use `cli-progress` or sparklines)
- [ ] `npx solscope diff <signature>` — show account state diffs as colored table (pre → post)
- [ ] `npx solscope error <signature>` — decode error code + show plain-English explanation (stub Claude call for now, wire up Week 4)
- [ ] Config file support (`solscope.config.json`) for RPC URL, default cluster

### Teammate — `@solscope/vscode` — Diff & CU views
- [ ] **Account Diff panel** — two-column before/after view for each account touched
  - Show: lamport change, owner change, data diff (hex + decoded via IDL if possible)
  - Highlight changed bytes in red/green
- [ ] **Compute Unit Flamegraph panel** — horizontal bar chart per instruction
  - Show: instruction name, CU consumed, % of total budget
  - Color: green (<50%), yellow (50–80%), red (>80%)
  - Click bar → jump to that instruction in CPI graph

**End-of-week checkpoint:** All three novel features work end-to-end. CLI can inspect any devnet transaction. VS Code shows diff + CU views alongside CPI graph.

---

## Week 4 — Error Explainer, LiteSVM & Integration (April 27–May 3)

**Goal:** Complete the developer workflow loop — from test failure to fix suggestion.

### Pritam — Error Explainer + `@solscope/litesvm`
- [ ] **Error explainer** in `@solscope/core`:
  - `explainError(tx, connection)` — maps error codes to plain English
  - Known error map: Anchor error codes, SPL Token errors, System Program errors
  - Claude API integration: call `claude-sonnet-4-6` with context: logs + IDL + error code → get fix suggestion
  - Prompt template: include program source context if available, IDL, full log messages
- [ ] **`@solscope/litesvm`** package:
  - Wrap `litesvm` npm package (v0.5.0+)
  - Override `sendTransaction` to capture pre/post account state
  - On failure: auto-call `explainError`, print enhanced error with CPI tree + suggestion
  - Export `SolScopeTestContext` that extends LiteSVM's test context
  - Example usage:
    ```ts
    const ctx = new SolScopeTestContext();
    await ctx.processTransaction(tx); // enhanced errors on failure
    ```

### Teammate — `@solscope/vscode` — Error Panel + polish
- [ ] **Error explanation panel** — shown when transaction failed
  - Display: raw error code, program that threw, plain-English explanation, Claude-generated fix suggestion
  - Copy-to-clipboard button for the fix suggestion
- [ ] Polish all three panels (CPI graph, Account Diff, CU Flamegraph)
- [ ] VS Code status bar item showing cluster + last inspected transaction
- [ ] VS Code settings: RPC URL, Claude API key input, default cluster

**End-of-week checkpoint:** Write a failing LiteSVM test in VS Code → SolScope auto-renders why it failed with a suggested fix. Full loop works.

---

## Week 5 — Demo, Pitch & Polish (May 4–11)

**Goal:** Submission-ready. Every feature works on real transactions. Videos recorded.

### Both — Integration & Demo Program
- [ ] Build a non-trivial demo Anchor program that exercises all SolScope features:
  - Uses CPIs (calls SPL Token, calls a second program)
  - Has a failing path with an interesting error
  - Uses Token-2022 if time permits
- [ ] Run the demo program through every SolScope feature — fix all edge cases found
- [ ] Write a comprehensive README with installation, usage examples, and screenshots
- [ ] Publish packages to npm (use `@solscope/` scope, public access)

### Pritam — Stretch goals (if ahead of schedule)
- [ ] `npx solscope watch <program-id>` — subscribe to program logs via WebSocket, stream new transactions through the decode pipeline in real-time (addresses Solana Foundation Post-Deployment Monitoring RFP directly)
- [ ] **Token-2022 extension decoder** — specialized decoding for Transfer Hooks, CPI Guard failures

### Teammate — Pitch materials
- [ ] **3-minute pitch video** (most important submission asset):
  - Problem framing: "Your Anchor test fails. You get a log dump. Where do you start?"
  - Demo: failing test → SolScope renders CPI tree + error explanation + fix → fixed test
  - Competitive framing: "Helius Orb explains in browser. Seer needs its RPC. SolScope works everywhere, inside your editor."
- [ ] **2-3 minute technical demo video**:
  - Screen recording: inspect a mainnet transaction signature in VS Code
  - Show CPI graph, CU flamegraph, account diff, error explanation — all in one session
- [ ] GitHub repo: clean commit history, good README, working CI

**Submission deadline: May 11, 2026**

---

## Team Split Summary

| Week | Pritam | Teammate |
|------|--------|----------|
| 1 | `@solscope/core` — fetch + decode + CPI tree + account diff + CU parser | VS Code extension scaffold + WebView basics |
| 2 | IDL resolution + instruction decoding + graph data structure | CPI Graph panel (vis.js/D3) |
| 3 | CLI tool (`inspect`, `diff`, `error` commands) | Account Diff panel + CU Flamegraph panel |
| 4 | Error explainer (Claude API) + `@solscope/litesvm` | Error panel + VS Code polish + settings |
| 5 | Stretch goals + npm publish + integration fixes | Pitch video + technical demo video + README |

---

## Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Monorepo tool | pnpm + Turborepo | Standard for multi-package TS monorepos |
| CPI graph rendering | vis.js Network | Easier than D3 for tree+graph hybrid, good WebView support |
| VS Code WebView bundler | esbuild | Fast, simple for React in extensions |
| Test framework integration | LiteSVM (not Bankrun) | Bankrun deprecated March 2025 |
| Error AI | Claude API (`claude-sonnet-4-6`) | Best Solana context, already used by Helius Orb's web explainer |
| IDL resolution | `@coral-xyz/anchor` `Program.fetchIdl` | Official, handles on-chain IDL storage |
| Account data diff | Fetch `getAccountInfo` at adjacent slots | Only reliable method for devnet/mainnet |
| CU extraction | Parse `logMessages` for `ComputeBudget: consumed` | Stable, no SVM internals needed |

---

## Critical Risks

1. **IDL resolution may fail for unverified programs** — build a fallback that shows raw bytes + hex
2. **Per-instruction CU extraction from logs** is parsing-fragile — test with many transaction types early
3. **VS Code WebView sandboxing** restricts outbound network calls — all RPC calls must go through the extension host, not the WebView
4. **Claude API key management in VS Code** — use `vscode.workspace.getConfiguration` + SecretStorage, never hardcode
5. **Seer launches publicly in Feb 2026** — monitor their feature set; if they ship VS Code integration before May, lean harder into LiteSVM integration and `solscope watch`

---

## Verification Checklist (before submission)

- [ ] `@solscope/core`: unit tests pass on 5+ recorded devnet transaction fixtures (simple transfer, Anchor CPI, failed tx, Token-2022 tx)
- [ ] `@solscope/cli`: `npx solscope inspect <real-mainnet-sig>` renders without crash
- [ ] `@solscope/vscode`: extension activates, all 4 panels open on a real devnet signature
- [ ] `@solscope/litesvm`: failing LiteSVM test shows enhanced error output with suggestion
- [ ] All 4 packages published to npm and importable
- [ ] GitHub repo is public, has README, CI passes
- [ ] Both videos recorded and under size limits
- [ ] Pitch video leads with the CPI graph "aha moment" and the competitive framing
