// The JavaScript every prerendered page ships on arrival, held to a budget per
// kind of page. Run after `next build` (the build script does): it reads each
// page's HTML in .next/server/app, adds up the gzipped size of the scripts it
// loads (its <script src> tags and the scripts it preloads; the legacy
// nomodule polyfill is never fetched by a browser that runs the site), and
// fails when the heaviest page of a kind is over that kind's budget.
// Chunks a page loads later (a menu's art, the search palette, a dialog) don't
// count: that's the point of loading them later.
//
//   node scripts/js-budget.ts [--dir .next]
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'

/**
 * KB of gzipped JavaScript on arrival per kind of page: the heaviest page of
 * each kind must fit `max`, and the kind's median page `median` where one is
 * set. The numbers, and what they were set from, live in scripts/budgets.json.
 */
export const BUDGETS = (JSON.parse(readFileSync(new URL('./budgets.json', import.meta.url), 'utf8')) as { js: Record<RouteType, Budget> }).js

export interface Budget {
  max: number
  median?: number
  note?: string
}

export type RouteType = 'home' | 'docs' | 'icons' | 'illustrations' | 'loaders' | 'miniatures' | 'create' | 'view' | 'pages'

/** The kind of page a URL is, for its budget. */
export function routeType(url: string): RouteType {
  if (url === '/') return 'home'
  const first = url.split('/')[1]!
  if (first === 'docs' || first === 'icons' || first === 'illustrations' || first === 'loaders' || first === 'miniatures' || first === 'create' || first === 'view') return first
  return 'pages'
}

/** The page's URL for its prerendered file (`docs/components/button.html` is `/docs/components/button`). */
export function urlOf(file: string) {
  const path = file.split(sep).join('/').replace(/\.html$/, '')
  return path === 'index' ? '/' : `/${path}`
}

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1]

/** The scripts a page's HTML makes the browser fetch on arrival: its script tags (not nomodule) and its script preloads. */
export function arrivalScripts(html: string): string[] {
  const found = new Set<string>()
  for (const [tag] of html.matchAll(/<script\b[^>]*>/gi)) {
    const src = attr(tag, 'src')
    if (src && !/\snomodule\b/i.test(tag)) found.add(src)
  }
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = attr(tag, 'rel')?.toLowerCase()
    const href = attr(tag, 'href')
    if (!href) continue
    if (rel === 'modulepreload' || (rel === 'preload' && attr(tag, 'as')?.toLowerCase() === 'script')) found.add(href)
  }
  return [...found].filter((src) => src.startsWith('/_next/static/'))
}

export interface PageWeight {
  url: string
  type: RouteType
  scripts: number
  /** Gzipped bytes. */
  bytes: number
}

/** Every prerendered page's JavaScript on arrival, from a build's output directory. */
export function measure(dir: string): PageWeight[] {
  const app = join(dir, 'server/app')
  const sizes = new Map<string, number>()
  const gz = (src: string) => {
    let size = sizes.get(src)
    if (size === undefined) {
      size = gzipSync(readFileSync(join(dir, src.replace(/^\/_next\//, '').split('?')[0]!))).length
      sizes.set(src, size)
    }
    return size
  }
  const pages: PageWeight[] = []
  for (const entry of readdirSync(app, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue
    const file = join(entry.parentPath, entry.name)
    const url = urlOf(relative(app, file))
    const scripts = arrivalScripts(readFileSync(file, 'utf8'))
    pages.push({ url, type: routeType(url), scripts: scripts.length, bytes: scripts.reduce((sum, src) => sum + gz(src), 0) })
  }
  return pages
}

export interface TypeReport {
  type: RouteType
  pages: number
  median: number
  heaviest: PageWeight
  budget: Budget
  over: boolean
}

/** Each kind of page against its budget (KB): its heaviest page, and its median page where the budget names one. */
export function check(pages: PageWeight[], budgets: Record<RouteType, Budget> = BUDGETS): TypeReport[] {
  const byType = new Map<RouteType, PageWeight[]>()
  for (const page of pages) byType.set(page.type, [...(byType.get(page.type) ?? []), page])
  return [...byType].map(([type, list]) => {
    const sorted = [...list].sort((a, b) => a.bytes - b.bytes)
    const heaviest = sorted.at(-1)!
    const budget = budgets[type]
    const median = sorted[Math.floor(sorted.length / 2)]!.bytes
    const over = heaviest.bytes > budget.max * 1024 || (budget.median !== undefined && median > budget.median * 1024)
    return { type, pages: list.length, median, heaviest, budget, over }
  })
}

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`

function main() {
  const at = process.argv.indexOf('--dir')
  const dir = at > 0 ? process.argv[at + 1]! : fileURLToPath(new URL('../.next', import.meta.url))
  const reports = check(measure(dir))
  console.log('js-budget: gzipped JavaScript on arrival per page')
  for (const r of reports.sort((a, b) => a.type.localeCompare(b.type))) {
    console.log(
      `${r.over ? '✗' : '✓'} ${r.type.padEnd(14)} ${String(r.pages).padStart(4)} pages  median ${kb(r.median).padStart(9)}  heaviest ${kb(r.heaviest.bytes).padStart(9)} (${r.heaviest.url})  budget ${r.budget.max} KB${r.budget.median ? ` (median ${r.budget.median} KB)` : ''}`,
    )
  }
  const over = reports.filter((r) => r.over)
  if (over.length) {
    console.error(`\njs-budget: over budget: ${over.map((r) => `${r.type} (heaviest ${r.heaviest.url} ${kb(r.heaviest.bytes)}, median ${kb(r.median)}; budget ${r.budget.max} KB${r.budget.median ? `, median ${r.budget.median} KB` : ''})`).join(', ')}`)
    console.error('Load what a page needs only on interaction or below the fold (next/dynamic, import()), or raise the budget in scripts/js-budget.ts with a reason.')
    process.exit(1)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
