local ui = require('lykta.ui')

local M = {}

--- Build the base CLI command, appending RPC/cluster flags from config.
local function base_cmd(subcmd_args)
  local cfg = require('lykta').config
  local cmd = vim.list_extend({ 'npx', '--yes', '@lykta/cli' }, subcmd_args)
  if cfg.rpc_url then
    vim.list_extend(cmd, { '--url', cfg.rpc_url })
  end
  if cfg.cluster and cfg.cluster ~= 'mainnet' then
    vim.list_extend(cmd, { '--cluster', cfg.cluster })
  end
  return cmd
end

--- Run a one-shot CLI command, stream stdout into a floating buffer.
local function run(args, title)
  local short = args[#args]:sub(1, 12) .. '…'
  local buf   = ui.open_float(title .. '  ' .. short)

  ui.write_lines(buf, { '  ⏳  Loading…' })

  local lines = {}

  vim.fn.jobstart(base_cmd(args), {
    stdout_buffered = true,
    stderr_buffered = true,
    on_stdout = function(_, data)
      if data then vim.list_extend(lines, data) end
    end,
    on_stderr = function(_, data)
      if data then vim.list_extend(lines, data) end
    end,
    on_exit = function(_, code)
      vim.schedule(function()
        if #lines == 0 then
          lines = { '  (no output — exit code ' .. code .. ')' }
        end
        ui.write_lines(buf, lines)
      end)
    end,
  })
end

--- Watch streams output incrementally; killed when the buffer closes.
local function run_watch(program_id)
  local short = program_id:sub(1, 12) .. '…'
  local buf   = ui.open_float('󰈈  Lykta Watch  ' .. short)

  local lines = { '  Watching ' .. program_id, '' }
  ui.write_lines(buf, lines)

  local job_id = vim.fn.jobstart(base_cmd({ 'watch', program_id }), {
    on_stdout = function(_, data)
      if not data then return end
      vim.schedule(function()
        vim.list_extend(lines, data)
        ui.write_lines(buf, lines)
      end)
    end,
    on_stderr = function(_, data)
      if not data or (data[1] == '' and #data == 1) then return end
      vim.schedule(function()
        vim.list_extend(lines, data)
        ui.write_lines(buf, lines)
      end)
    end,
  })

  -- stop the job when the user closes the float
  vim.api.nvim_buf_attach(buf, false, {
    on_detach = function()
      vim.fn.jobstop(job_id)
    end,
  })
end

function M.inspect(sig)
  run({ 'inspect', sig }, '󰍉  Lykta Inspect')
end

function M.diff(sig)
  run({ 'diff', sig }, '  Lykta Diff')
end

function M.error(sig, ai)
  local args = { 'error', sig }
  if ai then table.insert(args, '--ai') end
  run(args, '  Lykta Error')
end

function M.watch(program_id)
  run_watch(program_id)
end

return M
