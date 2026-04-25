/**
 * Static lookup tables for well-known Solana programs and error codes.
 * Used by the IDL pipeline and error explainer to attach human-readable names
 * without requiring an RPC call or IDL fetch.
 */

/** Maps program ID → human-readable name for the most common Solana programs. */
export const KNOWN_PROGRAMS: ReadonlyMap<string, string> = new Map([
  // ── Core system programs ──────────────────────────────────────────────────
  ['11111111111111111111111111111111', 'System Program'],
  ['Vote111111111111111111111111111111111111111h', 'Vote Program'],
  ['Stake11111111111111111111111111111111111111', 'Stake Program'],
  ['Config1111111111111111111111111111111111111', 'Config Program'],
  ['BPFLoaderUpgradeab1e11111111111111111111111', 'BPF Upgradeable Loader'],
  ['NativeLoader1111111111111111111111111111111', 'Native Loader'],
  ['ComputeBudget111111111111111111111111111111', 'Compute Budget'],
  ['AddressLookupTab1e1111111111111111111111111', 'Address Lookup Table'],

  // ── SPL programs ──────────────────────────────────────────────────────────
  ['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', 'SPL Token'],
  ['TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb', 'SPL Token-2022'],
  ['ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe1bRS', 'Associated Token Account'],
  ['memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo', 'Memo v1'],
  ['MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr', 'Memo v2'],

  // ── Metaplex ──────────────────────────────────────────────────────────────
  ['metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s', 'Token Metadata'],
  ['cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ', 'Candy Machine v3'],
  ['auth9SigNpDKAR1xyF9pJa4bMPwsXDMDRFD3GoNZNiX', 'Token Auth Rules'],

  // ── DeFi — DEXes ─────────────────────────────────────────────────────────
  ['JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', 'Jupiter Aggregator v6'],
  ['675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', 'Raydium AMM v4'],
  ['CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK', 'Raydium CLMM'],
  ['whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc', 'Orca Whirlpool'],
  ['srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX', 'OpenBook v1'],
  ['opnb2LAfJYbRMAHHvqjCwQxanZn7n32ZGtPuRjSTdNQ', 'OpenBook v2'],

  // ── DeFi — Lending / Perps ────────────────────────────────────────────────
  ['dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH', 'Drift Protocol v2'],
  ['MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD', 'Marinade Finance'],
  ['So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo', 'Solend'],
  ['4MangoMjqJ2firMokCjjGgoK8d4MXcrgL7XJaL3w6fVg', 'Mango v4'],
  ['PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu', 'Phoenix Perpetuals'],

  // ── Infrastructure ────────────────────────────────────────────────────────
  ['SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu', 'Squads Protocol'],
  ['FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH', 'Pyth Oracle'],
  ['rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ', 'Switchboard'],
])

/**
 * Solana runtime `InstructionError` variant names → plain-English descriptions.
 * These are the string error keys returned in `meta.err.InstructionError[1]`.
 */
