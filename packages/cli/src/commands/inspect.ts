import { Command } from 'commander'
import { Connection } from '@solana/web3.js'
import { fetchTransaction, type CpiNode } from '@solscope/core'
import chalk from 'chalk'

const CLUSTERS: Record<string, string> = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  localnet: 'http://127.0.0.1:8899',
}

export const inspectCommand = new Command('inspect')
  .description('Decode and display a transaction — CPI tree, compute units, and account changes.')
  .argument('<signature>', 'Transaction signature')
  .option('-c, --cluster <cluster>', 'Cluster to query: mainnet | devnet | localnet', 'devnet')
  .option('-r, --rpc <url>', 'Custom RPC URL (overrides --cluster)')
  .action(async (signature: string, opts: { cluster: string; rpc?: string }) => {
    const rpcUrl = opts.rpc ?? CLUSTERS[opts.cluster] ?? CLUSTERS['devnet']!
    const connection = new Connection(rpcUrl, 'confirmed')

    console.log(chalk.dim(`Fetching ${signature.slice(0, 8)}… on ${opts.rpc ?? opts.cluster}`))

    try {
      const tx = await fetchTransaction(signature, connection)

      // Status line
      const status = tx.success
        ? chalk.green('✓ SUCCESS')
        : chalk.red('✗ FAILED')
      console.log(`\n${status}  slot ${tx.slot}  fee ${tx.fee / 1e9} SOL  ${tx.totalCu} CU total\n`)

      // CPI tree
      console.log(chalk.bold('CPI Call Tree'))
      printCpiTree(tx.cpiTree)

      // Compute units
      console.log(chalk.bold('\nCompute Units'))
      for (const cu of tx.cuUsage) {
        const bar = buildCuBar(cu.percentUsed)
        const color = cu.percentUsed > 80 ? chalk.red : cu.percentUsed > 50 ? chalk.yellow : chalk.green
        console.log(`  ${color(bar)} ${cu.percentUsed}%  ${cu.programId.slice(0, 8)}…  ${cu.consumed}/${cu.limit}`)
      }

      // Account diffs
      const changedAccounts = tx.accountDiffs.filter((d) => d.lamports.delta !== 0 || d.tokenBalance)
      if (changedAccounts.length > 0) {
        console.log(chalk.bold('\nAccount Changes'))
        for (const diff of changedAccounts) {
          const delta = diff.lamports.delta
          const sign = delta >= 0 ? chalk.green(`+${delta}`) : chalk.red(`${delta}`)
          console.log(`  ${diff.address.slice(0, 8)}…  ${sign} lamports`)
          if (diff.tokenBalance) {
            console.log(`    token ${diff.tokenBalance.mint.slice(0, 8)}… ${diff.tokenBalance.pre} → ${diff.tokenBalance.post}`)
          }
        }
      }
    } catch (err) {
      console.error(chalk.red('Error:'), err instanceof Error ? err.message : String(err))
      process.exit(1)
    }
  })

function printCpiTree(nodes: CpiNode[], indent = 0): void {
  for (const node of nodes) {
    const prefix = '  '.repeat(indent) + (indent === 0 ? '▶ ' : '└─ ')
    const label = node.instructionName
      ? chalk.cyan(`${node.programName ?? node.programId.slice(0, 8)}`) + chalk.dim(`:${node.instructionName}`)
      : chalk.cyan(node.programId.slice(0, 8) + '…')
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
