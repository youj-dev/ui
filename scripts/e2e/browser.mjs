// Loads each install-test page in headless Chromium: per item, whether it rendered or threw (its
// error boundary); per page, console errors and warnings, page errors and failed requests. A page
// with console or page errors is loaded again item by item (?only=<id>) to say which item logged them.

// Noise that isn't the kit's: the starter's Google Fonts (offline runs), the favicon, WebGL driver notes.
const IGNORE = [/favicon\.ico/, /fonts\.(googleapis|gstatic)\.com/, /GL Driver Message|GPU stall/]

async function visit(browser, url, settle) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const out = { console: [], pageErrors: [], failed: [], threw: {}, rendered: 0, count: 0, stuck: [] }
  const ignored = (text) => IGNORE.some((re) => re.test(text))
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && !ignored(m.text()) && out.console.push(`${m.type()}: ${m.text()}`.slice(0, 600)))
  page.on('pageerror', (e) => out.pageErrors.push(String(e.stack ?? e.message).slice(0, 800)))
  page.on('requestfailed', (r) => !ignored(r.url()) && out.failed.push(`${r.failure()?.errorText} ${r.url()}`))
  page.on('response', (r) => r.status() >= 400 && !ignored(r.url()) && out.failed.push(`${r.status()} ${r.url()}`))
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 60_000 })
    await page.waitForSelector('[data-e2e-count]', { timeout: 30_000 })
    const pending = () => page.$$eval('[data-e2e-item]', (els) => els.filter((s) => (s.textContent ?? '').startsWith('loading ')).map((s) => s.getAttribute('data-e2e-item')))
    for (let i = 0; i < 40 && (await pending()).length; i++) await page.waitForTimeout(500)
    await page.waitForTimeout(settle)
    for (const button of await page.$$('[data-sound-press]')) await button.click().catch(() => {})
    for (const control of await page.$$('[data-e2e-count] ~ section [role="switch"]')) await control.click().catch(() => {})
    const state = await page.evaluate(() => ({ e2e: window.__e2e ?? { errors: {}, rendered: [] }, count: Number(document.querySelector('[data-e2e-count]')?.getAttribute('data-e2e-count')) }))
    out.threw = state.e2e.errors
    out.rendered = new Set(state.e2e.rendered).size
    out.count = state.count
    out.stuck = await pending()
  } catch (error) {
    out.pageErrors.push(`navigation: ${error.message}`)
  }
  await page.close()
  return out
}

/** @returns {Promise<Record<string, object>>} each group's result, with `perItem` where the page logged errors */
export async function checkPages(base, groups, log) {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  const results = {}
  try {
    for (const group of groups) {
      const url = `${base}/e2e/${group}`
      const result = await visit(browser, url, 2500)
      if (result.console.length || result.pageErrors.length) {
        result.perItem = {}
        const page = await browser.newPage()
        await page.goto(url, { waitUntil: 'load' }).catch(() => {})
        const ids = await page.$$eval('[data-e2e-item]', (els) => els.map((e) => e.getAttribute('data-e2e-item'))).catch(() => [])
        await page.close()
        for (const id of ids) {
          const one = await visit(browser, `${url}?only=${encodeURIComponent(id)}`, 1200)
          const errors = [...one.console, ...one.pageErrors, ...one.failed]
          if (errors.length || Object.keys(one.threw).length) result.perItem[id] = { errors, threw: one.threw }
        }
      }
      results[group] = result
      log(`${group}: ${result.rendered}/${result.count} rendered, ${Object.keys(result.threw).length} threw, ${result.stuck.length} stuck, ${result.console.length} console, ${result.pageErrors.length} page errors, ${result.failed.length} failed requests`)
    }
  } finally {
    await browser.close()
  }
  return results
}

/** Loads one page and returns what it logged (the registry app's every-module page). */
export async function loadPage(url) {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const problems = []
  page.on('console', (m) => m.type() === 'error' && !IGNORE.some((re) => re.test(m.text())) && problems.push(`console: ${m.text()}`))
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(3000)
  await browser.close()
  return problems
}
