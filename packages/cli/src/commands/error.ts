import { Command } from 'commander'
import { Connection } from '@solana/web3.js'
import { fetchTransaction, explainError } from '@solscope/core'
import chalk from 'chalk'

const CLUSTERS: Record<string, string> = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  localnet: 'http://127.0.0.1:8899',
}

export const errorCommand = new Command('error')
  .description('Decode and explain why a failed transaction failed.')
  .argument('<signature>', 'Transaction signature')
  .option('-c, --cluster <cluster>', 'Cluster to query: mainnet | devnet | localnet', 'devnet')
  .option('-r, --rpc <url>', 'Custom RPC URL (overrides --cluster)')
  .action(async (signature: string, opts: { cluster: string; rpc?: string }) => {
    const rpcUrl = opts.rpc ?? CLUSTERS[opts.cluster] ?? CLUSTERS['devnet']!
    const connection = new Connection(rpcUrl, 'confirmed')

    try {
      const tx = await fetchTransaction(signature, connection)

      if (tx.success) {
        console.log(chalk.green('✓ Transaction succeeded — no error to explain.'))
        return
      }

      const error = await explainError(tx, connection)
      if (!error) {
        console.log(chalk.yellow('Could not decode error details.'))
        return
      }

      console.log(chalk.bold(chalk.red('\n✗ Transaction Failed\n')))
      console.log(`  ${chalk.bold('Program:')}    ${error.programId}`)
      console.log(`  ${chalk.bold('Error code:')} ${error.code}`)
      if (error.name) {
        console.log(`  ${chalk.bold('Error name:')} ${error.name}`)
      }
      console.log(`\n  ${chalk.bold('Explanation:')}\n  ${error.message}\n`)

      if (error.suggestion) {
        console.log(chalk.bold('  AI Fix Suggestion:'))
        console.log(chalk.cyan(`  ${error.suggestion}\n`))
      } else {
        console.log(chalk.dim('  (Set ANTHROPIC_API_KEY for AI-powered fix suggestions)\n'))
      }
    } catch (err) {
      console.error(chalk.red('Error:'), err instanceof Error ? err.message : String(err))
      process.exit(1)
    }
  })
