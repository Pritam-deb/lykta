# Plan: `escrow_vault` — Lykta Dogfood Program

## Context

We're building a fresh Solana Anchor program called `escrow_vault` whose sole purpose is to be used as a real debugging subject for the Lykta observability CLI. The developer will build the program, send transactions to devnet, encounter realistic failure modes, and use `lykta inspect / error / diff / watch` to diagnose them. This validates Lykta's DX end-to-end against a program that wasn't pre-designed for it.

---

## What the program does

A **milestone-based token escrow**: a payer locks SPL tokens into a program-owned vault. The recipient can only claim once they've completed N milestones AND a time-lock has expired — OR an arbiter has approved early release. Either the arbiter or payer can cancel and receive a refund, but only before any milestone is completed.

This is a realistic pattern (common in grants, freelance contracts, vesting). It naturally produces:
- Multi-depth CPI trees (SPL Token transfers inside `claim` / `cancel`)
- Meaningful account state diffs (counters, flags, timestamps, balances)
- Multiple custom errors mapping to real logic failures
- Scenarios where the on-chain state looks correct but the claim still fails (logic bugs)

---

## State

```rust
// state/escrow.rs
#[account]
#[derive(InitSpace)]
pub struct EscrowState {
    pub payer:                Pubkey,   // 32
    pub recipient:            Pubkey,   // 32
    pub arbiter:              Pubkey,   // 32
    pub mint:                 Pubkey,   // 32
    pub vault:                Pubkey,   // 32  — ATA address, stored for reference
    pub amount:               u64,      // 8
    pub milestones_required:  u8,       // 1
    pub milestones_completed: u8,       // 1
    pub unlock_timestamp:     i64,      // 8
    pub arbiter_approved:     bool,     // 1
    pub cancelled:            bool,     // 1
    pub bump:                 u8,       // 1
}
// Total data: 181 bytes. space = 8 + EscrowState::INIT_SPACE
```

**PDA seeds:** `[b"escrow", payer.key().as_ref(), mint.key().as_ref()]`
**Vault ATA:** Standard ATA, `associated_token::authority = escrow_state`

---

## Custom errors

```rust
// errors.rs
#[error_code]
pub enum EscrowError {
    #[msg("Caller is not the designated recipient")]
    NotRecipient,                  // 6000

    #[msg("Caller is not the designated arbiter")]
    NotArbiter,                    // 6001

    #[msg("Caller is not authorized to cancel")]
    NotAuthorizedToCancel,         // 6002

    #[msg("Escrow has been cancelled")]
    EscrowCancelled,               // 6003

    #[msg("Required milestones not yet completed")]
    MilestonesNotComplete,         // 6004

    #[msg("Unlock time has not been reached")]
    UnlockTimeNotReached,          // 6005

    #[msg("Arbiter has not approved early release")]
    ArbiterNotApproved,            // 6006

    #[msg("Escrow is already cancelled")]
    AlreadyCancelled,              // 6007

    #[msg("All milestones are already complete")]
    MilestoneAlreadyComplete,      // 6008

    #[msg("Vault has no tokens to release")]
    VaultEmpty,                    // 6009
}
```

---

## Instructions (5)

### `initialize_escrow`
Creates escrow PDA and vault ATA. Transfers `amount` tokens from payer ATA → vault via SPL Token CPI.
**Lykta shows:** depth-2 CPI tree (escrow_vault → spl_token::transfer). Account diff: escrow_state created, vault funded.

Accounts: `payer` (signer, mut), `recipient`, `arbiter`, `mint`, `escrow_state` (init, PDA), `vault` (init ATA), `payer_token_account` (mut), `token_program`, `associated_token_program`, `system_program`

### `complete_milestone`
Signed by recipient. Increments `milestones_completed`. Fails if: wrong signer, escrow cancelled, all milestones already done.
**Lykta shows:** diff of single field increment (`milestones_completed: N → N+1`). No CPI children.

### `claim`
Signed by recipient. Transfers vault → recipient ATA via `invoke_signed`. Auth: (`milestones_completed >= milestones_required` AND `Clock::unix_timestamp >= unlock_timestamp`) OR `arbiter_approved`.
**Lykta shows:** depth-2 CPI tree with `invoke_signed`. Diff: vault zeroed, recipient ATA funded.

