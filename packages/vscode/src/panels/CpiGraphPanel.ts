import * as vscode from 'vscode'
import type { LyktaTransaction } from '@lykta/core'

// ── Message types ─────────────────────────────────────────────────────────────
// Sent from the extension host to the WebView via panel.webview.postMessage().
// The WebView listens with window.addEventListener('message', handler).

export type WebviewMessage =
  | { type: 'loading' }
  | { type: 'decoded'; data: LyktaTransaction }
  | { type: 'error'; message: string }

/**
 * Lykta transaction inspector panel.
 *
 * Opens beside the active editor (ViewColumn.Beside) and communicates with the
 * WebView exclusively through postMessage — the extension host runs all decoding,
 * the WebView only renders what it receives.
 *
 * Message flow:
 *   host → webview: { type: 'loading' }          — show spinner
 *   host → webview: { type: 'decoded', data }     — render transaction
 *   host → webview: { type: 'error', message }    — show error state
 */
export class CpiGraphPanel {
  public static currentPanel: CpiGraphPanel | undefined
  private readonly _panel: vscode.WebviewPanel
  private _disposables: vscode.Disposable[] = []

  /**
   * Creates the panel if it doesn't exist, or reveals and resets it if it does.
   * Always opens in ViewColumn.Beside so the user's code stays visible.
   */
  public static createOrShow(extensionUri: vscode.Uri): CpiGraphPanel {
    if (CpiGraphPanel.currentPanel) {
      CpiGraphPanel.currentPanel._panel.reveal(vscode.ViewColumn.Beside)
      return CpiGraphPanel.currentPanel
    }

    const panel = vscode.window.createWebviewPanel(
      'lykta.cpiGraph',
      'Lykta',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        // Allows the WebView to load scripts from the extension's dist/webview/ dir.
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist'),
        ],
      },
    )

    CpiGraphPanel.currentPanel = new CpiGraphPanel(panel, extensionUri)
    return CpiGraphPanel.currentPanel
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel
    this._panel.webview.html = this._getHtml(extensionUri)
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    // Stub: receive messages from the WebView (e.g. copy-to-clipboard, open-in-browser)
    this._panel.webview.onDidReceiveMessage(
      (_msg: unknown) => { /* reserved for webview → host messages */ },
      null,
      this._disposables,
    )
  }

  /** Send a typed message to the WebView. */
  public postMessage(msg: WebviewMessage): void {
    void this._panel.webview.postMessage(msg)
  }

  /** Update the panel title when a transaction is loaded. */
  public setTitle(signature: string): void {
    this._panel.title = `Lykta — ${signature.slice(0, 8)}…`
  }

  /**
   * Builds the WebView HTML shell.
   *
   * Security notes:
   *   - CSP restricts scripts to ${webview.cspSource} only — no inline scripts,
   *     no external origins.
   *   - The bundle is loaded via webview.asWebviewUri() which converts the
   *     on-disk path to a vscode-resource: URI the WebView can fetch.
   *   - All dynamic data arrives via postMessage, never via template interpolation,
   *     so there is no XSS surface in this HTML.
   */
  private _getHtml(extensionUri: vscode.Uri): string {
    const webview = this._panel.webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'app.global.js'),
    )
    const csp = `default-src 'none'; script-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline';`

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <title>Lykta</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 16px;
      margin: 0;
    }
    #root { width: 100%; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="${scriptUri}"></script>
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
