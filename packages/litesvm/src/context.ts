import type { SolScopeTransaction } from '@solscope/core'
import { buildCpiTree, parseCuUsage, extractAccountDiffs, explainError } from '@solscope/core'

export interface SolScopeTestResult {
  /** Whether the transaction succeeded */
  success: boolean
  /** The enriched SolScope transaction (CPI tree, account diffs, CU usage) */
  tx: SolScopeTransaction | null
  /** Pretty-printed observability summary for test output */
  summary: string
}

/**
 * SolScopeTestContext wraps LiteSVM and intercepts transaction processing
 * to provide enhanced error reporting, CPI trees, account diffs, and CU profiling.
 *
 * Usage:
 *   const ctx = new SolScopeTestContext()
 *   await ctx.loadProgram(programBinary)
 *   const result = await ctx.processTransaction(tx)
 *   if (!result.success) console.log(result.summary)
 *
 * Week 4 task: wire up actual LiteSVM instance and intercept sendTransaction.
 */
export class SolScopeTestContext {
  constructor() {
    // TODO (Week 4): initialize litesvm instance
    // this.svm = new LiteSVM()
  }

  /**
   * Processes a transaction through LiteSVM and returns enriched observability data.
   * On failure, the summary includes the CPI tree, account diffs, CU usage, and
   * a plain-English error explanation (+ AI suggestion if ANTHROPIC_API_KEY is set).
   */
  async processTransaction(_tx: unknown): Promise<SolScopeTestResult> {
    // TODO (Week 4): implement
    // 1. Capture pre-state for all accounts
    // 2. Run tx through LiteSVM
    // 3. Capture post-state
    // 4. Build SolScopeTransaction from captured state
    // 5. On failure: call explainError, format summary
    throw new Error('SolScopeTestContext.processTransaction not yet implemented — Week 4 task')
  }
}
