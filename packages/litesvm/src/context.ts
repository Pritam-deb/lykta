import { Transaction, VersionedTransaction } from '@solana/web3.js'
import type { Connection, PublicKey, VersionedTransactionResponse } from '@solana/web3.js'
import { decodeTransactionFromRaw, explainError } from '@lykta/core'
import type { LyktaTransaction } from '@lykta/core'
import type { TransactionMetadata, FailedTransactionMetadata, InnerInstruction } from 'litesvm'
import bs58 from 'bs58'
import { LyktaProvider } from './provider.js'
import { formatSummary } from './reporter.js'

export interface LyktaTestResult {
  /** Whether the transaction succeeded */
  success: boolean
  /** The enriched Lykta transaction (CPI tree, account diffs, CU usage) */
  tx: LyktaTransaction | null
  /** Pretty-printed observability summary for test output */
  summary: string
}

// ── Error adapters ───────────────────────────────────────────────────────────

/** Maps InstructionErrorFieldless enum values to their string names. */
const IX_ERROR_NAMES: Record<number, string> = {
  0: 'GenericError', 1: 'InvalidArgument', 2: 'InvalidInstructionData',
  3: 'InvalidAccountData', 4: 'AccountDataTooSmall', 5: 'InsufficientFunds',
  6: 'IncorrectProgramId', 7: 'MissingRequiredSignature', 8: 'AccountAlreadyInitialized',
  9: 'UninitializedAccount', 10: 'UnbalancedInstruction', 11: 'ModifiedProgramId',
  12: 'ExternalAccountLamportSpend', 13: 'ExternalAccountDataModified',
  14: 'ReadonlyLamportChange', 15: 'ReadonlyDataModified', 16: 'DuplicateAccountIndex',
  17: 'ExecutableModified', 18: 'RentEpochModified', 19: 'NotEnoughAccountKeys',
  20: 'AccountDataSizeChanged', 21: 'AccountNotExecutable', 22: 'AccountBorrowFailed',
  23: 'AccountBorrowOutstanding', 24: 'DuplicateAccountOutOfSync', 25: 'InvalidError',
  26: 'ExecutableDataModified', 27: 'ExecutableLamportChange', 28: 'ExecutableAccountNotRentExempt',
  29: 'UnsupportedProgramId', 30: 'CallDepth', 31: 'MissingAccount',
  32: 'ReentrancyNotAllowed', 33: 'MaxSeedLengthExceeded', 34: 'InvalidSeeds',
  35: 'InvalidRealloc', 36: 'ComputationalBudgetExceeded', 37: 'PrivilegeEscalation',
  38: 'ProgramEnvironmentSetupFailure', 39: 'ProgramFailedToComplete',
  40: 'ProgramFailedToCompile', 41: 'Immutable', 42: 'IncorrectAuthority',
  43: 'AccountNotRentExempt', 44: 'InvalidAccountOwner', 45: 'ArithmeticOverflow',
  46: 'UnsupportedSysvar', 47: 'IllegalOwner', 48: 'MaxAccountsDataAllocationsExceeded',
  49: 'MaxAccountsExceeded', 50: 'MaxInstructionTraceLengthExceeded',
  51: 'BuiltinProgramsMustConsumeComputeUnits',
}

/** Maps TransactionErrorFieldless enum values to their string names. */
const TX_ERROR_NAMES: Record<number, string> = {
  0: 'AccountInUse', 1: 'AccountLoadedTwice', 2: 'AccountNotFound',
  3: 'ProgramAccountNotFound', 4: 'InsufficientFundsForFee', 5: 'InvalidAccountForFee',
  6: 'AlreadyProcessed', 7: 'BlockhashNotFound', 8: 'CallChainTooDeep',
  9: 'MissingSignatureForFee', 10: 'InvalidAccountIndex', 11: 'SignatureFailure',
  12: 'InvalidProgramForExecution', 13: 'SanitizeFailure', 14: 'ClusterMaintenance',
  15: 'AccountBorrowOutstanding', 16: 'WouldExceedMaxBlockCostLimit', 17: 'UnsupportedVersion',
  18: 'InvalidWritableAccount', 19: 'WouldExceedMaxAccountCostLimit',
  20: 'WouldExceedAccountDataBlockLimit', 21: 'TooManyAccountLocks',
  22: 'AddressLookupTableNotFound', 23: 'InvalidAddressLookupTableOwner',
  24: 'InvalidAddressLookupTableData', 25: 'InvalidAddressLookupTableIndex',
  26: 'InvalidRentPayingAccount', 27: 'WouldExceedMaxVoteCostLimit',
  28: 'WouldExceedAccountDataTotalLimit', 29: 'MaxLoadedAccountsDataSizeExceeded',
}

