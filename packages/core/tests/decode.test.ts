import { describe, it, expect } from 'vitest'
import { createHash } from 'crypto'
import {
  BorshReader,
  computeDiscriminator,
  findInstructionByDiscriminator,
  deserializeArgs,
  decodeInstructions,
} from '../src/index.js'
import type { CpiNode } from '../src/index.js'
import type { Idl } from '@coral-xyz/anchor'

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  console.log(`\n[decode.test] ${label}`)
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

/** Builds a minimal Idl fixture with a single instruction. */
function makeIdl(name: string, args: Idl['instructions'][number]['args']): Idl {
  const disc = [...computeDiscriminator(name)]
  return {
    address: '11111111111111111111111111111111',
    metadata: { name: 'fixture', version: '0.1.0', spec: '0.1.0' },
    instructions: [{ name, discriminator: disc, accounts: [], args }],
  }
}

/** Builds a base64-encoded instruction data buffer from hex discriminator + body. */
function makeData(discHex: string, body: Buffer): string {
  return Buffer.concat([Buffer.from(discHex, 'hex'), body]).toString('base64')
}

/** Minimal CpiNode stub. */
function makeCpiNode(data: string, accounts: string[] = []): CpiNode {
  return {
    programId: '11111111111111111111111111111111',
    accounts,
    data,
    depth: 0,
    children: [],
    failed: false,
  }
}

// ── computeDiscriminator ──────────────────────────────────────────────────────

describe('computeDiscriminator', () => {
  it('produces exactly 8 bytes', () => {
    expect(computeDiscriminator('swap').length).toBe(8)
  })

  it('matches SHA256("global:swap")[0..8]', () => {
    const expected = createHash('sha256').update('global:swap').digest().subarray(0, 8)
    expect(computeDiscriminator('swap')).toEqual(expected)
  })

  it('accepts a custom namespace', () => {
    const expected = createHash('sha256').update('state:doThing').digest().subarray(0, 8)
    expect(computeDiscriminator('doThing', 'state')).toEqual(expected)
  })

  it('differs across instruction names', () => {
    const a = computeDiscriminator('deposit').toString('hex')
    const b = computeDiscriminator('withdraw').toString('hex')
    expect(a).not.toBe(b)
  })
})

// ── findInstructionByDiscriminator ────────────────────────────────────────────

describe('findInstructionByDiscriminator', () => {
  const idl = makeIdl('transfer', [{ name: 'amount', type: 'u64' }])

  it('returns the matching instruction when discriminator is stored in IDL', () => {
    const disc = computeDiscriminator('transfer')
    const ix = findInstructionByDiscriminator(disc, idl)
    expect(ix).not.toBeNull()
    expect(ix!.name).toBe('transfer')
  })

  it('returns null for an all-zero discriminator', () => {
    const disc = Buffer.alloc(8, 0)
    expect(findInstructionByDiscriminator(disc, idl)).toBeNull()
  })

  it('falls back to SHA256 computation when IDL omits discriminator field', () => {
    // Simulate older IDL format: no stored discriminator
    const oldStyleIdl: Idl = {
      ...idl,
      instructions: [{ ...idl.instructions[0]!, discriminator: undefined as unknown as number[] }],
    }
    const disc = computeDiscriminator('transfer')
    const ix = findInstructionByDiscriminator(disc, oldStyleIdl)
    expect(ix).not.toBeNull()
    expect(ix!.name).toBe('transfer')
  })

  it('accepts number[] discriminator (not just Buffer)', () => {
    const disc = [...computeDiscriminator('transfer')]
    const ix = findInstructionByDiscriminator(disc, idl)
    expect(ix!.name).toBe('transfer')
  })
})

// ── deserializeArgs ───────────────────────────────────────────────────────────

