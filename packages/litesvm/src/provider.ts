import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import { LiteSVM, type TransactionMetadata, type FailedTransactionMetadata } from 'litesvm'
import { parseCpiTree } from '@lykta/core'
import type { CpiNode } from '@lykta/core'
import bs58 from 'bs58'
import type { SolScopeTestResult } from './reporter.js'

/**
 * Walks a CPI tree depth-first and returns the first node where `failed` is
 * true. Depth-first order means we reach the deepest failing call first —
 * that's the actual root cause, not the outer frame that propagated the error.
 *
 * Returns `null` if no failed node is found (e.g. the tx succeeded).
 */
export function findFailedNode(nodes: CpiNode[]): CpiNode | null {
  for (const node of nodes) {
    if (node.failed) return node
    const found = findFailedNode(node.children)
    if (found) return found
  }
  return null
}

/**
 * Formats a concise error block from a failed CPI node and the transaction logs.
 * Printed to stderr by sendAndConfirm() before rethrowing so test output shows
 * the root cause without requiring a debugger.
 *
 * Output format:
 *   ✗ <programName | short programId> failed
 *     Reason: <failReason | 'unknown'>
 *     Last logs:
 *       Program log: ...
 *       Program log: ...
 */
export function buildErrorSummary(node: CpiNode, logs: string[]): string {
  const label = node.programName ?? `${node.programId.slice(0, 8)}…`
  const reason = node.failReason ?? 'unknown'

  // Keep only log lines that mention this program, then take the last 5
  const relevant = logs
    .filter((l) => l.includes(node.programId) || l.startsWith('Program log:'))
    .slice(-5)
    .map((l) => `      ${l}`)
    .join('\n')

  return [
    `✗ ${label} failed`,
    `  Reason: ${reason}`,
    `  Last logs:`,
    relevant || '      (none)',
  ].join('\n')
}

/**
 * Parses the CPI call tree from a LiteSVM FailedTransactionMetadata by
 * extracting its log messages and passing them to parseCpiTree() from
 * @lykta/core. No synthetic VersionedTransactionResponse needed — the
 * log-based parser works directly from the string array.
 */
function parseCpiFromMeta(failed: FailedTransactionMetadata): CpiNode[] {
  return parseCpiTree(failed.meta().logs())
}

/**
 * LyktaProvider owns the LiteSVM instance and exposes the subset of its API
 * that LyktaTestContext needs: loading programs, funding accounts, and
 * sending transactions.
 *
 * Wrapping LiteSVM here keeps LyktaTestContext free of direct SVM calls and
 * makes the provider easy to stub in unit tests.
 */
export class LyktaProvider {
  readonly svm: LiteSVM
  private results = new Map<string, SolScopeTestResult>()

  constructor() {
    this.svm = new LiteSVM()
      .withSysvars()
      .withBuiltins()
      .withDefaultPrograms()
  }

  /**
   * Load a compiled Solana program (.so binary) into the SVM under the given program ID.
   * @param programId  The public key to register the program at.
   * @param binary     Raw bytes of the compiled BPF/SBF program.
   */
  loadProgram(programId: PublicKey, binary: Uint8Array): void {
    this.svm.addProgram(programId, binary)
  }

  /**
   * Airdrop lamports to an address, funding it for test transactions.
   * @param address  Recipient public key.
   * @param lamports Amount to airdrop in lamports.
   */
  airdrop(address: PublicKey, lamports: bigint): TransactionMetadata | FailedTransactionMetadata | null {
    return this.svm.airdrop(address, lamports)
  }

  /**
   * Sends a transaction through LiteSVM, stores the result, and returns the
   * base58 signature on success.
   *
   * On failure: parses the CPI tree from logs, finds the deepest failing node,
   * prints a formatted error block to stderr, stores the result, then rethrows
   * so the calling test fails with a clear message.
   */
  sendAndConfirm(tx: Transaction | VersionedTransaction): string {
    const sigBytes = tx instanceof Transaction
      ? (tx.signature ?? new Uint8Array(64))
      : tx.signatures[0] ?? new Uint8Array(64)
    const signature = bs58.encode(sigBytes)

    const result = this.svm.sendTransaction(tx)
    const isFailed = typeof (result as unknown as { err?: unknown }).err === 'function'

    if (!isFailed) {
      this.results.set(signature, { signature, success: true, errorSummary: null })
      return signature
    }

    const failed = result as unknown as FailedTransactionMetadata
    const logs = failed.meta().logs()
    const tree = parseCpiFromMeta(failed)
    const failedNode = findFailedNode(tree)

    const errorSummary = failedNode
      ? buildErrorSummary(failedNode, logs)
      : `✗ Transaction failed\n  ${failed.toString()}`

    process.stderr.write(`\n${errorSummary}\n\n`)
    this.results.set(signature, { signature, success: false, errorSummary })
    throw new Error(errorSummary)
  }

  /**
   * Returns the stored result for a given signature, or undefined if the
   * signature was never processed by this provider instance.
   */
  getResult(signature: string): SolScopeTestResult | undefined {
    return this.results.get(signature)
  }
}
