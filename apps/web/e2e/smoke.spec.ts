/**
 * Week 2 regression gate — smoke test.
 *
 * Loads a known devnet transaction and asserts:
 *   1. Status banner renders "Success" or "Failed"
 *   2. CPI Tree tab is visible and the graph canvas / node list renders
 *
 * Run against Vercel:
 *   BASE_URL=https://your-app.vercel.app pnpm test:e2e
 *
 * Run against local dev server (must be running):
 *   pnpm dev   (in a separate terminal)
 *   pnpm test:e2e
 */
import { test, expect } from '@playwright/test'

// Squads Protocol `create` tx on devnet — confirmed, will never disappear.
const DEVNET_SIG =
  '2dFnV9p5XudD1y4yyKfKi8dJiQgKXvGcajigh9scnzunWDMiR9ieoHw6Ge19pu9oTq5LuBSddwQQYivhccQF8h4Y'

test.describe('Transaction page smoke test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/tx/${DEVNET_SIG}?cluster=devnet`)
  })

  test('status banner shows "Success" or "Failed"', async ({ page }) => {
    // TxStatusBanner renders a data-testid="tx-status-banner" element
    // whose text contains the word Success or Failed.
    const banner = page.locator('[data-testid="tx-status-banner"]')
    await expect(banner).toBeVisible({ timeout: 15_000 })
    const text = await banner.textContent()
    expect(text?.match(/Success|Failed/)).toBeTruthy()
  })

  test('CPI Tree tab renders at least one node', async ({ page }) => {
    // TxTabs renders "CPI Tree" as the first tab (active by default).
    // CpiGraph wraps each node in a div[data-testid="cpi-node"].
    const cpiNode = page.locator('[data-testid="cpi-node"]').first()
    await expect(cpiNode).toBeVisible({ timeout: 15_000 })
  })

  test('page title contains the signature prefix', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveTitle(/2dFnV9p5/)
  })
})
