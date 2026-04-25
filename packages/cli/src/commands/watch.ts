import { Command } from 'commander'
import { Connection, PublicKey } from '@solana/web3.js'
import { decodeTransaction } from '@lykta/core'
import chalk from 'chalk'
import { renderInspect } from './inspect.js'

const CLUSTERS: Record<string, string> = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  localnet: 'http://127.0.0.1:8899',
}

export const watchCommand = new Command('watch')
  .description('Subscribe to a program via websocket and print each transaction as it lands.')
  .argument('<programId>', 'Program ID to watch')
  .option('-c, --cluster <cluster>', 'Cluster to query: mainnet | devnet | localnet', 'devnet')
  .option('-r, --rpc <url>', 'Custom RPC URL (overrides --cluster)')
  .option('-u, --url <url>', 'Custom RPC URL — alias for --rpc')
  .option('--errors-only', 'Only print failed transactions')
  .action((programId: string, opts: { cluster: string; rpc?: string; url?: string; errorsOnly?: boolean }) => {
    const rpcUrl = opts.url ?? opts.rpc ?? CLUSTERS[opts.cluster] ?? CLUSTERS['devnet']!
    const connection = new Connection(rpcUrl, 'confirmed')

    console.log(chalk.dim(`Watching ${programId.slice(0, 8)}… on ${opts.url ?? opts.rpc ?? opts.cluster}`))
    if (opts.errorsOnly) console.log(chalk.dim('(errors only)'))
    console.log(chalk.dim('Press Ctrl+C to stop.\n'))

    connection.onLogs(
      new PublicKey(programId),
      async ({ signature, err }) => {
        if (opts.errorsOnly && !err) return

        try {
          const tx = await decodeTransaction(signature, connection)
          console.log(chalk.dim(`─── ${signature.slice(0, 16)}… ───`))
          renderInspect(tx)
          console.log()
        } catch {
          console.log(chalk.dim(`  ⚠ could not decode ${signature.slice(0, 16)}… (not yet confirmed)`))
        }
      },
      'confirmed',
    )
  })
