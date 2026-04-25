# Lykta

Solana transaction observability inside VS Code. Paste a transaction signature and instantly see the full CPI call tree, account balance diffs, compute unit usage, and plain-English error explanations — without leaving your editor.

## Install

Search **Lykta** in the VS Code Extensions panel, or:

```
ext install lykta.lykta
```

## Usage

1. Open the Command Palette (`⌘⇧P` / `Ctrl⇧P`)
2. Run **Lykta: Inspect Transaction**
3. Paste a transaction signature
4. The panel opens beside your editor

## Panels

**CPI Tree** — Expandable call tree showing every program invoked by the transaction. Failed nodes appear in red with the failure reason inline. Compute units consumed per frame shown on the right.

**Account Diff** — Pre/post SOL balances for every account touched, with signed deltas coloured green (credit) or red (debit). SPL token balance changes appear in a separate table below.

**Compute Meter** — Horizontal bar per top-level instruction showing CUs consumed vs limit. Green below 50%, amber 50–80%, red above 80%.

**Error** — Error name, code, program ID, and the full error message. If `GEMINI_API_KEY` is set in your environment, a two-sentence AI explanation appears below.

## Configuration

| Setting | Default | Description |
|---|---|---|
| `lykta.rpcUrl` | `https://api.devnet.solana.com` | RPC endpoint used to fetch transactions |
| `lykta.cluster` | `devnet` | Cluster hint (`mainnet`, `devnet`, `localnet`, `custom`) |

Change via **Settings** → search `lykta`.

## AI Error Suggestions

Set `GEMINI_API_KEY` in your shell environment before launching VS Code and the Error panel will include a plain-English suggestion for unknown error codes.

## Source

[github.com/Pritam-deb/lykta](https://github.com/Pritam-deb/lykta)
