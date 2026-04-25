local M = {}

M.config = {
  cluster = 'mainnet',
  rpc_url  = nil,
}

function M.setup(opts)
  M.config = vim.tbl_deep_extend('force', M.config, opts or {})
end

return M
