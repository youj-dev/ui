// @vitest-environment node
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { arrivalScripts, BUDGETS, check, measure, routeType, urlOf } from './js-budget'

describe('arrivalScripts', () => {
  it('counts script tags and script preloads, and skips the nomodule polyfill, styles and other origins', () => {
    const html = `<head>
      <link rel="stylesheet" href="/_next/static/chunks/a.css">
      <link rel="preload" href="/_next/static/chunks/b.css" as="style">
      <link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/lazy.js">
      <link rel="modulepreload" href="/_next/static/chunks/mod.js">
      <script src="/_next/static/chunks/polyfill.js" noModule=""></script>
      <script src="/_next/static/chunks/main.js" async=""></script>
      <script src="/_next/static/chunks/main.js" async=""></script>
      <script src="https://example.com/x.js"></script>
      <script>self.__next_f.push([1,"static/chunks/not-fetched.js"])</script>
    </head>`
    expect(arrivalScripts(html).sort()).toEqual(['/_next/static/chunks/lazy.js', '/_next/static/chunks/main.js', '/_next/static/chunks/mod.js'])
  })
})

describe('routeType and urlOf', () => {
  it('files each prerendered page under its kind', () => {
    expect(urlOf('index.html')).toBe('/')
    expect(urlOf(join('docs', 'components', 'button.html'))).toBe('/docs/components/button')
    expect(routeType('/')).toBe('home')
    expect(routeType('/docs')).toBe('docs')
    expect(routeType('/docs/components/table')).toBe('docs')
    // The galleries are redirects now: only the docs, /view and the explorers are pages.
    expect(routeType('/components')).toBe('pages')
    expect(routeType('/screens/mail')).toBe('pages')
    expect(routeType('/loaders')).toBe('loaders')
    expect(routeType('/miniatures')).toBe('miniatures')
    expect(routeType('/view/blocks/app-billing')).toBe('view')
    expect(routeType('/about')).toBe('pages')
    expect(routeType('/docsearch')).toBe('pages')
  })
})

describe('measure and check', () => {
  let dir: string
  const chunk = (name: string, bytes: number) => {
    // Random-ish text so gzip can't fold it away: the size on the wire is what's budgeted.
    let s = ''
    for (let i = 0; s.length < bytes; i++) s += ((i * 2654435761) >>> 0).toString(36)
    writeFileSync(join(dir, 'static/chunks', name), s)
    return gzipSync(s).length
  }
  const page = (path: string, scripts: string[]) => {
    mkdirSync(join(dir, 'server/app', path, '..'), { recursive: true })
    writeFileSync(join(dir, 'server/app', path), `<html><head>${scripts.map((s) => `<script src="/_next/static/chunks/${s}" async></script>`).join('')}</head></html>`)
  }

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'js-budget-'))
    mkdirSync(join(dir, 'static/chunks'), { recursive: true })
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  it('adds up each page’s gzipped scripts, counting a shared chunk on every page that loads it', () => {
    const shared = chunk('shared.js', 20_000)
    const docs = chunk('docs.js', 8_000)
    page('index.html', ['shared.js'])
    page('docs/components/button.html', ['shared.js', 'docs.js'])
    const pages = measure(dir).sort((a, b) => a.url.localeCompare(b.url))
    expect(pages).toEqual([
      { url: '/', type: 'home', scripts: 1, bytes: shared },
      { url: '/docs/components/button', type: 'docs', scripts: 2, bytes: shared + docs },
    ])
  })

  it('fails a kind of page on its heaviest page, and passes the kinds that fit', () => {
    const pages = [
      { url: '/docs/a', type: 'docs' as const, scripts: 3, bytes: 100 * 1024 },
      { url: '/docs/b', type: 'docs' as const, scripts: 4, bytes: 260 * 1024 },
      { url: '/', type: 'home' as const, scripts: 3, bytes: 90 * 1024 },
    ]
    const reports = check(pages, { ...BUDGETS, docs: { max: 250 }, home: { max: 250 } })
    const docs = reports.find((r) => r.type === 'docs')!
    expect(docs).toMatchObject({ pages: 2, over: true })
    expect(docs.heaviest.url).toBe('/docs/b')
    expect(reports.find((r) => r.type === 'home')!.over).toBe(false)
  })

  it('fails a kind whose median page is over its median budget, though its heaviest fits', () => {
    const pages = [100, 210, 220].map((kb, i) => ({ url: `/docs/${i}`, type: 'docs' as const, scripts: 3, bytes: kb * 1024 }))
    expect(check(pages, { ...BUDGETS, docs: { max: 250, median: 200 } })[0]).toMatchObject({ over: true, median: 210 * 1024 })
    expect(check(pages, { ...BUDGETS, docs: { max: 250, median: 215 } })[0]).toMatchObject({ over: false })
  })
})

describe('budgets.json', () => {
  it('gives every kind of page a JS budget, and every top-level route of the app a kind that has one', () => {
    const kinds = ['home', 'docs', 'icons', 'illustrations', 'loaders', 'miniatures', 'create', 'view', 'pages']
    expect(Object.keys(BUDGETS).sort()).toEqual([...kinds].sort())
    const routes = readdirSync(new URL('../app', import.meta.url), { withFileTypes: true }).filter((e) => e.isDirectory() && !/^[_@(]/.test(e.name) && e.name !== 'api')
    for (const { name } of routes) expect(BUDGETS[routeType(`/${name}`)], name).toBeDefined()
  })
})