`require!` checks in this order (order matters for which error surfaces):
1. `!escrow.cancelled` → `EscrowCancelled`
2. `escrow.recipient == authority.key()` → `NotRecipient`
3. milestones + time OR arbiter_approved
4. vault balance > 0 → `VaultEmpty`

### `arbiter_approve`
Signed by arbiter. Sets `arbiter_approved = true`. Does NOT auto-update `unlock_timestamp` — this is the intentional logic gap for failure mode #4.
**Lykta shows:** diff: `arbiter_approved false → true`, `unlock_timestamp` unchanged.

### `cancel`
Signed by arbiter or payer. Refunds vault → payer ATA via `invoke_signed`. Only allowed before any milestone is completed.
**Lykta shows:** depth-2 CPI tree. Diff: vault zeroed, payer ATA refunded, `cancelled: false → true`.

`require!` checks:
1. `!escrow.cancelled` → `AlreadyCancelled`
2. signer is payer or arbiter → `NotAuthorizedToCancel`
3. `milestones_completed == 0` → `MilestonesNotComplete`

---

## File structure

```
apps/demo/escrow_vault/
├── Anchor.toml
├── Cargo.toml                          (workspace, same profile as token_vault)
├── package.json                        (copy + rename from token_vault)
├── tsconfig.json                       (copy from token_vault, resolveJsonModule: true)
├── programs/escrow_vault/
│   ├── Cargo.toml                      (anchor-lang 0.31.1, anchor-spl 0.31.1)
│   └── src/
│       ├── lib.rs
│       ├── errors.rs
│       ├── state/
│       │   ├── mod.rs
│       │   └── escrow.rs
│       └── instructions/
│           ├── mod.rs                  (pub mod + pub use * for each)
│           ├── initialize.rs
│           ├── complete_milestone.rs
│           ├── claim.rs
│           ├── arbiter_approve.rs
│           └── cancel.rs
├── tests/
│   └── escrow_vault.ts                 (LiteSVM happy-path tests)
└── scripts/
    ├── devnet_flow.ts                  (end-to-end success path, prints sigs)
    └── trigger_failures.ts             (fires all 6 failure modes, prints lykta commands)
```

---

## Implementation order

1. **Scaffold** — `anchor init escrow_vault` inside `apps/demo/`, update Anchor.toml (`package_manager = "npm"`), Cargo.toml, package.json
2. **`state/escrow.rs`** — EscrowState with `InitSpace`
3. **`errors.rs`** — full error enum (all 10 variants)
4. **`initialize_escrow`** — first CPI, run `anchor build` to verify
5. **`complete_milestone`** — state mutation, no CPI
6. **`claim`** — `invoke_signed` CPI, most complex instruction
7. **`arbiter_approve`** — flag setter (deliberately no timestamp reset)
8. **`cancel`** — `invoke_signed` refund CPI
9. **`anchor build`** — confirm zero errors, zero unused warnings
10. **`tests/escrow_vault.ts`** — LiteSVM happy-path tests (same pattern as token_vault.ts)
11. **`scripts/devnet_flow.ts`** — print each sig with `lykta` commands
12. **`scripts/trigger_failures.ts`** — fire all 6 failures, print commands

---

## Failure modes and Lykta output

| # | Failure | How triggered | `lykta error` shows | `lykta inspect` tree | `lykta diff` |
|---|---------|---------------|--------------------|--------------------|--------------|
| 1 | Wrong signer on `claim` | Payer keypair used instead of recipient | Anchor `ConstraintSigner` or custom `NotRecipient` (6000) | Flat — no CPI fired | No account changes |
| 2 | Claim before unlock time | `unlock_timestamp = now + 60s`, claim immediately | Custom `UnlockTimeNotReached` (6005) | Flat — no CPI fired | No account changes |
| 3 | Bad PDA bump in `invoke_signed` | `trigger_failures.ts` builds raw instruction with wrong bump (255 vs stored) | SPL Token `PrivilegeEscalation` or `InvalidAccountData` | **Depth-2 failure** — fails inside `spl_token::transfer` node, mismatched authority pubkey visible | No account changes |
| 4 | Arbiter approves but claim still fails | `arbiter_approve` succeeds → `claim` called immediately | `UnlockTimeNotReached` despite `arbiter_approved = true` | Flat | Approve diff: `arbiter_approved false→true`. Claim diff: nothing changed |
| 5 | Double cancel | `cancel` called twice | Custom `AlreadyCancelled` (6007) | Flat on 2nd call | 1st cancel: vault→0, `cancelled: true`. 2nd cancel: no diff |
| 6 | Off-by-one milestone check | `milestones_required = 1`, one milestone completed, claim tries `>` instead of `>=` | Custom `MilestonesNotComplete` (6004) | Flat | Milestone diff: counter incremented. Claim diff: nothing |

