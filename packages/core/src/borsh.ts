import { PublicKey } from '@solana/web3.js'
import type { Idl } from '@coral-xyz/anchor'

// Extract sub-types from the exported Idl type — avoids deep package imports.
type IdlField = NonNullable<Idl['instructions']>[number]['args'][number]
type IdlType = IdlField['type']
type IdlTypeDef = NonNullable<Idl['types']>[number]

// Internal alias for struct / enum field lists (named or positional)
type IdlDefinedFields = IdlField[] | IdlType[]

// ── BorshReader ───────────────────────────────────────────────────────────────

/**
 * Incremental Borsh binary deserializer.
 *
 * Wraps a Buffer and tracks a cursor position.  Every `read*` method advances
 * the cursor by the exact byte width of the type, so callers chain reads in
 * declaration order without manual offset arithmetic.
 *
 * @example
 * const reader = new BorshReader(Buffer.from(data, 'base64'))
 * const amount  = reader.readU64()
 * const mint    = reader.readPubkey()
 * const label   = reader.readString()
 */
export class BorshReader {
  private readonly buf: Buffer
  private _offset: number = 0

  constructor(data: Buffer | Uint8Array) {
    this.buf = Buffer.isBuffer(data) ? data : Buffer.from(data)
  }

  /** Remaining unread bytes. */
  get remaining(): number {
    return this.buf.length - this._offset
  }

  /** Current read position (bytes from start). */
  get position(): number {
    return this._offset
  }

  /**
   * Returns the current offset and advances by `n` bytes.
   * Throws a `RangeError` if the read would exceed the buffer.
   */
  private advance(n: number): number {
    const start = this._offset
    if (start + n > this.buf.length) {
      throw new RangeError(
        `BorshReader: tried to read ${n} byte(s) at offset ${start}, ` +
          `but buffer length is ${this.buf.length}`,
      )
    }
    this._offset += n
    return start
  }

  // ── 1-byte primitives ─────────────────────────────────────────────────────

  readBool(): boolean {
    return this.buf[this.advance(1)] !== 0
  }

  readU8(): number {
    return this.buf.readUInt8(this.advance(1))
  }

  readI8(): number {
    return this.buf.readInt8(this.advance(1))
  }

  // ── 2-byte primitives ─────────────────────────────────────────────────────

  readU16(): number {
    return this.buf.readUInt16LE(this.advance(2))
  }

  readI16(): number {
    return this.buf.readInt16LE(this.advance(2))
  }

  // ── 4-byte primitives ─────────────────────────────────────────────────────

  readU32(): number {
    return this.buf.readUInt32LE(this.advance(4))
  }

  readI32(): number {
    return this.buf.readInt32LE(this.advance(4))
  }

  readF32(): number {
    return this.buf.readFloatLE(this.advance(4))
  }

  // ── 8-byte primitives ─────────────────────────────────────────────────────

  readU64(): bigint {
    return this.buf.readBigUInt64LE(this.advance(8))
  }

  readI64(): bigint {
    return this.buf.readBigInt64LE(this.advance(8))
  }

  readF64(): number {
    return this.buf.readDoubleLE(this.advance(8))
  }

  // ── 16-byte primitives ────────────────────────────────────────────────────

  /**
   * u128: two u64 words in little-endian order (lo word first).
   * Returns a BigInt so the full 128-bit range is preserved.
   */
  readU128(): bigint {
    const lo = this.buf.readBigUInt64LE(this.advance(8))
    const hi = this.buf.readBigUInt64LE(this.advance(8))
    return (hi << 64n) | lo
  }

  /**
   * i128: lo word unsigned u64, hi word signed i64 (determines overall sign).
   * Uses 2's complement arithmetic via BigInt so negative values are correct.
   */
  readI128(): bigint {
    const lo = this.buf.readBigUInt64LE(this.advance(8))
    const hi = this.buf.readBigInt64LE(this.advance(8))
    return (hi << 64n) | lo
  }

  // ── 32-byte primitives ────────────────────────────────────────────────────

  /**
   * u256: two u128 words in little-endian order (lo word first).
   */
  readU256(): bigint {
    const lo = this.readU128()
    const hi = this.readU128()
    return (hi << 128n) | lo
  }

  /**
   * i256: lo word unsigned u128, hi word signed i128 (determines overall sign).
   * Correct 2's complement via BigInt sign-extension from the hi word.
   */
  readI256(): bigint {
    const lo = this.readU128()
    const hi = this.readI128()
    return (hi << 128n) | lo
  }

