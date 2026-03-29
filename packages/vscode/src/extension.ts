import * as vscode from 'vscode'
import { Connection } from '@solana/web3.js'
import { fetchTransaction } from '@lykta/core'
import { CpiGraphPanel } from './panels/CpiGraphPanel.js'

export function activate(context: vscode.ExtensionContext): void {
  // Command: inspect a transaction by signature (entry point for all panels)
  const inspectCmd = vscode.commands.registerCommand('lykta.inspectTransaction', async () => {
    const signature = await vscode.window.showInputBox({
      prompt: 'Enter transaction signature',
      placeHolder: '5KtP4R…',
      validateInput: (v) => (v.length < 32 ? 'Signature too short' : null),
    })

    if (!signature) return

    const config = vscode.workspace.getConfiguration('lykta')
    const rpcUrl = config.get<string>('rpcUrl') ?? 'https://api.devnet.solana.com'

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: 'Lykta: Fetching transaction…' },
      async () => {
        try {
          const connection = new Connection(rpcUrl, 'confirmed')
          const tx = await fetchTransaction(signature, connection)

          // Open the CPI Graph panel (Week 2: add Diff and CU panels here)
          CpiGraphPanel.createOrShow(context.extensionUri, tx)
        } catch (err) {
          vscode.window.showErrorMessage(
            `Lykta: ${err instanceof Error ? err.message : String(err)}`,
          )
        }
      },
    )
  })

  context.subscriptions.push(inspectCmd)
}

export function deactivate(): void {}
