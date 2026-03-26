import * as vscode from 'vscode'
import type { SolScopeTransaction } from '@solscope/core'

/**
 * CPI Graph WebView panel.
 * Renders an interactive CPI call tree using vis.js Network.
 *
 * Week 2 task: replace the placeholder HTML with a full React + vis.js WebView app.
 */
export class CpiGraphPanel {
  public static currentPanel: CpiGraphPanel | undefined
  private readonly _panel: vscode.WebviewPanel
  private _disposables: vscode.Disposable[] = []

  public static createOrShow(extensionUri: vscode.Uri, tx: SolScopeTransaction): void {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One

    if (CpiGraphPanel.currentPanel) {
      CpiGraphPanel.currentPanel._panel.reveal(column)
      CpiGraphPanel.currentPanel._update(tx)
      return
    }

    const panel = vscode.window.createWebviewPanel(
      'solscope.cpiGraph',
      `SolScope — ${tx.signature.slice(0, 8)}…`,
      column,
      {
        enableScripts: true,
        // All network requests must go through the extension host, not the WebView.
        // The WebView receives pre-fetched data via postMessage.
        localResourceRoots: [extensionUri],
      },
    )

    CpiGraphPanel.currentPanel = new CpiGraphPanel(panel, tx)
  }

  private constructor(panel: vscode.WebviewPanel, tx: SolScopeTransaction) {
    this._panel = panel
    this._update(tx)
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)
  }

  private _update(tx: SolScopeTransaction): void {
    this._panel.title = `SolScope — ${tx.signature.slice(0, 8)}…`
    this._panel.webview.html = this._getHtml(tx)
  }

  private _getHtml(tx: SolScopeTransaction): string {
    const status = tx.success ? '✓ Success' : '✗ Failed'
    const statusColor = tx.success ? '#4ade80' : '#f87171'

    // TODO (Week 2): replace with full React + vis.js WebView bundle
    // The bundle is built by esbuild and served from extensionUri/dist/webview/
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SolScope CPI Graph</title>
  <style>
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 16px; }
    h2 { color: ${statusColor}; }
    pre { background: var(--vscode-textBlockQuote-background); padding: 12px; border-radius: 4px; font-size: 12px; overflow: auto; }
    .placeholder { border: 1px dashed var(--vscode-editorHint-foreground); padding: 24px; text-align: center; border-radius: 8px; margin-top: 24px; }
  </style>
</head>
<body>
  <h2>${status} — ${tx.signature.slice(0, 16)}…</h2>
  <p>Slot: ${tx.slot} &nbsp;|&nbsp; Fee: ${tx.fee / 1e9} SOL &nbsp;|&nbsp; ${tx.totalCu} CU total</p>

  <div class="placeholder">
    <strong>CPI Graph — Week 2 task</strong><br>
    Interactive vis.js tree will render here.<br><br>
    Raw CPI data available — ${tx.cpiTree.length} top-level instruction(s).
  </div>

  <pre>${JSON.stringify(tx.cpiTree, null, 2)}</pre>
</body>
</html>`
  }

  public dispose(): void {
    CpiGraphPanel.currentPanel = undefined
    this._panel.dispose()
    for (const d of this._disposables) d.dispose()
    this._disposables = []
  }
}