export const SYSTEM_ERRORS: ReadonlyMap<string, string> = new Map([
  ['GenericError', 'Generic instruction error'],
  ['InvalidArgument', 'Invalid argument provided to the instruction'],
  ['InvalidInstructionData', 'Invalid instruction data'],
  ['InvalidAccountData', 'Invalid account data for the instruction'],
  ['AccountDataTooSmall', 'Account data too small for the instruction'],
  ['InsufficientFunds', 'Insufficient funds for the instruction'],
  ['IncorrectProgramId', 'Incorrect program ID for the instruction'],
  ['MissingRequiredSignature', 'Missing required signature'],
  ['AccountAlreadyInitialized', 'Account already initialized'],
  ['UninitializedAccount', 'Attempt to use an uninitialized account'],
  ['UnbalancedInstruction', 'Program arithmetic overflowed — instruction unbalanced'],
  ['ModifiedProgramId', 'Instruction modified the program ID of an account'],
  ['ExternalAccountLamportSpend', 'Instruction spent lamports from an account it does not own'],
  ['ExternalAccountDataModified', 'Instruction modified data of an account it does not own'],
  ['ReadonlyLamportChange', 'Instruction changed lamports of a read-only account'],
  ['ReadonlyDataModified', 'Instruction modified data of a read-only account'],
  ['DuplicateAccountIndex', 'Instruction contains a duplicate account index'],
  ['ExecutableModified', 'Instruction changed executable flag of an account'],
  ['RentEpochModified', 'Instruction modified the rent epoch of an account'],
  ['NotEnoughAccountKeys', 'Insufficient account keys provided for the instruction'],
  ['AccountDataSizeChanged', 'Program other than the account owner changed account size'],
  ['AccountNotExecutable', 'The instruction expected an executable account'],
  ['AccountBorrowFailed', 'Failed to borrow a reference to an account'],
  ['AccountBorrowOutstanding', 'Account has an outstanding reference after execution'],
  ['DuplicateAccountOutOfSync', 'Duplicate accounts are not in sync'],
  ['InvalidError', 'Programmatic error does not match expected format'],
  ['ExecutableAccountNotRentExempt', 'Executable accounts must be rent-exempt'],
  ['UnsupportedSysvar', 'Unsupported sysvar requested'],
  ['IllegalOwner', 'Provided owner is not allowed'],
  ['MaxSeedLengthExceeded', 'Max seed length exceeded'],
  ['InvalidSeeds', 'Provided seeds do not result in a valid address'],
  ['InvalidRealloc', 'Failed to reallocate account data'],
  ['ComputationalBudgetExceeded', 'Compute budget exceeded'],
  ['PrivilegeEscalation', 'Cross-program invocation with unauthorized signer or writable account'],
  ['ProgramEnvironmentSetupFailure', 'Failed to create a program execution environment'],
  ['ProgramFailedToComplete', 'Program failed to complete without error'],
  ['ProgramFailedToCompile', 'Program failed to compile'],
  ['Immutable', 'Account is immutable'],
  ['IncorrectAuthority', 'Incorrect authority provided'],
  ['BorshIoError', 'An account could not be serialized or deserialized (Borsh)'],
  ['AccountNotRentExempt', 'Account is not rent-exempt'],
  ['InvalidAccountOwner', 'Invalid account owner'],
  ['ArithmeticOverflow', 'Program arithmetic overflowed'],
  ['UnsupportedAddress', 'Unsupported address type'],
  ['InvalidRentPayingAccount', 'Account is required to be rent-paying'],
  ['DuplicateInstruction', 'Duplicate instruction'],
  ['InsufficientFundsForRent', 'Insufficient funds to create an account with the specified data length'],
  ['MaxLoadedAccountsDataSizeExceeded', 'Max loaded account data size exceeded'],
  ['InvalidLoadedAccountsDataSizeLimit', 'Invalid loaded accounts data size limit'],
  ['ResizingNotAllowed', 'Resizing is not allowed for this account'],
  ['InvalidProgramForExecution', 'Program is not allowed to execute'],
  ['CallDepth', 'Cross-program invocation call depth too deep'],
  ['MissingAccount', 'An account required by the instruction is missing'],
])

/**
 * Top-level Solana transaction error codes — these appear as `meta.err` strings
 * (not wrapped in `InstructionError`) and describe failures that abort the whole
 * transaction before any instruction runs.
 * Source: https://github.com/solana-labs/solana/blob/master/sdk/src/transaction/error.rs
 */
export const TRANSACTION_ERRORS: ReadonlyMap<string, string> = new Map([
  ['AccountInUse', 'An account is already being used'],
  ['AccountLoadedTwice', 'An account was referenced more than once in a single transaction'],
  ['AccountNotFound', 'Attempt to debit an account that does not exist'],
  ['ProgramAccountNotFound', 'Attempt to load a program that does not exist'],
  ['InsufficientFundsForFee', 'Insufficient funds to pay transaction fee'],
  ['InvalidAccountForFee', 'This account cannot pay transaction fees'],
  ['AlreadyProcessed', 'This transaction has already been processed'],
  ['BlockhashNotFound', 'Blockhash not found — transaction may have expired'],
  ['CallChainTooDeep', 'Cross-program invocation call depth exceeded'],
  ['MissingSignatureForFee', 'Transaction requires a fee-payer signature'],
  ['InvalidAccountIndex', 'Transaction contains an invalid account reference'],
  ['SignatureFailure', 'Transaction signature verification failed'],
  ['InvalidProgramForExecution', 'This program may not be used for transaction execution'],
  ['SanitizeFailure', 'Transaction failed sanitization — likely malformed'],
  ['ClusterMaintenance', 'Cluster is under maintenance; transactions are not accepted'],
  ['AccountBorrowOutstanding', 'Transaction references an account with an outstanding borrow'],
  ['WouldExceedMaxBlockCostLimit', 'Transaction would exceed the maximum block cost limit'],
  ['UnsupportedVersion', 'Transaction version is not supported by this cluster'],
  ['InvalidWritableAccount', 'Transaction marks a non-writable account as writable'],
  ['WouldExceedMaxAccountCostLimit', 'Transaction would exceed the per-account cost limit'],
  ['WouldExceedAccountDataBlockLimit', 'Transaction would exceed the per-block account data limit'],
  ['TooManyAccountLocks', 'Transaction locks too many accounts'],
  ['AddressLookupTableNotFound', 'Transaction uses an address lookup table that does not exist'],
  ['InvalidAddressLookupTableIndex', 'Transaction references an invalid index in an address lookup table'],
  ['InvalidAddressLookupTableData', 'Address lookup table account contains invalid data'],
  ['InvalidAddressLookupTableOwner', 'Address lookup table account is owned by the wrong program'],
  ['WouldExceedMaxVoteCostLimit', 'Transaction would exceed the per-block vote cost limit'],
  ['WouldExceedAccountDataTotalLimit', 'Transaction would exceed the total account data size limit'],
  ['MaxLoadedAccountsDataSizeExceeded', 'Transaction loaded more account data than allowed'],
  ['InvalidLoadedAccountsDataSizeLimit', 'Transaction specifies an invalid account data size limit'],
  ['UnbalancedTransaction', 'Transaction credits and debits do not balance'],
])

