import type { Connection, VersionedTransactionResponse } from '@solana/web3.js'
import type { AccountDiff, TokenDiff } from './types.js'

// ── Shared helpers ────────────────────────────────────────────────────────────

function messageAccountKeys(tx: VersionedTransactionResponse): string[] {
  const message = tx.transaction.message
  const toStr = (k: unknown): string =>
    typeof k === 'string' ? k : (k as { toBase58(): string }).toBase58()
  return 'staticAccountKeys' in message
    ? message.staticAccountKeys.map(toStr)
    : (message as { accountKeys: unknown[] }).accountKeys.map(toStr)
}

/**
 * Formats a signed BigInt token delta as a human-readable decimal string.
 *
 * @example formatUiDelta(-5000000n, 6) → "-5.000000"
 * @example formatUiDelta(0n, 9)        → "0.000000000"
 */
function formatUiDelta(delta: bigint, decimals: number): string {
  if (decimals === 0) return delta.toString()
  const sign = delta < 0n ? '-' : ''
  const abs  = delta < 0n ? -delta : delta
  const div  = 10n ** BigInt(decimals)
  const whole = abs / div
  const frac  = (abs % div).toString().padStart(decimals, '0')
  return `${sign}${whole}.${frac}`
}

// ── computeAccountDiffs ───────────────────────────────────────────────────────

/**
 * Returns a lamport-level diff for every account in the transaction.
 *
 * This is a synchronous, pure alternative to `extractAccountDiffs` that
 * requires no `Connection` and covers only the `pre/postBalances` arrays.
 * Token balance changes are handled separately by `computeTokenDiffs`.
 */
export function computeAccountDiffs(tx: VersionedTransactionResponse): AccountDiff[] {
  const accountKeys  = messageAccountKeys(tx)
  const preBalances  = tx.meta?.preBalances  ?? []
  const postBalances = tx.meta?.postBalances ?? []

  const diffs: AccountDiff[] = []
  for (let i = 0; i < accountKeys.length; i++) {
    const address = accountKeys[i]
    if (!address) continue
    const pre  = preBalances[i]  ?? 0
    const post = postBalances[i] ?? 0
    diffs.push({ address, lamports: { pre, post, delta: post - pre } })
  }
  return diffs
}

// ── computeTokenDiffs ─────────────────────────────────────────────────────────

/**
 * Returns a `TokenDiff` for every SPL token account touched by the transaction.
 *
 * Differences from the float-based token delta in `extractAccountDiffs`:
 * - `delta` is a `bigint` computed from the raw `amount` strings — no floating-
 *   point rounding, even for 18-decimal tokens.
 * - `uiDelta` is a formatted decimal string derived from the BigInt, not from
 *   subtracting `uiAmountString` values.
 * - Accounts that appear only in post (newly created) or only in pre (closed)
 *   are included with the missing side defaulting to `0n`.
 *
 * Results are ordered by `accountIndex` ascending.
 */
export function computeTokenDiffs(tx: VersionedTransactionResponse): TokenDiff[] {
  const accountKeys       = messageAccountKeys(tx)
  const preTokenBalances  = tx.meta?.preTokenBalances  ?? []
  const postTokenBalances = tx.meta?.postTokenBalances ?? []

  const preMap  = new Map(preTokenBalances.map((b) => [b.accountIndex, b]))
  const postMap = new Map(postTokenBalances.map((b) => [b.accountIndex, b]))

  const indexes = new Set([
    ...preTokenBalances.map((b) => b.accountIndex),
    ...postTokenBalances.map((b) => b.accountIndex),
  ])

  const diffs: TokenDiff[] = []
  for (const idx of indexes) {
    const pre  = preMap.get(idx)
    const post = postMap.get(idx)
    const preAmount  = BigInt(pre?.uiTokenAmount.amount  ?? '0')
    const postAmount = BigInt(post?.uiTokenAmount.amount ?? '0')
    const delta      = postAmount - preAmount
    const decimals   = post?.uiTokenAmount.decimals ?? pre?.uiTokenAmount.decimals ?? 0
    diffs.push({
      accountIndex: idx,
      address:  accountKeys[idx] ?? 'unknown',
      mint:     post?.mint  ?? pre?.mint  ?? '',
      owner:    (post?.owner ?? pre?.owner) ?? '',
      decimals,
      preAmount,
      postAmount,
      delta,
      uiDelta: formatUiDelta(delta, decimals),
    })
  }

  return diffs.sort((a, b) => a.accountIndex - b.accountIndex)
}

/**
 * Extracts pre/post account state diffs for all accounts touched by the transaction.
 * For token accounts, includes token balance deltas.
 */
export async function extractAccountDiffs(
  tx: VersionedTransactionResponse,
  connection: Connection,
): Promise<AccountDiff[]> {
  const message = tx.transaction.message
  const toStr = (k: unknown): string =>
    typeof k === 'string' ? k : (k as { toBase58(): string }).toBase58()

  const accountKeys =
    'staticAccountKeys' in message
      ? message.staticAccountKeys.map(toStr)
      : (message as { accountKeys: unknown[] }).accountKeys.map(toStr)

  const preBalances = tx.meta?.preBalances ?? []
  const postBalances = tx.meta?.postBalances ?? []
  const preTokenBalances = tx.meta?.preTokenBalances ?? []
  const postTokenBalances = tx.meta?.postTokenBalances ?? []

  // Build token balance lookup by account index
  const preToken = new Map(preTokenBalances.map((b) => [b.accountIndex, b]))
  const postToken = new Map(postTokenBalances.map((b) => [b.accountIndex, b]))

  const diffs: AccountDiff[] = []

  for (let i = 0; i < accountKeys.length; i++) {
    const address = accountKeys[i]
    if (!address) continue

    const pre = preBalances[i] ?? 0
    const post = postBalances[i] ?? 0

    const tokenPre = preToken.get(i)
    const tokenPost = postToken.get(i)

    const diff: AccountDiff = {
      address,
      lamports: { pre, post, delta: post - pre },
    }

    if (tokenPre ?? tokenPost) {
      const mint = tokenPost?.mint ?? tokenPre?.mint ?? ''
      const decimals = tokenPost?.uiTokenAmount.decimals ?? tokenPre?.uiTokenAmount.decimals ?? 0
      diff.tokenBalance = {
        mint,
        pre: tokenPre?.uiTokenAmount.uiAmountString ?? '0',
        post: tokenPost?.uiTokenAmount.uiAmountString ?? '0',
        delta: String(
          parseFloat(tokenPost?.uiTokenAmount.uiAmountString ?? '0') -
            parseFloat(tokenPre?.uiTokenAmount.uiAmountString ?? '0'),
        ),
        decimals,
      }
    }

    diffs.push(diff)
  }

  return diffs
}