Failure #3 (bad PDA bump) is the centrepiece — the CPI tree at depth 2 with the mismatched authority pubkey is invisible without tooling.

---

## Scripts detail

### `devnet_flow.ts` (happy path)
```
1. Airdrop SOL to payer, recipient, arbiter keypairs
2. Create mint (0 decimals), mint 1_000_000 tokens to payer ATA
3. initialize_escrow (milestones=2, unlock=now+5s, amount=500_000)
   → print: lykta inspect <sig> && lykta diff <sig>
4. complete_milestone (×2)
   → print: lykta diff <sig> after each
5. sleep 6s (past unlock time)
6. claim
   → print: lykta inspect <sig> && lykta diff <sig>
```

### `trigger_failures.ts` (failure modes)
Each section is isolated, catches the error, prints the signature and exact lykta command. Sections:
- A: wrong signer on claim
- B: claim before unlock time
- C: raw instruction with bump=255 (bypasses Anchor client auto-derivation)
- D: arbiter_approve → immediate claim
- E: double cancel
- F: off-by-one milestone (requires `milestones_required=1`, complete once, claim)

---

## Reused patterns from `token_vault`

| Pattern | Source file |
|---------|------------|
| `pub use instructions::*` in `lib.rs` to expose `__client_accounts_*` | `token_vault/src/lib.rs` |
| `#[derive(InitSpace)]` for space calculation | `token_vault/src/state.rs` |
| `require!` before CPI for shallow error trees | `token_vault/src/instructions/withdraw.rs` |
| `CpiContext::new_with_signer()` with PDA seeds | `token_vault/src/instructions/withdraw.rs` |
| LiteSVM `buildAndSign()` helper + `FailedTransactionMetadata` assertions | `token_vault/tests/token_vault.ts` |
| `package.json` deps (anchor 0.31.1, spl-token 0.4.9, mocha 11.1.0) | `token_vault/package.json` |
| `tsconfig.json` with `resolveJsonModule: true` | `token_vault/tsconfig.json` |

---

## Cargo.toml dependencies (program)

```toml
anchor-lang = { version = "0.31.1", features = ["init-if-needed"] }
anchor-spl  = { version = "0.31.1", features = ["token", "associated_token"] }
```

idl-build feature: `["anchor-lang/idl-build", "anchor-spl/idl-build"]`

---

## Critical files

- `apps/demo/escrow_vault/programs/escrow_vault/src/lib.rs`
- `apps/demo/escrow_vault/programs/escrow_vault/src/errors.rs`
- `apps/demo/escrow_vault/programs/escrow_vault/src/state/escrow.rs`
- `apps/demo/escrow_vault/programs/escrow_vault/src/instructions/claim.rs` ← most complex
- `apps/demo/escrow_vault/scripts/trigger_failures.ts` ← centrepiece for Lykta demo

---

## Verification

```bash
# 1. Build passes clean
cd apps/demo/escrow_vault && anchor build
# Expected: no errors, no unused-import warnings

# 2. LiteSVM tests pass
npx ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts
# Expected: all happy-path tests pass

# 3. Devnet deploy
solana config set --url devnet
anchor deploy
# Update declare_id! + Anchor.toml with new program ID, rebuild

# 4. Run happy-path script, confirm each printed sig resolves in Lykta
npx ts-node scripts/devnet_flow.ts
lykta inspect <sig> --cluster devnet

# 5. Run failure script, confirm each error is decoded correctly
npx ts-node scripts/trigger_failures.ts
lykta error <sig> --cluster devnet
```
