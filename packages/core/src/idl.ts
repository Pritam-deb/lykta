import { Connection, PublicKey } from '@solana/web3.js'
import type { CpiNode } from './types.js'

/**
 * Attempts to resolve an Anchor IDL for a given program ID.
 * Tries on-chain storage first (Anchor's standard), returns null if not found.
 *
 * Week 2 task: implement using @coral-xyz/anchor Program.fetchIdl
 */
export async function resolveIdl(
  programId: string,
  connection: Connection,
): Promise<Record<string, unknown> | null> {
  // TODO (Week 2): implement via @coral-xyz/anchor Program.fetchIdl
  // Fallback chain: on-chain IDL → shyft API → anchor.so API → null
  return null
}

/**
 * Decodes a CPI node's instruction data using a resolved IDL.
 * Annotates the node with instructionName and args in-place.
 *
 * Week 2 task: implement using borsh + IDL discriminator lookup
 */
export function decodeInstruction(
  node: CpiNode,
  idl: Record<string, unknown>,
): CpiNode {
  // TODO (Week 2): decode using IDL discriminator (first 8 bytes) + borsh layout
  return node
}
