-- Auto-loaded by Neovim on startup. Registers all :Lykta* user commands.

--- Resolve the target signature/program-id:
---   1. explicit arg passed to the command
---   2. word under cursor (if it looks like a base58 hash / program id)
---   3. prompt the user
local function resolve(args, prompt)
  if args and args ~= '' then return args end
  local word = vim.fn.expand('<cword>')
  if #word >= 32 then return word end
  return vim.fn.input(prompt .. ': ')
end

vim.api.nvim_create_user_command('LyktaInspect', function(opts)
  local sig = resolve(opts.args, 'Transaction signature')
  if sig == '' then return end
  require('lykta.commands').inspect(sig)
end, { nargs = '?', desc = 'Lykta: inspect transaction (CPI tree + CU + diffs)' })

vim.api.nvim_create_user_command('LyktaDiff', function(opts)
  local sig = resolve(opts.args, 'Transaction signature')
  if sig == '' then return end
  require('lykta.commands').diff(sig)
end, { nargs = '?', desc = 'Lykta: show account & token diffs' })

vim.api.nvim_create_user_command('LyktaError', function(opts)
  local sig = resolve(opts.args, 'Transaction signature')
  if sig == '' then return end
  require('lykta.commands').error(sig, false)
end, { nargs = '?', desc = 'Lykta: explain transaction error' })

vim.api.nvim_create_user_command('LyktaErrorAI', function(opts)
  local sig = resolve(opts.args, 'Transaction signature')
  if sig == '' then return end
  require('lykta.commands').error(sig, true)
end, { nargs = '?', desc = 'Lykta: explain error with AI fix suggestion' })

vim.api.nvim_create_user_command('LyktaWatch', function(opts)
  local pid = resolve(opts.args, 'Program ID')
  if pid == '' then return end
  require('lykta.commands').watch(pid)
end, { nargs = '?', desc = 'Lykta: watch program transactions live' })
