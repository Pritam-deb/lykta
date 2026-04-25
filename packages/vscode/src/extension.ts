import * as vscode from 'vscode'
import { Connection } from '@solana/web3.js'
import { fetchTransaction } from '@lykta/core'
import { CpiGraphPanel } from './panels/CpiGraphPanel.js'

/**
 * Fetches and decodes a transaction on the extension host (Node.js side),
 * then forwards the result to the WebView via postMessage.
 *
 * Flow:
 *  1. Open/reveal the panel and immediately post { type: 'loading' } so the
 *     WebView shows a spinner while the network call is in flight.
 *  2. Fetch + decode the transaction using @lykta/core.
 *  3a. Success → post { type: 'decoded', data: LyktaTransaction }
 *  3b. Failure → post { type: 'error', message } AND show a VS Code
 *      notification so the user sees the error even if the panel is hidden.
 *
 * The WebView never touches the network — all decoding runs here.
 */
async function fetchAndSend(
  signature: string,
  extensionUri: vscode.Uri,
  connection: Connection,
): Promise<void> {
  const panel = CpiGraphPanel.createOrShow(extensionUri)
  panel.postMessage({ type: 'loading' })

  try {
    const tx = await fetchTransaction(signature, connection)
    panel.setTitle(tx.signature)
    panel.postMessage({ type: 'decoded', data: tx })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    panel.postMessage({ type: 'error', message })
    vscode.window.showErrorMessage(`Lykta: ${message}`)
  }
}

/** Prompts the user for a transaction signature and returns it, or undefined if cancelled. */
async function promptForSignature(): Promise<string | undefined> {
  return vscode.window.showInputBox({
    prompt: 'Enter transaction signature',
    placeHolder: '5KtP4R…',
    validateInput: (v) => (v.length < 32 ? 'Signature too short' : null),
  })
}

export function activate(context: vscode.ExtensionContext): void {
  const getConnection = (): Connection => {
    const config = vscode.workspace.getConfiguration('lykta')
    const rpcUrl = config.get<string>('rpcUrl') ?? 'https://api.devnet.solana.com'
    return new Connection(rpcUrl, 'confirmed')
  }

  // lykta.inspectTransaction — fetch, decode, and display a transaction
  const inspectCmd = vscode.commands.registerCommand('lykta.inspectTransaction', async () => {
    const signature = await promptForSignature()
    if (!signature) return
    await fetchAndSend(signature, context.extensionUri, getConnection())
  })

  // lykta.explainError — same round-trip as inspectTransaction; the WebView
  // will highlight the error block once the full UI is built in Day 5.
  const explainCmd = vscode.commands.registerCommand('lykta.explainError', async () => {
    const signature = await promptForSignature()
    if (!signature) return
    await fetchAndSend(signature, context.extensionUri, getConnection())
  })

  context.subscriptions.push(inspectCmd, explainCmd)
}

export function deactivate(): void {}
