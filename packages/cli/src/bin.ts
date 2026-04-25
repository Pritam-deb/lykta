#!/usr/bin/env node
import 'dotenv/config'
import { createRequire } from 'module'
import { program } from 'commander'
import { inspectCommand } from './commands/inspect.js'
import { diffCommand } from './commands/diff.js'
import { errorCommand } from './commands/error.js'
import { watchCommand } from './commands/watch.js'

const _require = createRequire(import.meta.url)
const { version } = _require('../package.json') as { version: string }

// Three copy-paste-ready devnet examples for first-time users.
// All three use the same Squads multisig-create transaction on devnet.
const EXAMPLE_SIG =
  '2dFnV9p5XudD1y4yyKfKi8dJiQgKXvGcajigh9scnzunWDMiR9ieoHw6Ge19pu9oTq5LuBSddwQQYivhccQF8h4Y'

program
  .name('lykta')
  .description('Light inside every transaction — inspect any Solana transaction from your terminal.')
  .version(version)
  .addHelpText(
    'after',
    `
Examples:
  # Full CPI tree + compute units + account changes (Squads multisig create, devnet)
  $ npx @lykta/cli inspect ${EXAMPLE_SIG}

  # Account and token balance diffs only
  $ npx @lykta/cli diff ${EXAMPLE_SIG}

  # Explain why a transaction failed (append --ai for a fix suggestion)
  $ npx @lykta/cli error ${EXAMPLE_SIG}

  # Watch a program in real-time, print only failures
  $ npx @lykta/cli watch SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu --errors-only

No API keys required — defaults to the public Solana devnet RPC.
`,
  )

program.addCommand(inspectCommand)
program.addCommand(diffCommand)
program.addCommand(errorCommand)
program.addCommand(watchCommand)

program.parse()
