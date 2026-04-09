#!/usr/bin/env node
import 'dotenv/config'
import { program } from 'commander'
import { inspectCommand } from './commands/inspect.js'
import { diffCommand } from './commands/diff.js'
import { errorCommand } from './commands/error.js'
import { watchCommand } from './commands/watch.js'

program
  .name('lykta')
  .description('Light inside every transaction — inspect any Solana transaction from your terminal.')
  .version('0.1.0')

program.addCommand(inspectCommand)
program.addCommand(diffCommand)
program.addCommand(errorCommand)
program.addCommand(watchCommand)

program.parse()
