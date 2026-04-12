# @lykta/litesvm

LiteSVM wrapper that gives your Solana tests enriched error output — CPI call trees, compute unit usage, account diffs, and root-cause failure messages — without changing how you write tests.

## Install

```bash
npm install @lykta/litesvm litesvm
# or
pnpm add @lykta/litesvm litesvm
```

## Drop-in replacement

**Before** — raw LiteSVM, cryptic failure output:

```ts
import { LiteSVM } from 'litesvm'

const svm = new LiteSVM().withSysvars().withBuiltins().withDefaultPrograms()
svm.airdrop(wallet.publicKey, 10_000_000_000n)
svm.sendTransaction(tx) // throws with a raw NAPI error object
```

**After** — one import swap, structured output on failure:

```ts
import { LyktaTestContext } from '@lykta/litesvm'

const ctx = new LyktaTestContext()
ctx.airdrop(wallet.publicKey, 10_000_000_000n)
const result = await ctx.processTransaction(tx)

if (!result.success) {
  console.log(result.summary) // prints the block below
}
```

## What failure output looks like

When a transaction fails, `result.summary` contains a structured report printed straight to your test runner:

```
✗ Transaction failed — slot 42

Error: ConstraintMut (code 2000) @ myProgram1111…
Message: A mut constraint was violated

CPI Tree:
  [0] myProgram1111… (deposit)
    └─ [1] TokenkegQf… (transfer)
         failed: custom program error: 0x7D0

Compute Units: 8 412 / 200 000 (4%)

Account Diffs:
  9WzDXw…  Δ lamports: -5 000
  vault11…  Δ lamports: +5 000
```

`sendAndConfirm` (via `LyktaProvider`) also writes the root-cause block to stderr immediately on failure so you see it inline in test output before the assertion fires:

```
✗ myProgram1111… failed
  Reason: custom program error: 0x7D0
  Last logs:
    Program myProgram1111… invoke [1]
    Program log: AnchorError occurred. Error Code: ConstraintMut. Error Number: 2000.
    Program myProgram1111… failed: custom program error: 0x7D0
```

## API

### `LyktaTestContext` — full observability pipeline

```ts
import { LyktaTestContext } from '@lykta/litesvm'

const ctx = new LyktaTestContext()

// Load a compiled program binary
ctx.loadProgram(programId, fs.readFileSync('target/deploy/my_program.so'))

// Fund accounts
ctx.airdrop(wallet.publicKey, 10_000_000_000n)

// Send and decode — never throws, always returns a result
const result = await ctx.processTransaction(tx)
// result.success  — boolean
// result.tx       — LyktaTransaction | null (CPI tree, account diffs, CU)
// result.summary  — formatted string ready to print
```

### `LyktaProvider` — send-and-throw with stderr output

Use this when you want the test to fail immediately on a bad transaction (the typical pattern in Anchor tests):

```ts
import { LyktaProvider } from '@lykta/litesvm'

const provider = new LyktaProvider()
provider.airdrop(wallet.publicKey, 10_000_000_000n)

// Throws with an enriched error message and writes the summary to stderr
const sig = provider.sendAndConfirm(tx)

// Retrieve the structured result after the fact
const result = provider.getResult(sig)
// result.signature   — base58 string
// result.success     — boolean
// result.errorSummary — formatted string | null
```

### Anchor compatibility

`LyktaProvider` exposes a minimal Anchor provider shim so you can use it with `anchor.setProvider`:

```ts
import * as anchor from '@coral-xyz/anchor'
import { LyktaProvider } from '@lykta/litesvm'

const provider = new LyktaProvider()
anchor.setProvider(provider.asAnchorProvider() as anchor.Provider)

const program = anchor.workspace.MyProgram as anchor.Program<MyProgram>
await program.methods.deposit(new BN(1000)).rpc()
```

## AI error suggestions

Set `GEMINI_API_KEY` in your environment and `processTransaction` will attach a plain-English explanation to unknown error codes:

```
AI Suggestion: The deposit instruction requires the vault account to be marked
mutable in the transaction. Ensure you pass `{ isSigner: false, isWritable: true }`
for the vault account key.
```

No key — no AI call. The rest of the output is unaffected.