  /** Reads exactly 32 bytes and returns a base58 public key string. */
  readPubkey(): string {
    const start = this.advance(32)
    return new PublicKey(this.buf.subarray(start, start + 32)).toBase58()
  }

  // ── Variable-length primitives ─────────────────────────────────────────────

  /**
   * Borsh `string`: u32 LE byte-length prefix followed by UTF-8 bytes.
   */
  readString(): string {
    const len = this.readU32()
    const start = this.advance(len)
    return this.buf.subarray(start, start + len).toString('utf8')
  }

  /**
   * Borsh `bytes`: u32 LE byte-length prefix followed by raw bytes.
   * Returns a slice of the underlying buffer (zero-copy).
   */
  readBytes(): Uint8Array {
    const len = this.readU32()
    const start = this.advance(len)
    return new Uint8Array(this.buf.buffer, this.buf.byteOffset + start, len)
  }

  /**
   * Reads exactly `n` bytes with no length prefix.
   * Used internally for fixed-size arrays and raw blobs.
   */
  readFixedBytes(n: number): Uint8Array {
    const start = this.advance(n)
    return new Uint8Array(this.buf.buffer, this.buf.byteOffset + start, n)
  }
}

// ── readField — recursive IDL type dispatcher ─────────────────────────────────

/**
 * Decodes a single Anchor IDL field from the reader's current position.
 *
 * Handles the complete `IdlType` union from `@coral-xyz/anchor` v0.30+:
 *
 * | IDL type                | JS return value                          |
 * |-------------------------|------------------------------------------|
 * | bool                    | `boolean`                                |
 * | u8 / i8 / u16 / i16    | `number`                                 |
 * | u32 / i32               | `number`                                 |
 * | f32 / f64               | `number`                                 |
 * | u64 / i64               | `bigint`                                 |
 * | u128 / i128             | `bigint`                                 |
 * | u256 / i256             | `bigint`                                 |
 * | string                  | `string`                                 |
 * | pubkey                  | base58 `string`                          |
 * | bytes                   | `Uint8Array`                             |
 * | option / coption        | `T \| null`                              |
 * | vec                     | `T[]`                                    |
 * | array [T; N]            | `T[]` (length N, no prefix)              |
 * | defined (struct)        | `Record<string, unknown>`                |
 * | defined (tuple struct)  | `unknown[]`                              |
 * | defined (enum)          | `{ variant: string, fields?: … }`        |
 * | defined (type alias)    | decoded alias type                       |
 *
 * @param reader  - BorshReader positioned at the start of this field's bytes.
 * @param type    - The `IdlType` descriptor from the instruction's arg list.
 * @param idl     - The full IDL, used to resolve `defined` type references.
 * @throws {Error} if a type is not found in `idl.types` or is a bare `generic`.
 */
