import type { Message, MessageV0, VersionedTransactionResponse } from '@solana/web3.js'
import type { CpiNode } from './types.js'

// ── Log-line patterns ────────────────────────────────────────────────────────

const INVOKE_RE = /^Program (\S+) invoke \[(\d+)\]$/
const SUCCESS_RE = /^Program (\S+) success$/
const FAILED_RE = /^Program (\S+) failed: (.+)$/
const CONSUMED_RE = /^Program (\S+) consumed (\d+) of (\d+) compute units$/

/**
 * Reconstructs the CPI call tree purely from `meta.logMessages`.
 *
 * Unlike `buildCpiTree()`, which relies on the structured `innerInstructions`
 * block from the RPC, this parser works entirely from the human-readable log
 * lines emitted by the Solana runtime.  The two approaches are complementary:
 * `buildCpiTree` gives you exact account lists and instruction data; this
 * function gives you CU consumption per frame and works even when inner
 * instructions are stripped by the RPC.
 *
 * Recognised log-line formats:
 *   `Program <id> invoke [<depth>]`               → open a new frame
 *   `Program <id> consumed <X> of <Y> compute units` → attach CU info
 *   `Program <id> success`                         → close frame (ok)
 *   `Program <id> failed: <reason>`               → close frame (failed)
 *   `Log truncated`                                → mark remaining frames
 *
 * Edge cases:
 * - **Truncated logs**: when the validator emits `"Log truncated"` all
 *   still-open frames are marked `logsTruncated: true` and flushed.
 * - **Unclosed frames**: malformed or synthetic log arrays that end while
 *   frames are still open are drained bottom-up into the tree.
 *
 * @param logMessages - `tx.meta.logMessages` from the RPC response.
 * @returns Nested `CpiNode[]` in the same shape as `buildCpiTree()`.
 */
export function parseCpiTree(logMessages: string[]): CpiNode[] {
  const roots: CpiNode[] = []
  /** Stack of currently open (not yet closed) frames, outermost first. */
  const stack: CpiNode[] = []

  /** Pops the innermost frame and attaches it to its parent or roots. */
  function closeTop(): void {
    const node = stack.pop()!
    if (stack.length === 0) {
      roots.push(node)
    } else {
      stack[stack.length - 1]!.children.push(node)
    }
  }

  for (const line of logMessages) {
    // ── Truncation marker ──────────────────────────────────────────────────
    if (line === 'Log truncated') {
      for (const node of stack) {
        node.logsTruncated = true
      }
      // Drain inner → outer so the tree structure is preserved
      while (stack.length > 0) closeTop()
      continue
    }

    // ── Program X invoke [N] ───────────────────────────────────────────────
    const invokeMatch = INVOKE_RE.exec(line)
    if (invokeMatch) {
      const node: CpiNode = {
        programId: invokeMatch[1]!,
        accounts: [],
        data: '',
        depth: stack.length,  // depth equals current stack height before push
        children: [],
        failed: false,
      }
      stack.push(node)
      continue
    }

    // ── Program X consumed N of M compute units ────────────────────────────
    const consumedMatch = CONSUMED_RE.exec(line)
    if (consumedMatch !== null && stack.length > 0) {
      const top = stack[stack.length - 1]!
      top.computeUnits = {
        consumed: parseInt(consumedMatch[2]!, 10),
        limit:    parseInt(consumedMatch[3]!, 10),
      }
      continue
    }

    // ── Program X success ─────────────────────────────────────────────────
    if (SUCCESS_RE.test(line)) {
      if (stack.length > 0) closeTop()
      continue
    }

    // ── Program X failed: <reason> ────────────────────────────────────────
    const failedMatch = FAILED_RE.exec(line)
    if (failedMatch) {
      if (stack.length > 0) {
        const top = stack[stack.length - 1]!
        top.failed = true
        top.failReason = failedMatch[2]!
        closeTop()
      }
      continue
    }
  }

  // Drain any unclosed frames (malformed / truncated without marker)
  while (stack.length > 0) closeTop()

  return roots
}

/**
 * Parses the transaction's inner instructions into a nested CPI call tree.
 * Handles both legacy Message and MessageV0 (versioned transactions).
 * Top-level instructions sit at depth 0; each inner instruction bumps depth by 1.
 *
 * @param resolvedKeys - Optional pre-resolved account key list (base58 strings).
 *   When provided (e.g. from `resolveAllAccountKeys` with ALT expansion) this
 *   replaces the static key list so ALT-referenced accounts are named correctly.
 */
export function buildCpiTree(
  tx: VersionedTransactionResponse,
  resolvedKeys?: string[],
): CpiNode[] {
  const message = tx.transaction.message
  const isV0 = 'staticAccountKeys' in message

  // Keys may be PublicKey objects (from RPC) or plain strings (from fixtures/tests)
  const toStr = (k: unknown): string =>
    typeof k === 'string' ? k : (k as { toBase58(): string }).toBase58()

  const accountKeys = resolvedKeys ?? (isV0
    ? (message as MessageV0).staticAccountKeys.map(toStr)
    : (message as Message).accountKeys.map(toStr))

  const failed = tx.meta?.err !== null
  const innerInstructions = tx.meta?.innerInstructions ?? []
  const innerByParent = new Map<number, (typeof innerInstructions)[number]['instructions']>()
  for (const group of innerInstructions) {
    innerByParent.set(group.index, group.instructions)
  }

  if (isV0) {
    const msg = message as MessageV0
    return msg.compiledInstructions.map((ix, i): CpiNode => {
      const programId = accountKeys[ix.programIdIndex] ?? 'unknown'
      const accounts = ix.accountKeyIndexes.map((idx) => accountKeys[idx] ?? 'unknown')
      const data = Buffer.from(ix.data).toString('base64')
      const children: CpiNode[] = (innerByParent.get(i) ?? []).map((inner): CpiNode => ({
        programId: accountKeys[inner.programIdIndex] ?? 'unknown',
        accounts: inner.accounts.map((idx) => accountKeys[idx] ?? 'unknown'),
        data: inner.data,
        depth: 1,
        children: [],
        failed: false,
      }))
      return { programId, accounts, data, depth: 0, children, failed: i === msg.compiledInstructions.length - 1 ? failed : false }
    })
  }

  // Legacy message
  const msg = message as Message
  return msg.instructions.map((ix, i): CpiNode => {
    const programId = accountKeys[ix.programIdIndex] ?? 'unknown'
    const accounts = ix.accounts.map((idx) => accountKeys[idx] ?? 'unknown')
    const children: CpiNode[] = (innerByParent.get(i) ?? []).map((inner): CpiNode => ({
      programId: accountKeys[inner.programIdIndex] ?? 'unknown',
      accounts: inner.accounts.map((idx) => accountKeys[idx] ?? 'unknown'),
      data: inner.data,
      depth: 1,
      children: [],
      failed: false,
    }))
    return { programId, accounts, data: ix.data, depth: 0, children, failed: i === msg.instructions.length - 1 ? failed : false }
  })
}
