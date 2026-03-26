#!/usr/bin/env node
import { program } from 'commander'
import { inspectCommand } from './commands/inspect.js'
import { diffCommand } from './commands/diff.js'
import { errorCommand } from './commands/error.js'

program
  .name('solscope')
  .description('Developer observability for Solana — inspect any transaction from your terminal.')
  .version('0.1.0')

program.addCommand(inspectCommand)
program.addCommand(diffCommand)
program.addCommand(errorCommand)

program.parse()
