// Holds every prerendered page to a weight budget: the HTML document and the RSC payload a client-side navigation
// fetches. Run after `next build` (part of `pnpm build`), or on a static export: `node scripts/page-weight.ts [dir]`,
// where dir is `.next/server/app` (the default) or an `output: 'export'` folder (its payloads are `.txt`). It prints the
// heaviest page of each kind and fails the build when any page is over its kind's budget.
//
// What made pages heavy, and what keeps them light (apps/docs/README.md, "Page weight"): highlighted code for Code tabs
// is fetched when a tab opens (app/code), tokens are coloured by class (lib/code-theme.ts), the docs tree reaches
// only the pages whose sidebar draws it, and a part that repeats (a props row, a heading's anchor) wears one named
// utility, not its utilities spelled out each time (styles/site.css). A page over budget has usually started shipping
// something like that again.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'

export interface PageWeight {
  /** The page's path, as the build names its file: `docs/components/button`, `index`. */
  page: string
  /** The HTML document, raw and gzipped, in bytes. */
  html: number
  gzip: number
  /** The RSC payload a client-side navigation fetches, in bytes (0 when the page has none). */
  rsc: number
}

export interface Budget {
  /** What the budget covers, for the report. */
  kind: string
  /** Which pages: the first budget whose pattern matches a page's path is its budget. */
  match: RegExp
  /** Limits in KB. */
  html: number
  gzip: number
  rsc: number
}

const KB = 1024

/** Per kind of page, from scripts/budgets.json (which also says what each limit was set from). */
export const BUDGETS: Budget[] = (JSON.parse(readFileSync(new URL('./budgets.json', import.meta.url), 'utf8')) as { pageWeight: Array<Omit<Budget, 'match'> & { match: string }> }).pageWeight.map(
  ({ match, ...rest }) => ({ ...rest, match: new RegExp(match) }),
)

/** A file's size in bytes, or undefined when it doesn't exist. */
function sizeOf(path: string): number | undefined {
  try {
    return statSync(path).size
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

/** Every page under a build's app folder: each `.html` with its `.rsc` (next build) or `.txt` (export) beside it. */
export function measure(dir: string): PageWeight[] {
  const out: PageWeight[] = []
  const walk = (at: string) => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const name = entry.name
      const path = join(at, name)
      if (entry.isDirectory()) {
        // Next's own pages (_not-found, _global-error) and export's chunk folder aren't the site's.
        if (!name.startsWith('_')) walk(path)
        continue
      }
      if (!name.endsWith('.html') || name.startsWith('_')) continue
      const base = path.slice(0, -'.html'.length)
      const html = readFileSync(path)
      const rsc = [`${base}.rsc`, `${base}.txt`].map(sizeOf).find((size) => size !== undefined) ?? 0
      out.push({ page: relative(dir, base).replace(/\\/g, '/'), html: html.length, gzip: gzipSync(html).length, rsc })
    }
  }
  walk(dir)
  return out.sort((a, b) => a.page.localeCompare(b.page))
}

export function budgetFor(page: string, budgets: Budget[] = BUDGETS): Budget {
  return budgets.find((b) => b.match.test(page)) ?? budgets.at(-1)!
}

export interface Overage {
  page: string
  kind: string
  metric: 'html' | 'gzip' | 'rsc'
  size: number
  limit: number
}

/** Every page, metric by metric, that is over its budget. */
export function overBudget(pages: PageWeight[], budgets: Budget[] = BUDGETS): Overage[] {
  return pages.flatMap((p) => {
    const b = budgetFor(p.page, budgets)
    return (['html', 'gzip', 'rsc'] as const).filter((m) => p[m] > b[m] * KB).map((metric) => ({ page: p.page, kind: b.kind, metric, size: p[metric], limit: b[metric] * KB }))
  })
}

const kb = (n: number) => `${(n / KB).toFixed(0)} KB`

/** The heaviest page of each kind, by HTML, for the build log. */
export function report(pages: PageWeight[], budgets: Budget[] = BUDGETS): string {
  const rows = budgets.flatMap((b) => {
    const mine = pages.filter((p) => budgetFor(p.page, budgets) === b)
    if (!mine.length) return []
    const top = mine.reduce((a, p) => (p.html > a.html ? p : a))
    const median = [...mine].sort((a, p) => a.html - p.html)[Math.floor(mine.length / 2)]!
    return [
      `  ${b.kind.padEnd(13)} ${String(mine.length).padStart(4)} pages  median ${kb(median.html).padStart(7)}  heaviest ${top.page} ${kb(top.html)} (gzip ${kb(top.gzip)}, rsc ${kb(top.rsc)})  budget ${b.html}/${b.gzip}/${b.rsc} KB`,
    ]
  })
  return rows.join('\n')
}

function main() {
  const dir = process.argv[2] ?? fileURLToPath(new URL('../.next/server/app', import.meta.url))
  let pages: PageWeight[]
  try {
    pages = measure(dir)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    console.error(`page weight: no build at ${dir}; run next build first`)
    process.exit(1)
  }
  console.log(`page weight: ${pages.length} pages (html / gzip / rsc)\n${report(pages)}`)
  const over = overBudget(pages)
  if (over.length) {
    console.error(`\npage weight: ${over.length} over budget\n${over.map((o) => `  ${o.page} (${o.kind}): ${o.metric} ${kb(o.size)} > ${kb(o.limit)}`).join('\n')}`)
    process.exit(1)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
