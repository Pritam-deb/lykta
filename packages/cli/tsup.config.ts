import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/bin.ts', 'src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  // Bundle @lykta/core directly into the CLI so npx @lykta/cli works without
  // @lykta/core needing its own npm publish. Heavy transitive deps
  // (@solana/web3.js, @coral-xyz/anchor, etc.) remain external.
  noExternal: ['@lykta/core'],
  outExtension: () => ({ js: '.js' }),
})
