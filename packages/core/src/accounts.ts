import { Connection, PublicKey } from '@solana/web3.js'
import type { Message, MessageV0 } from '@solana/web3.js'

/**
 * Resolves the complete, ordered account key list for a transaction message.
 *
 * For **legacy** messages every key is static — returns `message.accountKeys` directly.
 *
 * For **v0** messages the full list is assembled in the order the runtime expects:
 *   1. Static keys (`message.staticAccountKeys`)
 *   2. For each ALT lookup (in declaration order): writable accounts, then readonly accounts
 *
 * ALTs are fetched in parallel.  If a table has been deactivated (its on-chain account no
 * longer exists) `PublicKey.default` (all-zeros) is used as a placeholder so downstream
 * index arithmetic stays intact and callers can detect the gap rather than crashing.
 *
 * @param message - The decoded transaction message (legacy `Message` or versioned `MessageV0`).
 * @param connection - An active RPC connection used only when ALT lookups are present.
 * @returns Ordered array of `PublicKey`s matching the index space referenced by instructions.
 */
export async function resolveAllAccountKeys(
  message: Message | MessageV0,
  connection: Connection,
): Promise<PublicKey[]> {
  // ── Legacy branch ──────────────────────────────────────────────────────────
  if (!('staticAccountKeys' in message)) {
    return (message as Message).accountKeys.map(toPublicKey)
  }

  // ── v0 branch ──────────────────────────────────────────────────────────────
  const v0 = message as MessageV0
  const keys: PublicKey[] = v0.staticAccountKeys.map(toPublicKey)

  if (!v0.addressTableLookups || v0.addressTableLookups.length === 0) {
    return keys
  }

  // Fetch every referenced ALT in parallel — one RPC round-trip per unique table.
  const results = await Promise.all(
    v0.addressTableLookups.map((lookup) =>
      connection
        .getAddressLookupTable(toPublicKey(lookup.accountKey))
        .then((r) => ({ lookup, addresses: r.value?.state.addresses ?? null })),
    ),
  )

  // Append accounts in runtime order: writable indexes first, readonly indexes second.
  for (const { lookup, addresses } of results) {
    for (const idx of lookup.writableIndexes) {
      keys.push(addresses?.[idx] ?? PublicKey.default)
    }
    for (const idx of lookup.readonlyIndexes) {
      keys.push(addresses?.[idx] ?? PublicKey.default)
    }
  }

  return keys
}

/** Normalises a key that may already be a PublicKey or a raw base-58 string. */
function toPublicKey(key: unknown): PublicKey {
  if (key instanceof PublicKey) return key
  return new PublicKey(key as string)
}
