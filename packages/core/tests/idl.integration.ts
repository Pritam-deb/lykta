/**
 * IDL resolution integration tests — fetches real Anchor IDLs from mainnet on-chain PDAs.
 * Run with: pnpm test:integration
 *
 * Programs selected because they store their IDL on-chain via the standard
 * Anchor `["anchor:idl"]` PDA and are deployed on both mainnet and devnet.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { Connection } from '@solana/web3.js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { fetchIdl, fetchIdlsForPrograms } from '../src/idl.js'

config({ path: resolve(__dirname, '../../../.env') })

// Five programs confirmed to have on-chain Anchor IDLs
const DRIFT_V2 = 'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH'     // 245 instructions
const ORCA_WHIRLPOOL = 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc' // 46 instructions
const SQUADS = 'SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu'          // 15 instructions
const MANGO_V4 = '4MangoMjqJ2firMokCjjGgoK8d4MXcrgL7XJaL3w6fVg'       // 102 instructions
const MARINADE = 'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD'         // 29 instructions

describe('IDL resolution pipeline', () => {
  let connection: Connection

  beforeAll(() => {
    const url = process.env.HELIUS_RPC_URL
    if (!url) throw new Error('HELIUS_RPC_URL is not set in .env')
    connection = new Connection(url, 'confirmed')
  })

  it('fetches Drift v2 IDL and finds core instruction names', async () => {
    const idl = await fetchIdl(DRIFT_V2, connection)

    expect(idl).not.toBeNull()
    expect(Array.isArray(idl!.instructions)).toBe(true)
    expect(idl!.instructions.length).toBeGreaterThan(0)

    const names = idl!.instructions.map((ix) => ix.name)
    expect(names).toContain('deposit')
    expect(names).toContain('withdraw')
    expect(names).toContain('placePerpOrder')
  })

  it('fetches Orca Whirlpool IDL and finds core instruction names', async () => {
    const idl = await fetchIdl(ORCA_WHIRLPOOL, connection)

    expect(idl).not.toBeNull()
    expect(Array.isArray(idl!.instructions)).toBe(true)
    expect(idl!.instructions.length).toBeGreaterThan(0)

    const names = idl!.instructions.map((ix) => ix.name)
    expect(names).toContain('swap')
    expect(names).toContain('openPosition')
  })

  it('returns cached result on second call (same object reference)', async () => {
    const first = await fetchIdl(DRIFT_V2, connection)
    const second = await fetchIdl(DRIFT_V2, connection)
    expect(first).toBe(second)
  })

  it('fetchIdlsForPrograms resolves all 5 known programs in parallel', async () => {
    const ids = [DRIFT_V2, ORCA_WHIRLPOOL, SQUADS, MANGO_V4, MARINADE]
    const map = await fetchIdlsForPrograms(ids, connection)

    expect(map.size).toBe(5)
    for (const id of ids) {
      expect(map.has(id)).toBe(true)
      expect(map.get(id)).not.toBeNull()
      expect((map.get(id)!).instructions.length).toBeGreaterThan(0)
    }
  })

  it('returns null for a program with no Anchor IDL on-chain', async () => {
    // System Program — never has an Anchor IDL
    const idl = await fetchIdl('11111111111111111111111111111111', connection)
    expect(idl).toBeNull()
  })
})