/**
 * System Program custom error codes.
 * Source: https://github.com/solana-labs/solana/blob/master/sdk/program/src/system_instruction.rs
 *
 * These are `{ Custom: N }` codes emitted by the System Program (11111…).
 * They share the same code-space as SPL Token errors, so program-aware
 * lookup is required — never apply this map to a non-system-program instruction.
 */
export const SYSTEM_PROGRAM_ERRORS: ReadonlyMap<number, string> = new Map([
  [0, 'AccountAlreadyInUse: Account is already in use'],
  [1, 'ResultWithNegativeLamports: Resulting account would have negative lamports'],
  [2, 'InvalidProgramId: Program ID does not match expected'],
  [3, 'InvalidAccountDataLength: Invalid account data length'],
  [4, 'MaxSeedLengthExceeded: Max seed length exceeded'],
  [5, 'AddressWithSeedMismatch: Address does not match the derived seed'],
  [6, 'NonceNoRecentBlockhashes: Nonce account: no recent blockhashes'],
  [7, 'NonceBlockhashNotExpired: Nonce account: blockhash has not yet expired'],
  [8, 'NonceUnexpectedBlockhashValue: Nonce account: unexpected blockhash value'],
])

/**
 * Program IDs that share the SPL Token error code space.
 * Used by resolveError() to gate SPL_TOKEN_ERRORS lookups so a custom program
 * returning { Custom: 1 } is never misidentified as "InsufficientFunds".
 */
export const SPL_TOKEN_PROGRAM_IDS: ReadonlySet<string> = new Set([
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // SPL Token
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb', // SPL Token-2022
])

/**
 * SPL Token program custom error codes (shared between Token and Token-2022).
 * Source: https://github.com/solana-labs/solana-program-library/blob/master/token/program/src/error.rs
 */
export const SPL_TOKEN_ERRORS: ReadonlyMap<number, string> = new Map([
  [0, 'NotRentExempt: Lamport balance below rent-exempt threshold'],
  [1, 'InsufficientFunds: Insufficient funds for the operation'],
  [2, 'InvalidMint: Invalid mint'],
  [3, 'MintMismatch: Account does not belong to this mint'],
  [4, 'OwnerMismatch: Owner does not match'],
  [5, 'FixedSupply: Fixed supply mints cannot mint additional tokens'],
  [6, 'AlreadyInUse: Account or mint is already initialized'],
  [7, 'InvalidNumberOfProvidedSigners: Invalid number of provided signers'],
  [8, 'InvalidNumberOfRequiredSigners: Invalid number of required signers'],
  [9, 'UninitializedState: State is uninitialized'],
  [10, 'NativeNotSupported: Instruction does not support native tokens'],
  [11, 'NonNativeHasBalance: Non-native account can only be closed when its balance is zero'],
  [12, 'InvalidInstruction: Invalid instruction'],
  [13, 'InvalidState: State is invalid for the requested operation'],
  [14, 'Overflow: Operation overflowed'],
  [15, 'AuthorityTypeNotSupported: Account does not support specified authority type'],
  [16, 'MintCannotFreeze: Mint cannot freeze accounts'],
  [17, 'AccountFrozen: Account is frozen'],
  [18, 'MintDecimalsMismatch: Mint decimals mismatch'],
  [19, 'NonNativeNotSupported: Instruction does not support non-native tokens'],
])
