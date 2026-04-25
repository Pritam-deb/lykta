import { defineConfig } from 'tsup'

export default defineConfig([
  // ── Extension host (Node/CJS) ──────────────────────────────────────────────
  {
    entry: ['src/extension.ts'],
    format: ['cjs'],
    dts: true,
    sourcemap: true,
    external: ['vscode'],
    // Bundle workspace dep + heavy Solana SDK so the .vsix is self-contained.
    // vsce packages with --no-dependencies, so nothing in node_modules is
    // available at runtime — everything must be inlined here.
    noExternal: ['@lykta/core', '@solana/web3.js', '@coral-xyz/anchor', '@google/genai'],
    outExtension: () => ({ js: '.js' }),
  },
  // ── WebView (browser/IIFE) ─────────────────────────────────────────────────
  {
    entry: ['src/webview/app.tsx'],
    format: ['iife'],
    outDir: 'dist/webview',
    platform: 'browser',
    dts: false,
  },
])