describe('deserializeArgs', () => {
  it('decodes u64 + string args correctly', () => {
    const idl = makeIdl('doWork', [
      { name: 'amount', type: 'u64' },
      { name: 'label', type: 'string' },
    ])
    const ix = idl.instructions[0]!

    // Build body: u64 LE + u32-prefixed string
    const body = Buffer.alloc(8 + 4 + 5)
    body.writeBigUInt64LE(1_000_000n, 0)
    body.writeUInt32LE(5, 8)
    body.write('hello', 12, 'utf8')

    const disc = computeDiscriminator('doWork')
    const data = Buffer.concat([disc, body])

    const args = deserializeArgs(data, ix, idl)
    debugLog('raw -> decoded args', {
      instruction: ix.name,
      raw: splitRawInstruction(data),
      decoded: {
        args,
      },
    })
    expect(args['amount']).toBe(1_000_000n)
    expect(args['label']).toBe('hello')
  })

  it('returns {} when instruction has no args', () => {
    const idl = makeIdl('noop', [])
    const ix = idl.instructions[0]!
    const disc = computeDiscriminator('noop')
    expect(deserializeArgs(disc, ix, idl)).toEqual({})
  })

  it('returns { _error } instead of throwing on truncated data', () => {
    const idl = makeIdl('needsU64', [{ name: 'x', type: 'u64' }])
    const ix = idl.instructions[0]!
    // Only discriminator, no body — BorshReader will throw RangeError
    const data = computeDiscriminator('needsU64')
    const args = deserializeArgs(data, ix, idl)
    expect(args['_error']).toBeDefined()
    expect(typeof args['_error']).toBe('string')
  })

  it('decodes bool, u8, u16, u32 primitives', () => {
    const idl = makeIdl('multiPrim', [
      { name: 'flag', type: 'bool' },
      { name: 'byte', type: 'u8' },
      { name: 'short', type: 'u16' },
      { name: 'word', type: 'u32' },
    ])
    const ix = idl.instructions[0]!
    const body = Buffer.alloc(1 + 1 + 2 + 4)
    body.writeUInt8(1, 0)   // bool true
    body.writeUInt8(42, 1)
    body.writeUInt16LE(1000, 2)
    body.writeUInt32LE(99999, 4)

    const data = Buffer.concat([computeDiscriminator('multiPrim'), body])
    const args = deserializeArgs(data, ix, idl)
    expect(args['flag']).toBe(true)
    expect(args['byte']).toBe(42)
    expect(args['short']).toBe(1000)
    expect(args['word']).toBe(99999)
  })

  it('decodes Option<u64> — Some', () => {
    const idl = makeIdl('optTest', [{ name: 'val', type: { option: 'u64' } }])
    const ix = idl.instructions[0]!
    const body = Buffer.alloc(1 + 8)
    body.writeUInt8(1, 0) // Some
    body.writeBigUInt64LE(777n, 1)
    const data = Buffer.concat([computeDiscriminator('optTest'), body])
    const args = deserializeArgs(data, ix, idl)
    expect(args['val']).toBe(777n)
  })

  it('decodes Option<u64> — None', () => {
    const idl = makeIdl('optTest', [{ name: 'val', type: { option: 'u64' } }])
    const ix = idl.instructions[0]!
    const body = Buffer.from([0]) // None
    const data = Buffer.concat([computeDiscriminator('optTest'), body])
    const args = deserializeArgs(data, ix, idl)
    expect(args['val']).toBeNull()
  })

  it('decodes Vec<u8>', () => {
    const idl = makeIdl('vecTest', [{ name: 'items', type: { vec: 'u8' } }])
    const ix = idl.instructions[0]!
    const body = Buffer.alloc(4 + 3)
    body.writeUInt32LE(3, 0)
    body[4] = 10; body[5] = 20; body[6] = 30
    const data = Buffer.concat([computeDiscriminator('vecTest'), body])
    const args = deserializeArgs(data, ix, idl)
    expect(args['items']).toEqual([10, 20, 30])
  })
})

// ── decodeInstructions ────────────────────────────────────────────────────────