export function readField(reader: BorshReader, type: IdlType, idl: Idl): unknown {
  // ── Primitive string literals ──────────────────────────────────────────────
  switch (type as string) {
    case 'bool':   return reader.readBool()
    case 'u8':     return reader.readU8()
    case 'i8':     return reader.readI8()
    case 'u16':    return reader.readU16()
    case 'i16':    return reader.readI16()
    case 'u32':    return reader.readU32()
    case 'i32':    return reader.readI32()
    case 'u64':    return reader.readU64()
    case 'i64':    return reader.readI64()
    case 'f32':    return reader.readF32()
    case 'f64':    return reader.readF64()
    case 'u128':   return reader.readU128()
    case 'i128':   return reader.readI128()
    case 'u256':   return reader.readU256()
    case 'i256':   return reader.readI256()
    case 'string': return reader.readString()
    case 'pubkey':
    case 'publicKey': // legacy pre-0.30 IDL format alias
      return reader.readPubkey()
    case 'bytes':  return reader.readBytes()
  }

  // ── Composite object types ─────────────────────────────────────────────────
  if (typeof type === 'object' && type !== null) {
    // Option<T> — 1-byte tag: 0 = None, 1 = Some(T)
    if ('option' in type) {
      const tag = reader.readU8()
      return tag === 0 ? null : readField(reader, type.option, idl)
    }

    // COption<T> — 4-byte tag: 0 = None, 1 = Some(T)
    // Used by older SPL programs and some Anchor accounts.
    if ('coption' in type) {
      const tag = reader.readU32()
      return tag === 0 ? null : readField(reader, type.coption, idl)
    }

    // Vec<T> — u32 LE element-count prefix followed by N elements
    if ('vec' in type) {
      const len = reader.readU32()
      const items: unknown[] = new Array(len)
      for (let i = 0; i < len; i++) items[i] = readField(reader, type.vec, idl)
      return items
    }

    // [T; N] — exactly N elements, no length prefix
    if ('array' in type) {
      const [elemType, lenSpec] = type.array
      // lenSpec is either a number or { generic: string } (unresolvable at runtime)
      const n = typeof lenSpec === 'number' ? lenSpec : 0
      const items: unknown[] = new Array(n)
      for (let i = 0; i < n; i++) items[i] = readField(reader, elemType, idl)
      return items
    }

    // defined — struct, enum, or type alias resolved from idl.types
    if ('defined' in type) {
      return readDefined(reader, type.defined.name, idl)
    }

    // generic — cannot decode without concrete type arguments at callsite
    if ('generic' in type) {
      throw new Error(
        `BorshReader: cannot deserialize bare generic type "${type.generic}" — ` +
          `provide a concrete monomorphisation`,
      )
    }
  }

  throw new Error(`BorshReader: unrecognised IdlType ${JSON.stringify(type)}`)
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Resolves a named type from `idl.types` and dispatches to struct / enum /
 * type-alias reading.
 */
function readDefined(reader: BorshReader, name: string, idl: Idl): unknown {
  const typeDef: IdlTypeDef | undefined = idl.types?.find((t) => t.name === name)
  if (!typeDef) {
    throw new Error(`BorshReader: type "${name}" not found in IDL — check idl.types`)
  }

  switch (typeDef.type.kind) {
    case 'struct':
      return readStruct(reader, typeDef.type.fields as IdlDefinedFields | undefined, idl)

    case 'enum':
      return readEnum(reader, typeDef, idl)

    case 'type':
      // Type alias — just decode the aliased underlying type
      return readField(reader, typeDef.type.alias, idl)

    default:
      throw new Error(
        `BorshReader: unsupported IdlTypeDefTy kind "${(typeDef.type as { kind: string }).kind}"`,
      )
  }
}

/**
 * Reads a struct's fields in declaration order.
 *
 * - **Named fields** (`IdlField[]`): returns `Record<string, unknown>` keyed by field name.
 * - **Tuple fields** (`IdlType[]`): returns `unknown[]` with positional values.
 * - **Empty / absent**: returns `{}`.
 */
function readStruct(
  reader: BorshReader,
  fields: IdlDefinedFields | undefined,
  idl: Idl,
): Record<string, unknown> | unknown[] {
  if (!fields || fields.length === 0) return {}

  // Distinguish named fields (IdlField has a `name` property) from tuple types
  if (isNamedFields(fields)) {
    const out: Record<string, unknown> = {}
    for (const field of fields) out[field.name] = readField(reader, field.type, idl)
    return out
  }

  // Tuple struct — positional types
  return (fields as IdlType[]).map((t) => readField(reader, t, idl))
}

/**
 * Reads a Borsh enum: 1-byte variant index, then the variant's fields (if any).
 *
 * Returns `{ variant: string }` for unit variants, or
 * `{ variant: string, fields: Record<string,unknown> | unknown[] }` for data variants.
 */
function readEnum(reader: BorshReader, typeDef: IdlTypeDef, idl: Idl): unknown {
  if (typeDef.type.kind !== 'enum') {
    throw new Error(`BorshReader: readEnum called on non-enum type "${typeDef.name}"`)
  }

  const variantIndex = reader.readU8()
  const variant = typeDef.type.variants[variantIndex]
  if (!variant) {
    throw new Error(
      `BorshReader: enum "${typeDef.name}" has no variant at index ${variantIndex} ` +
        `(${typeDef.type.variants.length} variant(s) defined)`,
    )
  }

  if (!variant.fields || variant.fields.length === 0) {
    return { variant: variant.name }
  }

  return {
    variant: variant.name,
    fields: readStruct(reader, variant.fields as IdlDefinedFields, idl),
  }
}

/**
 * Type guard: `IdlField[]` (named) vs `IdlType[]` (tuple).
 * Named fields always have a `name` string property; IdlType objects do not.
 */
function isNamedFields(fields: IdlDefinedFields): fields is IdlField[] {
  const first = fields[0]
  return (
    first !== undefined &&
    typeof first === 'object' &&
    first !== null &&
    'name' in first &&
    typeof (first as IdlField).name === 'string'
  )
}
