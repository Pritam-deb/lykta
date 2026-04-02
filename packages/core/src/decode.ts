import { createHash } from 'crypto'
import type { Idl } from '@coral-xyz/anchor'
import { BorshReader, readField } from './borsh.js'
import { KNOWN_PROGRAMS } from './registry.js'
import type { CpiNode } from './types.js'

// ── Derived types (avoid deep package imports) ────────────────────────────────

type IdlInstruction = NonNullable<Idl['instructions']>[number]
type IdlInstructionAccountItem = IdlInstruction['accounts'][number]
type IdlInstructionAccount = {
  name: string
  writable?: boolean
  signer?: boolean
  optional?: boolean
}
type IdlInstructionAccounts = {
  name: string
  accounts: IdlInstructionAccount[]
}

// ── Public output types ───────────────────────────────────────────────────────

/**
 * A single account entry with its IDL-provided label merged with its
 * runtime address from the transaction.
 */
export interface LabeledAccount {
  /** Human-readable name from the IDL (e.g. "authority", "tokenAccount") */
  name: string
  /** On-chain address (base58) */
  address: string
  writable: boolean
  signer: boolean
}

/**
 * The fully-decoded representation of one CPI instruction node.
 *
 * When an IDL match is found, `name`, `args`, and `accounts` are populated.
 * When no IDL is available or the discriminator is not recognised, the node
 * falls back to raw hex so no information is lost.
 */
