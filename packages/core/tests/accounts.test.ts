import { describe, it, expect, vi } from 'vitest'
import { PublicKey } from '@solana/web3.js'
import type { Connection, Message, MessageV0 } from '@solana/web3.js'
import { resolveAllAccountKeys } from '../src/accounts.js'
import simpleTx from './fixtures/simple-transfer.json'
import v0AltTx from './fixtures/v0-alt-swap.json'

// Five addresses stored in the mock ALT — the fixture references [0,1] as writable and [2,3] as readonly.
// Index 4 is present in the table but not referenced by the fixture's writableIndexes/readonlyIndexes.
const ALT_ADDRESSES = [
  new PublicKey('ALTAcc1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'),
  new PublicKey('ALTAcc2qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'),
  new PublicKey('ALTAcc3qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'),
  new PublicKey('ALTAcc4qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'),
  new PublicKey('ALTAcc5qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'),
]

/** Returns a fresh mock connection for each test so call counts don't bleed across tests. */
function mockConn(altAddresses: PublicKey[] | null = ALT_ADDRESSES): Connection {
  return {
    getAddressLookupTable: vi.fn().mockResolvedValue({
      value: altAddresses ? { state: { addresses: altAddresses } } : null,
    }),
  } as unknown as Connection
}

describe('resolveAllAccountKeys — legacy message', () => {
  it('returns all accountKeys as PublicKeys in order', async () => {
    const conn = mockConn()
    const keys = await resolveAllAccountKeys(
      simpleTx.transaction.message as unknown as Message,
      conn,
    )

    expect(keys).toHaveLength(3)
    expect(keys[0]!.toBase58()).toBe('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
    expect(keys[1]!.toBase58()).toBe('BrG44HdsEhzapvs8bEqzvkq4egwevS2y3W5D5zMtWen')
    expect(keys[2]!.toBase58()).toBe('11111111111111111111111111111111')
  })

  it('never calls getAddressLookupTable for a legacy message', async () => {
    const conn = mockConn()
    await resolveAllAccountKeys(
      simpleTx.transaction.message as unknown as Message,
      conn,
    )
    expect(conn.getAddressLookupTable).not.toHaveBeenCalled()
  })
})

describe('resolveAllAccountKeys — v0 message with ALT', () => {
  it('resolves to 7 keys: 3 static + 2 writable ALT + 2 readonly ALT', async () => {
    const conn = mockConn()
    const keys = await resolveAllAccountKeys(
      v0AltTx.transaction.message as unknown as MessageV0,
      conn,
    )

    expect(keys).toHaveLength(7)
  })

  it('places static keys before ALT keys', async () => {
    const conn = mockConn()
    const keys = await resolveAllAccountKeys(
      v0AltTx.transaction.message as unknown as MessageV0,
      conn,
    )

    expect(keys[0]!.toBase58()).toBe('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
    expect(keys[1]!.toBase58()).toBe('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4')
    expect(keys[2]!.toBase58()).toBe('ComputeBudget111111111111111111111111111111')
  })

  it('appends writable ALT slots (indexes [0,1]) before readonly slots (indexes [2,3])', async () => {
    const conn = mockConn()
    const keys = await resolveAllAccountKeys(
      v0AltTx.transaction.message as unknown as MessageV0,
      conn,
    )

    // writable: ALT[0], ALT[1]
    expect(keys[3]).toEqual(ALT_ADDRESSES[0])
    expect(keys[4]).toEqual(ALT_ADDRESSES[1])
    // readonly: ALT[2], ALT[3]
    expect(keys[5]).toEqual(ALT_ADDRESSES[2])
    expect(keys[6]).toEqual(ALT_ADDRESSES[3])
  })

  it('calls getAddressLookupTable once for the single ALT in the fixture', async () => {
    const conn = mockConn()
    await resolveAllAccountKeys(
      v0AltTx.transaction.message as unknown as MessageV0,
      conn,
    )

    expect(conn.getAddressLookupTable).toHaveBeenCalledTimes(1)
    // Must be called with a PublicKey (has toBase58)
    const [arg] = (conn.getAddressLookupTable as ReturnType<typeof vi.fn>).mock.calls[0] as [PublicKey]
    expect(arg.toBase58()).toBe('7RPpCgx9UZkCKAaZWcxLJBngTEbsB8MTsa67Ur5HFPP5')
  })
})

describe('resolveAllAccountKeys — deactivated ALT fallback', () => {
  it('uses PublicKey.default for every referenced index when the table is null', async () => {
    const conn = mockConn(null) // getAddressLookupTable returns { value: null }
    const keys = await resolveAllAccountKeys(
      v0AltTx.transaction.message as unknown as MessageV0,
      conn,
    )

    // Total count is unchanged — index arithmetic stays intact
    expect(keys).toHaveLength(7)

    // The 4 ALT-derived slots all fall back to the all-zeros placeholder
    expect(keys[3]).toEqual(PublicKey.default)
    expect(keys[4]).toEqual(PublicKey.default)
    expect(keys[5]).toEqual(PublicKey.default)
    expect(keys[6]).toEqual(PublicKey.default)
  })

  it('keeps static keys intact even when the ALT is deactivated', async () => {
    const conn = mockConn(null)
    const keys = await resolveAllAccountKeys(
      v0AltTx.transaction.message as unknown as MessageV0,
      conn,
    )

    expect(keys[0]!.toBase58()).toBe('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
    expect(keys[1]!.toBase58()).toBe('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4')
    expect(keys[2]!.toBase58()).toBe('ComputeBudget111111111111111111111111111111')
  })
})

describe('resolveAllAccountKeys — v0 with no ALT lookups', () => {
  it('returns only static keys and makes no RPC calls', async () => {
    const noAltMsg = {
      staticAccountKeys: [
        '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        'BrG44HdsEhzapvs8bEqzvkq4egwevS2y3W5D5zMtWen',
      ],
      compiledInstructions: [],
      addressTableLookups: [],
    }
    const conn = mockConn()
    const keys = await resolveAllAccountKeys(noAltMsg as unknown as MessageV0, conn)

    expect(keys).toHaveLength(2)
    expect(conn.getAddressLookupTable).not.toHaveBeenCalled()
  })
})