/**
 * Converts a LiteSVM error value into the VersionedTransactionResponse.meta.err format.
 *
 * LiteSVM error types are NAPI class instances or const-enum numbers:
 *  - TransactionErrorFieldless  → number (enum)
 *  - TransactionErrorInstructionError → object with .index and .err()
 *  - InstructionErrorCustom → object with .code
 *  - InstructionErrorBorshIO → object with .msg
 */
function adaptError(
  err: unknown,
): string | { InstructionError: [number, string | { Custom: number }] } {
  // TransactionErrorInstructionError — has numeric `.index` and callable `.err`
  if (
    err !== null &&
    typeof err === 'object' &&
    'index' in err &&
    typeof (err as Record<string, unknown>).err === 'function'
  ) {
    const ixErr = err as { index: number; err(): unknown }
    const detail = ixErr.err()

    let ixDetail: string | { Custom: number }
    if (typeof detail === 'number') {
      // InstructionErrorFieldless enum value
      ixDetail = IX_ERROR_NAMES[detail] ?? `Unknown(${detail})`
    } else if (detail !== null && typeof detail === 'object' && 'code' in detail) {
      // InstructionErrorCustom
      ixDetail = { Custom: (detail as { code: number }).code }
    } else if (detail !== null && typeof detail === 'object' && 'msg' in detail) {
      // InstructionErrorBorshIO
      ixDetail = `BorshIoError: ${(detail as { msg: string }).msg}`
    } else {
      ixDetail = String(detail)
    }

    return { InstructionError: [ixErr.index, ixDetail] }
  }

  // TransactionErrorFieldless enum — just a number
  if (typeof err === 'number') {
    return TX_ERROR_NAMES[err] ?? `UnknownTransactionError(${err})`
  }

  // Structured errors with no special handling (DuplicateInstruction, etc.)
  return String(err)
}

/**
 * Converts LiteSVM's InnerInstruction[][] into the VersionedTransactionResponse
 * innerInstructions format. Empty groups are omitted (no inner instructions for that ix).
 */
function adaptInnerInstructions(
  groups: InnerInstruction[][],
): Array<{ index: number; instructions: Array<{ programIdIndex: number; accounts: number[]; data: string }> }> {
  return groups.flatMap((group, index) => {
    if (group.length === 0) return []
    return [{
      index,
      instructions: group.map((inner) => {
        const ix = inner.instruction()
        return {
          programIdIndex: ix.programIdIndex(),
          accounts: Array.from(ix.accounts()),
          data: bs58.encode(ix.data()),
        }
      }),
    }]
  })
}

/** Extracts the ordered account keys from a Transaction or VersionedTransaction. */
function getAccountKeys(tx: Transaction | VersionedTransaction): PublicKey[] {
  if (tx instanceof Transaction) {
    return tx.compileMessage().accountKeys
  }
  return tx.message.staticAccountKeys
}

/**
 * Assembles a VersionedTransactionResponse-shaped object from LiteSVM outputs
 * so the full Lykta pipeline (`decodeTransactionFromRaw`) can process it.
 *
 * Caveats vs a real RPC response:
 *  - fee is hardcoded to 5000 (LiteSVM does not expose it in TransactionMetadata)
 *  - preTokenBalances / postTokenBalances are empty (no token account introspection yet)
 *  - loadedAddresses is empty (ALT not needed in local tests)
 */
