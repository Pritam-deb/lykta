# @lykta/core

Solana transaction decoder. Fetches a transaction by signature and runs it through a full analysis pipeline: CPI tree reconstruction, account/token diffs, compute unit breakdown, and error resolution.

## What it does

Given a transaction signature and an RPC connection, `@lykta/core` produces a structured `LyktaTransaction` containing:

- **CPI tree** — nested call graph built from `innerInstructions`, with program names resolved from the registry
- **Decoded instructions** — Anchor instruction names and Borsh-decoded args when an on-chain IDL is available
- **Account diffs** — lamport balance changes per account (pre/post)
- **Token diffs** — BigInt-precise SPL token balance changes per mint/account
- **Compute units** — consumed/limit per top-level frame, with `isOverBudget` flag
- **Error** — 3-tier resolution: runtime string errors → Anchor custom codes → SPL Token error codes

## Installation

```sh
pnpm add @lykta/core
```

## Main entry points

### `decodeTransaction(signature, connection)`

The primary entry point. Fetches the raw RPC response and runs the full 9-step analysis pipeline.

```ts
import { Connection } from '@solana/web3.js'
import { decodeTransaction } from '@lykta/core'

const connection = new Connection('https://api.mainnet-beta.solana.com')
const tx = await decodeTransaction(
  '5KtP4R8dg1a7HmcP5Q9wJtMWwVBwmhHsDQdqNP7PbmEm',
  connection,
)

console.log(tx.success)              // true
console.log(tx.totalCu)             // 150
console.log(tx.cpiTree[0].programId) // '11111111111111111111111111111111'
```

### `parseCpiTree(logMessages)`

Reconstructs the CPI call tree from `meta.logMessages` alone — no `innerInstructions` required. Each node includes `computeUnits`, `failed`, and `logsTruncated` when the validator cut logs short.

```ts
import { parseCpiTree } from '@lykta/core'

const tree = parseCpiTree(tx.raw.meta!.logMessages!)
// tree[0].programId, tree[0].children, tree[0].computeUnits.consumed …
```

### `resolveError(raw)`

3-tier error lookup against the built-in registry:

1. Named runtime errors (`'MissingRequiredSignature'`, `'ComputationalBudgetExceeded'`, …)
2. Anchor custom error codes (2000–2999 range + full Anchor error table)
3. SPL Token program error codes

```ts
import { resolveError } from '@lykta/core'

const err = resolveError(raw)
if (err) {
  console.log(err.code)    // 2000 or 'MissingRequiredSignature'
  console.log(err.name)    // 'ConstraintMut'
  console.log(err.message) // 'A mut constraint was violated.'
  console.log(err.programId)
}
```

### `computeTokenDiffs(raw)`

BigInt-precise SPL token balance deltas. Avoids float rounding on large token amounts.

```ts
import { computeTokenDiffs } from '@lykta/core'

const diffs = computeTokenDiffs(raw)
for (const d of diffs) {
  console.log(d.mint, d.delta, d.uiDelta)
  // 'EPjFWdd5...', -5000000n, '-5.000000'
}
```

## Splitting fetch from decode

`decodeTransactionFromRaw` runs the same pipeline on a pre-fetched `VersionedTransactionResponse`. Useful for injecting fixture data in tests without hitting the network.

```ts
import { fetchRawTransaction, decodeTransactionFromRaw } from '@lykta/core'

const raw = await fetchRawTransaction(signature, connection)
const tx  = await decodeTransactionFromRaw(raw, connection)
```

## Output shape (`LyktaTransaction`)

```ts
interface LyktaTransaction {
  signature:           string
  slot:                number
  blockTime:           number | null
  success:             boolean
  fee:                 number
  cpiTree:             CpiNode[]
  decodedInstructions: DecodedInstruction[]
  accountDiffs:        AccountDiff[]
  tokenDiffs:          TokenDiff[]
  cuUsage:             CuUsage[]
  totalCu:             number
  error?:              LyktaError
  raw:                 VersionedTransactionResponse
}
```

## Graceful degradation

- No on-chain IDL → instructions are returned with `matched: false` and `name: null`; raw hex is always present
- ALT lookup fails → ALT slots fall back to `PublicKey.default`; static keys are unaffected
- Log truncation → affected `CpiNode`s are marked `logsTruncated: true` and the tree is flushed to preserve structure
