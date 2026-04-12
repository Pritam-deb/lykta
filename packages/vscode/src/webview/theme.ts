/**
 * Semantic colour tokens mapped to VS Code CSS variables.
 *
 * All values are CSS `var(--vscode-*)` strings — they resolve correctly in
 * both light and dark themes without any JavaScript.  Use these everywhere
 * instead of hardcoded hex so the WebView respects the user's active theme.
 *
 * Reference: https://code.visualstudio.com/api/references/theme-color
 */
export const colors = {
  // Status
  success:        'var(--vscode-charts-green)',
  error:          'var(--vscode-charts-red)',
  warning:        'var(--vscode-charts-yellow)',
  accent:         'var(--vscode-charts-purple)',

  // Badge backgrounds (error / success pill)
  errorBg:        'var(--vscode-inputValidation-errorBackground)',
  successBg:      'var(--vscode-diffEditor-insertedLineBackground)',

  // Borders
  errorBorder:    'var(--vscode-charts-red)',
  accentBorder:   'var(--vscode-charts-purple)',

  // Text
  muted:          'var(--vscode-descriptionForeground)',
  foreground:     'var(--vscode-foreground)',

  // Surfaces
  surface:        'var(--vscode-textBlockQuote-background)',
  panelBorder:    'var(--vscode-panel-border)',
}