describe('decodeInstructions', () => {
  it('returns matched=true and fills name + args on a hit', () => {
    const idl = makeIdl('deposit', [{ name: 'amount', type: 'u64' }])
    const body = Buffer.alloc(8)
    body.writeBigUInt64LE(500n, 0)
    const data = makeData(computeDiscriminator('deposit').toString('hex'), body)
    const node = makeCpiNode(data)

    const [result] = decodeInstructions([node], idl)!
    debugLog('raw -> decoded instruction', {
      programId: node.programId,
      raw: splitRawInstruction(data),
      decoded: {
        name: result!.name,
        matched: result!.matched,
        args: result!.args,
        accounts: result!.accounts,
      },
      mutatedNode: {
        instructionName: node.instructionName,
        args: node.args,
      },
    })
    expect(result!.matched).toBe(true)
    expect(result!.name).toBe('deposit')
    expect(result!.args!['amount']).toBe(500n)
    // In-place mutation
    expect(node.instructionName).toBe('deposit')
    expect(node.args!['amount']).toBe(500n)
  })

  it('returns matched=false when discriminator is not in IDL', () => {
    const idl = makeIdl('known', [])
    const data = makeData('deadbeefdeadbeef', Buffer.alloc(0))
    const [result] = decodeInstructions([makeCpiNode(data)], idl)!
    expect(result!.matched).toBe(false)
    expect(result!.name).toBeNull()
    expect(result!.discriminatorHex).toBe('deadbeefdeadbeef')
  })

  it('returns matched=false and unlabeled accounts when idl is null', () => {
    const data = makeData('0102030405060708', Buffer.alloc(0))
    const node = makeCpiNode(data, ['Abc123', 'Xyz456'])
    const [result] = decodeInstructions([node], null)!
    expect(result!.matched).toBe(false)
    expect(result!.accounts[0]!.name).toBe('account[0]')
    expect(result!.accounts[0]!.address).toBe('Abc123')
  })

  it('labels accounts from IDL when matched', () => {
    const idl: Idl = {
      address: '11111111111111111111111111111111',
      metadata: { name: 'f', version: '0.1.0', spec: '0.1.0' },
      instructions: [{
        name: 'move',
        discriminator: [...computeDiscriminator('move')],
        accounts: [
          { name: 'from', writable: true, signer: true },
          { name: 'to', writable: true, signer: false },
        ],
        args: [],
      }],
    }
    const data = makeData(computeDiscriminator('move').toString('hex'), Buffer.alloc(0))
    const node = makeCpiNode(data, ['AAAA', 'BBBB'])
    const [result] = decodeInstructions([node], idl)!
    debugLog('raw -> labeled accounts', {
      raw: splitRawInstruction(data),
      decoded: {
        accounts: result!.accounts,
      },
    })
    expect(result!.accounts[0]!.name).toBe('from')
    expect(result!.accounts[0]!.writable).toBe(true)
    expect(result!.accounts[0]!.signer).toBe(true)
    expect(result!.accounts[1]!.name).toBe('to')
  })

  it('appends remaining[N] for accounts beyond what IDL declares', () => {
    const idl: Idl = {
      address: '11111111111111111111111111111111',
      metadata: { name: 'f', version: '0.1.0', spec: '0.1.0' },
      instructions: [{
        name: 'act',
        discriminator: [...computeDiscriminator('act')],
        accounts: [{ name: 'signer', writable: false, signer: true }],
        args: [],
      }],
    }
    const data = makeData(computeDiscriminator('act').toString('hex'), Buffer.alloc(0))
    const node = makeCpiNode(data, ['A', 'B', 'C'])
    const [result] = decodeInstructions([node], idl)!
    expect(result!.accounts[0]!.name).toBe('signer')
    expect(result!.accounts[1]!.name).toBe('remaining[1]')
    expect(result!.accounts[2]!.name).toBe('remaining[2]')
  })

  it('decodes children in tree-traversal order (parent before children)', () => {
    const idl = makeIdl('ping', [])
    const data = makeData(computeDiscriminator('ping').toString('hex'), Buffer.alloc(0))
    const child = makeCpiNode(data)
    const parent: CpiNode = { ...makeCpiNode(data), children: [child] }

    const results = decodeInstructions([parent], idl)
    expect(results).toHaveLength(2)
    expect(results[0]!.node).toBe(parent)
    expect(results[1]!.node).toBe(child)
  })

  it('annotates programName from KNOWN_PROGRAMS registry', () => {
    const idl = makeIdl('x', [])
    const data = makeData(computeDiscriminator('x').toString('hex'), Buffer.alloc(0))
    const node: CpiNode = {
      programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      accounts: [],
      data,
      depth: 0,
      children: [],
      failed: false,
    }
    decodeInstructions([node], idl)
    expect(node.programName).toBe('SPL Token')
  })
})
