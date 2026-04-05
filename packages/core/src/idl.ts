import { inflateSync } from 'zlib'
import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import type { Idl } from '@coral-xyz/anchor'
import type { CpiNode } from './types.js'

// ── In-memory TTL cache ───────────────────────────────────────────────────────

interface CacheEntry {
  idl: Idl | null
  expiresAt: number
}

const _cache = new Map<string, CacheEntry>()

/** Default cache TTL: 5 minutes. Pass a custom value to `fetchIdl` to override. */
export const IDL_CACHE_TTL_MS = 5 * 60 * 1_000

// Reusable read-only provider wallet — no signing needed for IDL fetches.
const _dummyWallet = (() => {
  const kp = Keypair.generate()
  return {
    publicKey: kp.publicKey,
    signTransaction: async <T>(tx: T): Promise<T> => tx,
    signAllTransactions: async <T>(txs: T[]): Promise<T[]> => txs,
  }
})()

// ── Tier implementations ──────────────────────────────────────────────────────

/**
 * Tier 3: fetch the on-chain Anchor IDL account and decompress it.
 *
 * Anchor stores IDLs at a PDA derived from `["anchor:idl"]` seeds with the
 * program as the program_id.  The account data layout is:
 *   - 8  bytes  discriminator (skip)
 *   - 4  bytes  LE u32 data_len
 *   - N  bytes  zlib-compressed IDL JSON
 */
async function fetchFromOnChain(programId: string, connection: Connection): Promise<Idl | null> {
  try {
    const provider = new AnchorProvider(connection, _dummyWallet, AnchorProvider.defaultOptions())
    const idl = await Program.fetchIdl(programId, provider)
    return idl ?? null
  } catch {
    // Fall back to manual PDA + zlib decompress if anchor.fetchIdl fails
    // (e.g. older IDL format not recognised by the anchor library version)
    return fetchFromOnChainRaw(programId, connection)
  }
}

async function fetchFromOnChainRaw(
  programId: string,
  connection: Connection,
): Promise<Idl | null> {
  try {
    const [idlAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('anchor:idl')],
      new PublicKey(programId),
    )
    const accountInfo = await connection.getAccountInfo(idlAddress)
    if (!accountInfo) return null

    // Skip 8-byte discriminator, read 4-byte LE data length, then inflate.
    const dataWithoutDiscriminator = accountInfo.data.slice(8)
    const dataLen = dataWithoutDiscriminator.readUInt32LE(0)
    const compressed = dataWithoutDiscriminator.slice(4, 4 + dataLen)
    const json = inflateSync(compressed).toString('utf8')
    return JSON.parse(json) as Idl
  } catch {
    return null
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Resolves an Anchor IDL for `programId` using a 3-tier fallback chain:
 *
 *   1. **In-memory cache** — returns immediately if a non-expired entry exists.
 *   2. **On-chain PDA** — Anchor's `["anchor:idl"]` PDA, zlib-decompressed via
 *      `@coral-xyz/anchor` `Program.fetchIdl`, with a manual raw fallback for
 *      older IDL storage formats.
 *   3. **null** — cached so repeated calls don't retry immediately.
 *
 * A REST-API tier (anchor.so) was originally planned as tier 2 but removed because
 * anchor.so does not expose a public programmatic API.  A future tier could be added
 * here (e.g. Shyft, Helius metadata endpoints) once an API key is available.
 *
 * @param ttlMs  How long (ms) to cache the result. Defaults to `IDL_CACHE_TTL_MS` (5 min).
 */
export async function fetchIdl(
  programId: string,
  connection: Connection,
  ttlMs = IDL_CACHE_TTL_MS,
): Promise<Idl | null> {
  // Tier 1: cache
  const cached = _cache.get(programId)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.idl
  }

  // Tier 2: on-chain Anchor IDL PDA
  const idl: Idl | null = await fetchFromOnChain(programId, connection)

  // Tier 4: null — store so we don't hammer the network on repeated misses
  _cache.set(programId, { idl, expiresAt: Date.now() + ttlMs })
  return idl
}

/**
 * Fetches IDLs for multiple programs in parallel using `Promise.allSettled`.
 * Rejected promises (e.g. transient network errors) are treated as `null`.
 *
 * @returns A `Map<programId, Idl | null>` with an entry for every requested ID.
 */
export async function fetchIdlsForPrograms(
  programIds: string[],
  connection: Connection,
  ttlMs = IDL_CACHE_TTL_MS,
): Promise<Map<string, Idl | null>> {
  const results = await Promise.allSettled(
    programIds.map((id) => fetchIdl(id, connection, ttlMs)),
  )

  const map = new Map<string, Idl | null>()
  results.forEach((result, i) => {
    const id = programIds[i]!
    map.set(id, result.status === 'fulfilled' ? result.value : null)
  })
  return map
}

/**
 * Decodes a CPI node's instruction data using a resolved IDL.
 * Annotates the node with instructionName and args in-place.
 *
 * TODO (Week 3+): implement using borsh + IDL discriminator lookup
 */
export function decodeInstruction(node: CpiNode, _idl: Idl): CpiNode {
  return node
}

/**
 * @deprecated Use `fetchIdl` instead.
 * Kept for backwards compatibility with existing exports.
 */
export async function resolveIdl(
  programId: string,
  connection: Connection,
): Promise<Record<string, unknown> | null> {
  return fetchIdl(programId, connection) as Promise<Record<string, unknown> | null>
}
