import { Command } from 'commander'
import { Connection } from '@solana/web3.js'
import { decodeTransaction, type CpiNode, type LyktaTransaction } from '@lykta/core'
import chalk from 'chalk'

const KNOWN_PROGRAMS: Record<string, string> = {
  '11111111111111111111111111111111': 'System Program',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf8Ss623VQ5DA': 'Token Program',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe1bF': 'Associated Token Program',
  'ComputeBudget111111111111111111111111111111': 'Compute Budget',
  'Vote111111111111111111111111111111111111111p': 'Vote Program',
  'BPFLoaderUpgradeab1e11111111111111111111111': 'BPF Loader',
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s': 'Metaplex Token Metadata',
  'noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV': 'SPL Noop',
  'cndy3Z4yapfJBmL3ShUp5exZkqLc1VPjwAkzBx4W3RR': 'Candy Machine v3',
}

function resolveProgram(programId: string, programName?: string): string {
  return programName ?? KNOWN_PROGRAMS[programId] ?? programId
}

const CLUSTERS: Record<string, string> = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  localnet: 'http://127.0.0.1:8899',
}

const SQUADS_DEVNET_SIG =
  '2dFnV9p5XudD1y4yyKfKi8dJiQgKXvGcajigh9scnzunWDMiR9ieoHw6Ge19pu9oTq5LuBSddwQQYivhccQF8h4Y'

export const inspectCommand = new Command('inspect')
  .description('Decode and display a transaction — CPI tree, compute units, and account changes.')
  .argument('<signature>', 'Transaction signature')
  .option('-c, --cluster <cluster>', 'Cluster to query: mainnet | devnet | localnet', 'devnet')
  .option('-r, --rpc <url>', 'Custom RPC URL (overrides --cluster)')
  .option('-u, --url <url>', 'Custom RPC URL — alias for --rpc')
  .option('--json', 'Output raw decoded transaction as JSON')
  .addHelpText(
    'after',
    `
Examples:
  # Squads multisig create — devnet (copy-paste ready)
  $ lykta inspect ${SQUADS_DEVNET_SIG}

  # Same transaction on mainnet-beta
  $ lykta inspect <sig> --cluster mainnet

  # Machine-readable JSON output
  $ lykta inspect ${SQUADS_DEVNET_SIG} --json | jq '.cpiTree'
`,
  )
  .action(async (signature: string, opts: { cluster: string; rpc?: string; url?: string; json?: boolean }) => {
    const rpcUrl = opts.url ?? opts.rpc ?? CLUSTERS[opts.cluster] ?? CLUSTERS['devnet']!
    const connection = new Connection(rpcUrl, 'confirmed')

    console.log(chalk.dim(`Fetching ${signature} on ${opts.url ?? opts.rpc ?? opts.cluster}`))

    try {
      const tx = await decodeTransaction(signature, connection)

      // --json: output raw decoded object and exit before any chalk rendering
      if (opts.json) {
        console.log(JSON.stringify(tx, (_key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        , 2))
        return
      }

      renderInspect(tx)
    } catch (err) {
      console.error(chalk.red('Error:'), err instanceof Error ? err.message : String(err))
      process.exit(1)
    }
  })

export function renderInspect(tx: LyktaTransaction): void {
  // Status line
  const status = tx.success ? chalk.green('✓ SUCCESS') : chalk.red('✗ FAILED')
  console.log(`\n${status}  slot ${tx.slot}  fee ${tx.fee / 1e9} SOL  ${tx.totalCu} CU total\n`)

  // CPI tree
  console.log(chalk.bold('CPI Call Tree'))
  printCpiTree(tx.cpiTree)

  // Compute units
  console.log(chalk.bold('\nCompute Units'))
  for (const cu of tx.cuUsage) {
    const bar = buildCuBar(cu.percentUsed)
    const color = cu.percentUsed > 80 ? chalk.red : cu.percentUsed > 50 ? chalk.yellow : chalk.green
    console.log(`  ${color(bar)} ${cu.percentUsed}%  ${resolveProgram(cu.programId)}  ${cu.consumed}/${cu.limit}`)
  }

  // Error (failed tx only)
  if (!tx.success && tx.error) {
    const { name, message } = tx.error
    console.log(chalk.red(`\n✗ ${name ? `${name}: ` : ''}${message}`))
  }

  // Account diffs
  const changedAccounts = tx.accountDiffs.filter((d) => d.lamports.delta !== 0 || d.tokenBalance)
  if (changedAccounts.length > 0) {
    console.log(chalk.bold('\nAccount Changes'))
    for (const diff of changedAccounts) {
      const delta = diff.lamports.delta
      const sign = delta >= 0 ? chalk.green(`+${delta}`) : chalk.red(`${delta}`)
      console.log(`  ${diff.address}  ${sign} lamports`)
      if (diff.tokenBalance) {
        console.log(`    token ${diff.tokenBalance.mint}  ${diff.tokenBalance.pre} → ${diff.tokenBalance.post}`)
      }
    }
  }

  // Token diffs
  if (tx.tokenDiffs.length > 0) {
    console.log(chalk.bold('\nToken Diffs'))
    for (const diff of tx.tokenDiffs) {
      const sign = diff.delta >= 0n ? chalk.green(`+${diff.uiDelta}`) : chalk.red(diff.uiDelta)
      console.log(`  ${diff.address}  ${sign}  mint ${diff.mint}`)
    }
  }
}

function printCpiTree(nodes: CpiNode[], indent = 0): void {
  for (const node of nodes) {
    const prefix = '  '.repeat(indent) + (indent === 0 ? '▶ ' : '└─ ')
    const label = node.instructionName
      ? chalk.cyan(resolveProgram(node.programId, node.programName)) + chalk.dim(`:${node.instructionName}`)
      : chalk.cyan(resolveProgram(node.programId, node.programName))
    const failed = node.failed ? chalk.red(' ✗') : ''
    console.log(`${prefix}${label}${failed}`)
    if (node.children.length > 0) {
      printCpiTree(node.children, indent + 1)
    }
  }
}

function buildCuBar(percent: number): string {
  const filled = Math.round(percent / 5)
  return '[' + '█'.repeat(filled) + '░'.repeat(20 - filled) + ']'
}
