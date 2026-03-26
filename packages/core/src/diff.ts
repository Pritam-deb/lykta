import type { Connection, VersionedTransactionResponse } from '@solana/web3.js'
import type { AccountDiff } from './types.js'

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
