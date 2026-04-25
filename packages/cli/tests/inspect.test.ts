import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderInspect } from '../src/commands/inspect.js'
import type { LyktaTransaction } from '@lykta/core'

const BASE_TX: LyktaTransaction = {
  signature: '4fJwSuapt69whNtTkQRzHMkSA88WvcEA1QwCGfLq2c9NSDojvfX9b8QztFGTu5WL1n9W4nf9iUSe1b7zqG1G9wGR',
  slot: 454967124,
  fee: 5000,
  success: true,
  totalCu: 51286,
  cpiTree: [],
  cuUsage: [],
  accountDiffs: [],
  tokenDiffs: [],
}

describe('renderInspect', () => {
  let logs: string[]

  beforeEach(() => {
    logs = []
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.join(' '))
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows full addresses in account changes (no truncation)', () => {
    const fullAddress = 'BvDzpUU9abc123def456ghi789jkl012mno345pqr678'
    const tx: LyktaTransaction = {
      ...BASE_TX,
      accountDiffs: [
        {
          address: fullAddress,
          lamports: { pre: 10000000, post: 5750000, delta: -4250000 },
          tokenBalance: undefined,
        },
      ],
    }
    renderInspect(tx)
    const accountLine = logs.find((l) => l.includes(fullAddress))
    expect(accountLine).toBeDefined()
    expect(accountLine).toContain(fullAddress)
    expect(accountLine).not.toContain('BvDzpUU9…')
  })

  it('shows full mint address in token diffs (no truncation)', () => {
    const fullMint = '4r25nkPiXPSGGMGzW2oGKTm5bJjPaQkwEQmVxjurpump'
    const fullAddress = 'CocSkBWy1234567890abcdefghijklmnopqrstuvwxyz'
    const tx: LyktaTransaction = {
      ...BASE_TX,
      tokenDiffs: [
        {
          address: fullAddress,
          mint: fullMint,
          delta: -500000000000n,
          uiDelta: '-500000.000000',
          decimals: 6,
        },
      ],
    }
    renderInspect(tx)
    const tokenLine = logs.find((l) => l.includes(fullMint))
    expect(tokenLine).toBeDefined()
    expect(tokenLine).toContain(fullMint)
    expect(tokenLine).toContain(fullAddress)
    expect(tokenLine).not.toContain('4r25nkPi…')
  })

  it('resolves known program IDs to human-readable names in CPI tree', () => {
    const tx: LyktaTransaction = {
      ...BASE_TX,
      cpiTree: [
        {
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf8Ss623VQ5DA',
          programName: undefined,
          instructionName: 'transfer',
          depth: 0,
          failed: false,
          children: [],
        },
        {
          programId: '11111111111111111111111111111111',
          programName: undefined,
          instructionName: undefined,
          depth: 0,
          failed: false,
          children: [],
        },
        {
          programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe1bF',
          programName: undefined,
          instructionName: 'create',
          depth: 0,
          failed: false,
          children: [],
        },
      ],
    }
    renderInspect(tx)
    const output = logs.join('\n')
    expect(output).toContain('Token Program')
    expect(output).toContain('System Program')
    expect(output).toContain('Associated Token Program')
    // Should not show raw truncated IDs for known programs
    expect(output).not.toContain('Tokenkeg…')
    expect(output).not.toContain('11111111…')
    expect(output).not.toContain('ATokenGP…')
  })

  it('shows full programId for unknown programs in CPI tree', () => {
    const unknownId = '9gsQ8cjSabcdefghijklmnopqrstuvwxyz1234567890'
    const tx: LyktaTransaction = {
      ...BASE_TX,
      cpiTree: [
        {
          programId: unknownId,
          programName: undefined,
          instructionName: undefined,
          depth: 0,
          failed: false,
          children: [],
        },
      ],
    }
    renderInspect(tx)
    const output = logs.join('\n')
    expect(output).toContain(unknownId)
    expect(output).not.toContain('9gsQ8cjS…')
  })

  it('resolves known programId in compute units', () => {
    const tx: LyktaTransaction = {
      ...BASE_TX,
      cuUsage: [
        {
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf8Ss623VQ5DA',
          consumed: 51286,
          limit: 200000,
          percentUsed: 26,
        },
      ],
    }
    renderInspect(tx)
    const cuLine = logs.find((l) => l.includes('Token Program'))
    expect(cuLine).toBeDefined()
    expect(cuLine).toContain('51286/200000')
  })
})
