/**
 * Integration test — hits the real Helius devnet RPC.
 * Run with: pnpm test:integration
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { Connection, PublicKey } from '@solana/web3.js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../../../.env') })

const RPC_URL = process.env.HELIUS_RPC_URL

describe('Helius devnet RPC', () => {
  let connection: Connection
  let sig: string

  beforeAll(() => {
    if (!RPC_URL) throw new Error('HELIUS_RPC_URL is not set in .env')
    connection = new Connection(RPC_URL, 'confirmed')
  })

  it('resolves a recent signature from the network', async () => {
    const sigs = await connection.getSignaturesForAddress(
      new PublicKey('11111111111111111111111111111111'),
      { limit: 1 },
    )
    expect(sigs.length).toBeGreaterThan(0)
    sig = sigs[0].signature
    expect(sig).toMatch(/^[1-9A-HJ-NP-Za-km-z]{87,88}$/) // base58 sig format
  })

  it('fetches a transaction with getTransaction', async () => {
    const tx = await connection.getTransaction(sig, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    })

    expect(tx).not.toBeNull()
    expect(tx?.slot).toBeGreaterThan(0)
    expect(typeof tx?.meta?.fee).toBe('number')
    expect(tx?.transaction).toBeDefined()
  })

  it('transaction has the expected shape for SolScope', async () => {
    const tx = await connection.getTransaction(sig, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    })

    // Fields that fetchTransaction() in fetch.ts depends on
    expect(tx?.meta?.err).toBeDefined() // null = success, object = error
    expect(Array.isArray(tx?.meta?.logMessages)).toBe(true)
    expect(Array.isArray(tx?.meta?.preBalances)).toBe(true)
    expect(Array.isArray(tx?.meta?.postBalances)).toBe(true)
  })
})
