/**
 * Decode integration tests — fetch a real devnet transaction and assert
 * that the full pipeline (IDL → discriminator match → Borsh decode) works
 * end-to-end against live on-chain data.
 *
 * Program: Squads Protocol (SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu)
 *   - Has an on-chain Anchor IDL (15 instructions)
 *   - Active on devnet
 *   - `create` instruction args: threshold(u16), createKey(publicKey),
 *     members(vec<publicKey>), meta(string) — covers most primitive types
 *
 * Run with: pnpm test:integration
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { Connection, PublicKey } from '@solana/web3.js'
import { config } from 'dotenv'
import { resolve } from 'path'
import {
  fetchIdl,
  fetchRawTransaction,
  buildCpiTree,
  decodeInstructions,
  computeDiscriminator,
  findInstructionByDiscriminator,
} from '../src/index.js'

config({ path: resolve(__dirname, '../../../.env') })

const SQUADS = 'SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu'

// Real devnet tx containing a Squads `create` instruction (confirmed block)
const SQUADS_CREATE_SIG =
  '2dFnV9p5XudD1y4yyKfKi8dJiQgKXvGcajigh9scnzunWDMiR9ieoHw6Ge19pu9oTq5LuBSddwQQYivhccQF8h4Y'

function toDebugJson(value: unknown): string {
  return JSON.stringify(
    value,
    (_, currentValue) => {
      if (typeof currentValue === 'bigint') return `${currentValue.toString()}n`
      if (currentValue instanceof Uint8Array) return Array.from(currentValue)
      return currentValue
    },
    2,
  )
}

function debugLog(label: string, value: unknown): void {
  console.log(`\n[decode.integration] ${label}`)
  console.log(toDebugJson(value))
}

function splitRawInstruction(data: Buffer | string) {
  const rawBuffer = typeof data === 'string' ? Buffer.from(data, 'base64') : data
  return {
    base64: rawBuffer.toString('base64'),
    hex: rawBuffer.toString('hex'),
    discriminatorHex: rawBuffer.subarray(0, 8).toString('hex'),
    bodyHex: rawBuffer.subarray(8).toString('hex'),
  }
}

describe('Full instruction decode — name + args — from real devnet tx', () => {
  let connection: Connection

  beforeAll(() => {
    const url = process.env.HELIUS_RPC_URL
    if (!url) throw new Error('HELIUS_RPC_URL not set in .env')
    connection = new Connection(url, 'confirmed')
  })

  // ── IDL resolution ────────────────────────────────────────────────────────

  it('resolves the Squads IDL from on-chain PDA', async () => {
    const idl = await fetchIdl(SQUADS, connection)
    expect(idl).not.toBeNull()
    expect(idl!.instructions.length).toBe(15)
    const names = idl!.instructions.map((i) => i.name)
    expect(names).toContain('create')
    expect(names).toContain('addMember')
  })

  // ── Discriminator matching ────────────────────────────────────────────────

  it('findInstructionByDiscriminator resolves "create" from its SHA256 hash', async () => {
    const idl = await fetchIdl(SQUADS, connection)
    const disc = computeDiscriminator('create')
    const ix = findInstructionByDiscriminator(disc, idl!)
    expect(ix).not.toBeNull()
    expect(ix!.name).toBe('create')
    expect(ix!.args.map((a) => a.name)).toEqual(['threshold', 'createKey', 'members', 'meta'])
  })

  // ── Full end-to-end pipeline ──────────────────────────────────────────────

  it('decodes a real Squads create instruction — name + all arg fields parsed', async () => {
    const idl = await fetchIdl(SQUADS, connection)
    const rawTx = await fetchRawTransaction(SQUADS_CREATE_SIG, connection)
    const cpiTree = buildCpiTree(rawTx)

    // Find the top-level node calling Squads
    const squadsNode = cpiTree.find((n) => n.programId === SQUADS)
    expect(squadsNode).toBeDefined()

    const decoded = decodeInstructions([squadsNode!], idl!)
    const result = decoded[0]!
    debugLog('raw -> decoded real Squads create', {
      signature: SQUADS_CREATE_SIG,
      raw: splitRawInstruction(squadsNode!.data),
      decoded: {
        instructionName: result.name,
        matched: result.matched,
        args: result.args,
        accounts: result.accounts,
      },
    })

    // ── Name ──────────────────────────────────────────────────────────────
    expect(result.matched).toBe(true)
    expect(result.name).toBe('create')
    expect(squadsNode!.instructionName).toBe('create') // mutated in-place

    // ── Args ──────────────────────────────────────────────────────────────
    const args = result.args!
    expect(args).not.toBeNull()

    // threshold: u16 — must be a small positive integer
    expect(typeof args['threshold']).toBe('number')
    expect(args['threshold']).toBeGreaterThan(0)

    // createKey: publicKey (32 bytes → base58 string)
    expect(typeof args['createKey']).toBe('string')
    expect(() => new PublicKey(args['createKey'] as string)).not.toThrow()

    // members: vec<publicKey> — at least one member
    expect(Array.isArray(args['members'])).toBe(true)
    const members = args['members'] as string[]
    expect(members.length).toBeGreaterThan(0)
    for (const m of members) {
      expect(() => new PublicKey(m)).not.toThrow()
    }

    // meta: string — non-empty JSON describing the multisig
    expect(typeof args['meta']).toBe('string')
    expect((args['meta'] as string).length).toBeGreaterThan(0)

    // ── Accounts ──────────────────────────────────────────────────────────
    const accounts = result.accounts
    expect(accounts.length).toBeGreaterThan(0)
    // IDL declares: multisig, creator, systemProgram
    expect(accounts[0]!.name).toBe('multisig')
    expect(accounts[1]!.name).toBe('creator')
    expect(accounts[1]!.signer).toBe(true)

    // ── Raw fields always present ──────────────────────────────────────────
    expect(result.rawHex.length).toBeGreaterThan(16)        // at least discriminator
    expect(result.discriminatorHex).toHaveLength(16)        // 8 bytes = 16 hex chars
    expect(result.discriminatorHex).toBe(
      computeDiscriminator('create').toString('hex')
    )
  })

  // ── In-place CpiNode mutation ─────────────────────────────────────────────

  it('mutates CpiNode.instructionName and CpiNode.args in-place', async () => {
    const idl = await fetchIdl(SQUADS, connection)
    const rawTx = await fetchRawTransaction(SQUADS_CREATE_SIG, connection)
    const cpiTree = buildCpiTree(rawTx)
    const node = cpiTree.find((n) => n.programId === SQUADS)!

    expect(node.instructionName).toBeUndefined() // not yet decoded
    decodeInstructions([node], idl!)
    expect(node.instructionName).toBe('create')
    expect(node.args).toBeDefined()
    expect(node.args!['threshold']).toBeGreaterThan(0)
  })

  // ── Graceful fallback — no IDL ────────────────────────────────────────────

  it('falls back to raw hex when idl is null', async () => {
    const rawTx = await fetchRawTransaction(SQUADS_CREATE_SIG, connection)
    const cpiTree = buildCpiTree(rawTx)
    const node = cpiTree.find((n) => n.programId === SQUADS)!

    const [result] = decodeInstructions([node], null)!
    expect(result!.matched).toBe(false)
    expect(result!.name).toBeNull()
    expect(result!.rawHex.length).toBeGreaterThan(0)
    expect(result!.accounts[0]!.name).toBe('account[0]')
  })
})
