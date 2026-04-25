# Week 3 Hand-off Note

**Date:** 2026-04-06
**From:** Pritam (CLI + core)
**To:** VS Code extension (Week 4)

---

## What's shipped

`@lykta/core@0.3.0` and `@lykta/cli@0.3.0` are published to npm and tagged `v0.3.0` on GitHub. The core package implements the full 9-step decode pipeline (`decodeTransaction`): it resolves account keys, builds the CPI call tree, fetches on-chain Anchor IDLs, decodes instruction args via Borsh, computes lamport and SPL token diffs, extracts per-instruction compute unit breakdowns with `isOverBudget`, and resolves errors through a 4-tier registry (runtime string errors → Anchor built-ins → System Program → SPL Token → IDL lookup → Claude fallback). The CLI wraps this with four commands — `inspect`, `diff`, `error`, and `watch` — all rendering from a shared `renderInspect()` function; `error --ai` gates the Claude suggestion behind an explicit flag and `watch` uses `Connection.onLogs` for live websocket streaming with an `--errors-only` filter. All 161 unit tests pass (0 skipped); the Claude path is covered via `vi.mock` so no API key is needed in CI.

## What's stubbed

- **Claude suggestion in `error` command** requires `ANTHROPIC_API_KEY` in env plus the `--ai` flag — not auto-enabled.
- **`@lykta/litesvm`** package exists as a directory but has no implementation yet (Week 4 task).
- **IDL fetch in `watch`** runs the full pipeline per tx which can hit public RPC rate limits under load — a paid RPC endpoint is recommended.

---

## Interface contract for the VS Code extension

The extension host should import from `@lykta/core`. Three functions cover everything the panels need:

### 1. `decodeTransaction(signature, connection)`

```ts
import { decodeTransaction } from '@lykta/core'
import type { LyktaTransaction } from '@lykta/core'

const tx: LyktaTransaction = await decodeTransaction(signature, connection)
```

Returns the complete `LyktaTransaction` — every panel reads from this single object:

| Panel | Field |
|-------|-------|
| CPI Graph | `tx.cpiTree: CpiNode[]` — nested tree; `node.programName`, `node.instructionName`, `node.args`, `node.failed` |
| Instructions | `tx.decodedInstructions: DecodedInstruction[]` — flat list with `matched`, `name`, `args`, `rawHex` |
| Account Diffs | `tx.accountDiffs: AccountDiff[]` — `lamports.pre/post/delta`, `tokenBalance` |
| Token Diffs | `tx.tokenDiffs: TokenDiff[]` — BigInt `delta`, `uiDelta` string, `mint`, `owner` |
| Compute | `tx.cuUsage: CuUsage[]` — `consumed`, `limit`, `percentUsed`, `isOverBudget` |
| Status bar | `tx.success`, `tx.slot`, `tx.fee`, `tx.totalCu` |

### 2. `explainError(tx, connection, idlMap?, claudeApiKey?)`

```ts
import { explainError } from '@lykta/core'
import type { LyktaError } from '@lykta/core'

const error: LyktaError | undefined = await explainError(
  tx,
  connection,
  idlMap,                            // Map<string, Idl | null> — pass null values for programs with no IDL
  secretStorage.get('ANTHROPIC_KEY') // omit or pass '' to skip Claude
)
```

Returns a `LyktaError` with `code`, `programId`, `name?`, `message`, and `suggestion?` (AI text, only present when a key is passed and Claude succeeds). Returns `undefined` for successful transactions. The error panel should render `suggestion` in a separate block with a spinner while the async call resolves.

### 3. `decodeTransactionFromRaw(raw, connection)`

```ts
import { decodeTransactionFromRaw } from '@lykta/core'

// Use this when you already have the VersionedTransactionResponse
// (e.g. from a cached RPC response or a test fixture) to avoid a double fetch.
const tx = await decodeTransactionFromRaw(raw, connection)
```

Same output as `decodeTransaction` but accepts a pre-fetched `VersionedTransactionResponse`. Useful for the extension's "refresh" flow where the raw tx is cached and only re-decoding is needed without hitting the RPC again.

---

## Key types to import

```ts
import type {
  LyktaTransaction,   // the main decoded payload — send this to every WebView
  LyktaError,         // error panel shape
  CpiNode,            // recursive tree node for the CPI graph
  CuUsage,            // per-instruction compute unit entry
  AccountDiff,        // lamport + token balance diff per account
  TokenDiff,          // BigInt-precise SPL token delta
  DecodedInstruction, // IDL-decoded instruction with args
} from '@lykta/core'
```

> **Note on BigInt:** `TokenDiff.delta`, `preAmount`, and `postAmount` are `bigint`. Use `diff.uiDelta` (a pre-formatted signed decimal string) for display. Serialise via `JSON.stringify` with a BigInt replacer (`(_, v) => typeof v === 'bigint' ? v.toString() : v`) before passing to `panel.webview.postMessage()`.