export interface DecodedInstruction {
  /** Instruction name from the IDL, or null when no match was found. */
  name: string | null
  /** Decoded Borsh arguments keyed by field name, or null on fallback. */
  args: Record<string, unknown> | null
  /** Accounts in index order with IDL labels merged in. */
  accounts: LabeledAccount[]
  /** Hex-encoded full instruction data (useful for debugging). */
  rawHex: string
  /** Hex-encoded 8-byte discriminator prefix. */
  discriminatorHex: string
  /** True when the discriminator matched an IDL instruction. */
  matched: boolean
  /** The underlying CpiNode (mutated in-place with name/args/programName). */
  node: CpiNode
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Computes the 8-byte Anchor instruction discriminator for a given name.
 *
 * Anchor derives discriminators as:
 *   `SHA256("global:<camelCaseName>")[0..8]`
 *
 * The `idl.instructions[].discriminator` field in v0.30+ IDLs already stores
 * the pre-computed value, so this helper is mainly useful for verification or
 * when decoding programs whose IDL was generated with an older toolchain.
 */
export function computeDiscriminator(name: string, namespace = 'global'): Buffer {
  return createHash('sha256').update(`${namespace}:${name}`).digest().subarray(0, 8)
}

/**
 * Finds the IDL instruction whose stored `discriminator` matches the first
 * 8 bytes of `discriminator`.
 *
 * Prefers the IDL's stored `discriminator` field (Anchor v0.30+).  Falls back
 * to computing `SHA256("global:<name>")[0..8]` for programs compiled with an
 * older toolchain that omitted the field.
 *
 * @returns The matching `IdlInstruction`, or `null` if none found.
 */
export function findInstructionByDiscriminator(
  discriminator: Uint8Array | number[],
  idl: Idl,
): IdlInstruction | null {
  const disc = Buffer.isBuffer(discriminator)
    ? discriminator
    : Buffer.from(discriminator)

  for (const ix of idl.instructions) {
    // v0.30+ — discriminator is stored directly in the IDL
    if (ix.discriminator && ix.discriminator.length === 8) {
      if (disc.compare(Buffer.from(ix.discriminator), 0, 8, 0, 8) === 0) {
        return ix
      }
      continue
    }

    // Older toolchain fallback — compute from name
    const computed = computeDiscriminator(ix.name)
    if (disc.compare(computed, 0, 8, 0, 8) === 0) {
      return ix
    }
  }

  return null
}

/**
 * Deserializes the argument bytes that follow the 8-byte discriminator prefix.
 *
 * Reads each arg declared in `idlIx.args` in declaration order using the
 * Borsh reader.  Returns a `Record<name, value>` where value types match the
 * table in `readField`.
 *
 * @throws Never — all errors are caught and surfaced as `{ _error: string }`.
 */
export function deserializeArgs(
  data: Buffer,
  idlIx: IdlInstruction,
  idl: Idl,
): Record<string, unknown> {
  if (idlIx.args.length === 0) return {}

  // Skip the 8-byte discriminator
  const body = data.subarray(8)
  const reader = new BorshReader(body)
  const out: Record<string, unknown> = {}

  try {
    for (const arg of idlIx.args) {
      out[arg.name] = readField(reader, arg.type, idl)
    }
  } catch (err) {
    out['_error'] = err instanceof Error ? err.message : String(err)
  }

  return out
}

/**
 * Decodes an entire CPI tree against the provided IDL.
 *
 * For each node (including children recursively):
 *  1. The first 8 bytes of the instruction data are matched against every
 *     `idl.instructions[].discriminator`.
 *  2. On a hit: args are Borsh-decoded, accounts are labeled from the IDL,
 *     and the source `CpiNode` is mutated in-place with `instructionName`,
 *     `args`, and `programName`.
 *  3. On a miss (or when `idl` is `null`): the node keeps its raw data and
 *     `name` / `args` / `accounts.name` fall back to empty / raw-hex values.
 *
 * @param nodes  Top-level (or child) `CpiNode[]` from `buildCpiTree`.
 * @param idl    The IDL for the program that owns these instructions, or
 *               `null` if no IDL is available.
 * @returns      Flat array of `DecodedInstruction` in tree-traversal order
 *               (parent before children).
 */
export function decodeInstructions(
  nodes: CpiNode[],
  idl: Idl | null,
): DecodedInstruction[] {
  const results: DecodedInstruction[] = []
  for (const node of nodes) {
    results.push(decodeOne(node, idl))
    // Recursively decode children (CPIs made by this instruction)
    if (node.children.length > 0) {
      results.push(...decodeInstructions(node.children, idl))
    }
  }
  return results
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function decodeOne(node: CpiNode, idl: Idl | null): DecodedInstruction {
  const rawBuf = Buffer.from(node.data, 'base64')
  const rawHex = rawBuf.toString('hex')
  const discriminatorHex = rawBuf.subarray(0, 8).toString('hex')

  // Annotate program name from the registry regardless of IDL availability
  if (!node.programName) {
    const knownName = KNOWN_PROGRAMS.get(node.programId)
    if (knownName !== undefined) node.programName = knownName
  }

  // ── Fallback: no IDL ───────────────────────────────────────────────────────
  if (!idl) {
    return {
      name: null,
      args: null,
      accounts: buildUnlabeledAccounts(node.accounts),
      rawHex,
      discriminatorHex,
      matched: false,
      node,
    }
  }

  // ── Attempt discriminator match ────────────────────────────────────────────
  const disc = rawBuf.subarray(0, 8)
  const idlIx = findInstructionByDiscriminator(disc, idl)

  if (!idlIx) {
    return {
      name: null,
      args: null,
      accounts: labelAccounts(node.accounts, null),
      rawHex,
      discriminatorHex,
      matched: false,
      node,
    }
  }

  // ── Match found — decode args and label accounts ───────────────────────────
  const args = deserializeArgs(rawBuf, idlIx, idl)
  const accounts = labelAccounts(node.accounts, idlIx.accounts)

  // Mutate the CpiNode in-place so upstream consumers (CLI, VS Code) see names
  node.instructionName = idlIx.name
  node.args = args

  return {
    name: idlIx.name,
    args,
    accounts,
    rawHex,
    discriminatorHex,
    matched: true,
    node,
  }
}

/**
 * Merges the runtime account addresses with their IDL-declared metadata.
 *
 * The IDL may declare nested account groups (`IdlInstructionAccounts`).
 * These are flattened into a linear list that mirrors the on-chain index order.
 * If the runtime provides more accounts than the IDL declares (e.g. remaining
 * accounts), the extras are appended as `{ name: "remaining[N]", ... }`.
 */
function labelAccounts(
  addresses: string[],
  idlAccounts: IdlInstructionAccountItem[] | null,
): LabeledAccount[] {
  const flat = idlAccounts ? flattenAccountItems(idlAccounts) : []

  return addresses.map((address, i) => {
    const meta = flat[i] as (IdlInstructionAccount & { isMut?: boolean; isSigner?: boolean }) | undefined
    return {
      name: meta?.name ?? `remaining[${i}]`,
      address,
      // Handle both v0.30+ (writable/signer) and legacy IDL format (isMut/isSigner)
      writable: meta?.writable ?? meta?.isMut ?? false,
      signer: meta?.signer ?? meta?.isSigner ?? false,
    }
  })
}

/** Addresses with no IDL — named `account[N]` so callers still get a list. */
function buildUnlabeledAccounts(addresses: string[]): LabeledAccount[] {
  return addresses.map((address, i) => ({
    name: `account[${i}]`,
    address,
    writable: false,
    signer: false,
  }))
}

/**
 * Flattens `IdlInstructionAccountItem[]` (which may contain nested groups)
 * into a single ordered list of `IdlInstructionAccount`.
 */
function flattenAccountItems(items: IdlInstructionAccountItem[]): IdlInstructionAccount[] {
  const out: IdlInstructionAccount[] = []
  for (const item of items) {
    if (isAccountGroup(item)) {
      for (const nested of item.accounts) out.push(nested)
    } else {
      out.push(item as IdlInstructionAccount)
    }
  }
  return out
}

/** Distinguishes a single account from a named account group. */
function isAccountGroup(item: IdlInstructionAccountItem): item is IdlInstructionAccounts {
  return 'accounts' in item && Array.isArray((item as IdlInstructionAccounts).accounts)
}
