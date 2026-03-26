# SolScope Demo Program

A non-trivial Anchor program used as the live demo subject for SolScope features.

## What it does

- Counter instructions that call into a second program via CPI (exercises the CPI graph)
- Token mint operations via SPL Token CPI (exercises account diffs)
- A deliberately failable path with a custom Anchor error (exercises the error explainer)
- Uses Token-2022 Transfer Hooks if available (exercises Token-2022 decoding)

## Week 1 task

Deploy this program to devnet and record the transaction signatures of interesting operations.
Commit the signatures into `packages/core/tests/fixtures/` as JSON snapshots.

## Deploy

```bash
anchor build
anchor deploy --provider.cluster devnet
```
