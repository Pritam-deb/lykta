import { PublicKey } from '@solana/web3.js'
import { LiteSVM, type TransactionMetadata, type FailedTransactionMetadata } from 'litesvm'

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
}
