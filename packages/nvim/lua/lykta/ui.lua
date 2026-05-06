local M = {}

--- Open a centered floating window and return (buf, win).
function M.open_float(title)
  local width  = math.floor(vim.o.columns * 0.82)
  local height = math.floor(vim.o.lines   * 0.72)
  local row    = math.floor((vim.o.lines   - height) / 2)
  local col    = math.floor((vim.o.columns - width)  / 2)

  local buf = vim.api.nvim_create_buf(false, true)
  vim.bo[buf].bufhidden = 'wipe'
  vim.bo[buf].filetype  = 'lykta'

  local win = vim.api.nvim_open_win(buf, true, {
    relative  = 'editor',
    width     = width,
    height    = height,
    row       = row,
    col       = col,
    style     = 'minimal',
    border    = 'rounded',
    title     = ' ' .. title .. ' ',
    title_pos = 'center',
  })

  vim.keymap.set('n', 'q',     '<cmd>close<cr>', { buffer = buf, silent = true })
  vim.keymap.set('n', '<Esc>', '<cmd>close<cr>', { buffer = buf, silent = true })

  return buf, win
end

--- Replace buffer contents (handles modifiable guard).
function M.write_lines(buf, lines)
  if not vim.api.nvim_buf_is_valid(buf) then return end
  vim.bo[buf].modifiable = true
  vim.api.nvim_buf_set_lines(buf, 0, -1, false, lines)
  vim.bo[buf].modifiable = false
end

return M
