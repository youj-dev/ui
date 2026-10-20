// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BUDGETS, budgetFor, measure, overBudget, report, type Budget } from './page-weight'

const KB = 1024
const budgets: Budget[] = [
  { kind: 'docs', match: /^docs(\/|$)/, html: 10, gzip: 2, rsc: 5 },
  { kind: 'other', match: /./, html: 20, gzip: 4, rsc: 10 },
]

describe('page weight', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'page-weight-'))
    mkdirSync(join(dir, 'docs/components'), { recursive: true })
    mkdirSync(join(dir, '_not-found'), { recursive: true })
    // Random bytes don't compress, so gzip stays near the raw size.
    const noise = (n: number) => Array.from({ length: n }, () => String.fromCharCode(33 + Math.floor(Math.random() * 90))).join('')
    writeFileSync(join(dir, 'index.html'), 'a'.repeat(4 * KB))
    writeFileSync(join(dir, 'index.rsc'), 'r'.repeat(2 * KB))
    writeFileSync(join(dir, 'docs/components/button.html'), noise(12 * KB))
    writeFileSync(join(dir, 'docs/components/button.rsc'), 'r'.repeat(3 * KB))
    // A static export names the payload .txt.
    writeFileSync(join(dir, 'docs.html'), 'a'.repeat(KB))
    writeFileSync(join(dir, 'docs.txt'), 'r'.repeat(6 * KB))
    writeFileSync(join(dir, '_not-found.html'), 'x'.repeat(100 * KB))
    writeFileSync(join(dir, '_not-found/page.html'), 'x'.repeat(100 * KB))
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  it('measures each page’s HTML, raw and gzipped, and its RSC payload from a build or an export, leaving Next’s own pages out', () => {
    const pages = measure(dir)
    expect(pages.map((p) => p.page)).toEqual(['docs', 'docs/components/button', 'index'])
    const index = pages.find((p) => p.page === 'index')!
    expect(index).toMatchObject({ html: 4 * KB, rsc: 2 * KB })
    expect(index.gzip).toBeLessThan(index.html)
    expect(pages.find((p) => p.page === 'docs')!.rsc).toBe(6 * KB)
  })

  it('fails every page over its kind’s budget, metric by metric, and passes the rest', () => {
    const over = overBudget(measure(dir), budgets)
    expect(over.map((o) => `${o.page} ${o.metric}`).sort()).toEqual(['docs rsc', 'docs/components/button gzip', 'docs/components/button html'])
    expect(over.find((o) => o.page === 'docs')).toMatchObject({ kind: 'docs', size: 6 * KB, limit: 5 * KB })
  })

  it('gives a page the first budget that matches it', () => {
    expect(budgetFor('docs', budgets).kind).toBe('docs')
    expect(budgetFor('docsy', budgets).kind).toBe('other')
    expect(budgetFor('docs/blocks/freight').kind).toBe('docs')
    expect(budgetFor('view/blocks/app-fleet-overview').kind).toBe('demo (/view)')
    expect(budgetFor('index').kind).toBe('home')
    expect(budgetFor('icons').kind).toBe('other')
  })

  it('reports the heaviest page of each kind', () => {
    const text = report(measure(dir), budgets)
    expect(text).toContain('heaviest docs/components/button')
    expect(text).toContain('heaviest index')
  })

  it('has a budget for everything: the last one matches any page', () => {
    expect(BUDGETS.at(-1)!.match.test('anything/at/all')).toBe(true)
  })
})