function buildVersionedTxResponse(
  tx: Transaction | VersionedTransaction,
  meta: TransactionMetadata,
  failed: FailedTransactionMetadata | null,
  preBalances: number[],
  postBalances: number[],
  slot: number,
  blockTime: number,
): VersionedTransactionResponse {
  return {
    slot,
    blockTime,
    transaction: tx as unknown as VersionedTransactionResponse['transaction'],
    meta: {
      err: failed ? adaptError(failed.err()) : null,
      fee: 5000,
      preBalances,
      postBalances,
      preTokenBalances: [],
      postTokenBalances: [],
      logMessages: meta.logs(),
      innerInstructions: adaptInnerInstructions(meta.innerInstructions()),
      computeUnitsConsumed: Number(meta.computeUnitsConsumed()),
      loadedAddresses: { writable: [], readonly: [] },
      rewards: [],
    },
    version: 'legacy',
  } as unknown as VersionedTransactionResponse
}

// ── LyktaTestContext ─────────────────────────────────────────────────────────

/**
 * LyktaTestContext wraps LiteSVM and intercepts transaction processing
 * to provide enhanced error reporting, CPI trees, account diffs, and CU profiling.
 *
 * Usage:
 *   const ctx = new LyktaTestContext()
 *   ctx.loadProgram(programId, binary)
 *   ctx.airdrop(wallet.publicKey, 10_000_000_000n)
 *   const result = await ctx.processTransaction(tx)
 *   if (!result.success) console.log(result.summary)
 */
export class LyktaTestContext {
  private provider: LyktaProvider
  // Stub connection — both resolveAllAccountKeys and fetchIdlsForPrograms
  // degrade gracefully when the connection has no methods (see transaction.ts).
  private connection: Connection = {} as Connection

  constructor() {
    this.provider = new LyktaProvider()
  }

  /** Load a compiled program (.so binary) into the test SVM. */
  loadProgram(programId: PublicKey, binary: Uint8Array): void {
    this.provider.loadProgram(programId, binary)
  }

  /** Fund an address with lamports. */
  airdrop(address: PublicKey, lamports: bigint): TransactionMetadata | FailedTransactionMetadata | null {
    return this.provider.airdrop(address, lamports)
  }

  /**
   * Processes a transaction through LiteSVM and returns enriched observability data.
   *
   * Steps:
   *  1. Capture pre-state lamport balances for all accounts in the transaction
   *  2. Run the transaction through LiteSVM
   *  3. Capture post-state lamport balances
   *  4. Build a VersionedTransactionResponse from captured state
   *  5. Run the full Lykta decode pipeline (CPI tree, diffs, CU, error resolution)
   *  6. On failure: call explainError and format a human-readable summary
   *
   * On failure, `result.summary` contains the full CPI tree, account diffs,
   * CU usage, and error explanation ready to print from a test assertion.
   */
  async processTransaction(tx: Transaction | VersionedTransaction): Promise<LyktaTestResult> {
    const svm = this.provider.svm
    const clock = svm.getClock()
    const slot = Number(clock.slot)
    const blockTime = Number(clock.unixTimestamp)

    // Step 1: Capture pre-state balances
    const accountKeys = getAccountKeys(tx)
    const preBalances = accountKeys.map((k) => Number(svm.getBalance(k) ?? 0n))

    // Step 2: Send transaction
    const result = svm.sendTransaction(tx)

    // Step 3: Capture post-state balances
    const postBalances = accountKeys.map((k) => Number(svm.getBalance(k) ?? 0n))

    // Step 4: Determine success — FailedTransactionMetadata has err() + meta(),
    // TransactionMetadata has logs() directly.
    const failed = typeof (result as unknown as { err?: unknown }).err === 'function'
      ? result as unknown as FailedTransactionMetadata
      : null
    const meta = failed ? failed.meta() : result as TransactionMetadata
    const success = failed === null

    // Step 5: Build synthetic VersionedTransactionResponse and decode
    const raw = buildVersionedTxResponse(tx, meta, failed, preBalances, postBalances, slot, blockTime)
    let lyktaTx: LyktaTransaction | null = null
    try {
      lyktaTx = await decodeTransactionFromRaw(raw, this.connection)
    } catch {
      // Decode failure — return minimal result so tests don't throw unexpectedly
    }

    // Step 6: Format summary (with AI suggestion on failure if GEMINI_API_KEY is set)
    let summary = ''
    if (lyktaTx) {
      const error = success ? undefined : await explainError(lyktaTx, this.connection)
      summary = formatSummary(lyktaTx, error)
    }

    return { success, tx: lyktaTx, summary }
  }
}
