import { Command } from 'commander'
import { Connection } from '@solana/web3.js'
import { fetchTransaction } from '@lykta/core'
import chalk from 'chalk'

const CLUSTERS: Record<string, string> = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  localnet: 'http://127.0.0.1:8899',
}

export const diffCommand = new Command('diff')
  .description('Show pre/post account state diffs for a transaction.')
  .argument('<signature>', 'Transaction signature')
  .option('-c, --cluster <cluster>', 'Cluster to query: mainnet | devnet | localnet', 'devnet')
  .option('-r, --rpc <url>', 'Custom RPC URL (overrides --cluster)')
  .action(async (signature: string, opts: { cluster: string; rpc?: string }) => {
    const rpcUrl = opts.rpc ?? CLUSTERS[opts.cluster] ?? CLUSTERS['devnet']!
    const connection = new Connection(rpcUrl, 'confirmed')

    try {
      const tx = await fetchTransaction(signature, connection)

      console.log(chalk.bold(`\nAccount Diffs — ${signature.slice(0, 16)}…\n`))

      for (const diff of tx.accountDiffs) {
        if (diff.lamports.delta === 0 && !diff.tokenBalance) continue

        console.log(chalk.bold(`  ${diff.address}`))

        if (diff.lamports.delta !== 0) {
          const delta = diff.lamports.delta
          const pre = (diff.lamports.pre / 1e9).toFixed(9)
          const post = (diff.lamports.post / 1e9).toFixed(9)
          const sign = delta >= 0 ? chalk.green(`+${(delta / 1e9).toFixed(9)}`) : chalk.red(`${(delta / 1e9).toFixed(9)}`)
          console.log(`    SOL: ${chalk.dim(pre)} → ${post}  (${sign})`)
        }

        if (diff.tokenBalance) {
          const { mint, pre, post, delta } = diff.tokenBalance
          const deltaNum = parseFloat(delta)
          const sign = deltaNum >= 0 ? chalk.green(`+${delta}`) : chalk.red(delta)
          console.log(`    Token ${mint.slice(0, 16)}…: ${chalk.dim(pre)} → ${post}  (${sign})`)
        }

        console.log()
      }
    } catch (err) {
      console.error(chalk.red('Error:'), err instanceof Error ? err.message : String(err))
      process.exit(1)
    }
  })
