// `pnpm build:static`: the site as plain files in out/, for Cloudflare (cloudflare.config.ts,
// worker/index.ts). The same code as the Vercel build, with YOUJ_STATIC_EXPORT=1:
// next.config.mjs switches to `output: 'export'` and to the `.static.tsx` files instead of
// the `.vercel.ts(x)` ones (the stealth proxy, its server sign-in page and login route).
// Then it finishes out/:
//   - the Markdown twins at /docs/<slug>.md (Vercel rewrites them to /llms.md/<slug>),
//   - _headers and _redirects, from the lists next.config.mjs serves (lib/static-host.ts),
//   - and a check against Workers' static-asset limits.
// --budgets also holds the build's own output (.next, which `next build` writes for an export too) to the page-weight and
// JS budgets, so ship needs no second build for them. The build leaves .next/cache alone, so a repeat build is warm.
// --expect <mode> builds nothing: it fails unless the last build here was for that mode (what the production deploy
// runs first, so a staging out/ can't be released as production).
// The registry, install commands, sitemap and canonical links name NEXT_PUBLIC_SITE_URL: the origin of
// --mode staging|production (lib/cf-env.ts; production when no mode is given), unless the variable is set.
// The origin is baked into out/, so each environment gets its own build; a build for anything but
// production tells search engines not to index it (app/layout.tsx).
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CF_ENVS } from '../lib/cf-env.ts'
import { headersFile, redirectsFile } from '../lib/static-host.ts'

const DOCS = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(DOCS, 'out')
/** Workers static assets: at most 20,000 files, each at most 25 MiB. */
const MAX_FILES = 20_000
const MAX_BYTES = 25 * 1024 * 1024

const MARKER = join(DOCS, '.build-static.json')
const expectAt = process.argv.indexOf('--expect')
if (expectAt !== -1) {
  const want = process.argv[expectAt + 1]
  const built = existsSync(MARKER) ? (JSON.parse(readFileSync(MARKER, 'utf8')) as { mode?: string }).mode : undefined
  if (built !== want) {
    console.error(`build:static: out/ was built for ${built ?? 'nothing'}, not ${want}; run pnpm -F docs build:static --mode ${want}`)
    process.exit(1)
  }
  process.exit(0)
}

const modeAt = process.argv.indexOf('--mode')
const mode = modeAt === -1 ? 'production' : process.argv[modeAt + 1]
if (mode !== 'staging' && mode !== 'production') {
  console.error(`build:static: --mode is staging or production (got ${mode ?? 'nothing'})`)
  process.exit(2)
}
const origin = `https://${CF_ENVS[mode].domains[0]}`
const env = { ...process.env, YOUJ_STATIC_EXPORT: '1', NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || origin }
const run = (command: string, args: string[]) => execFileSync(command, args, { cwd: DOCS, env, stdio: 'inherit' })

if (!process.argv.includes('--finish-only')) {
  rmSync(OUT, { recursive: true, force: true })
  rmSync(MARKER, { force: true })
  run('pnpm', ['generate'])
  run('pnpm', ['exec', 'next', 'build'])
}

if (process.argv.includes('--budgets')) {
  run('node', ['scripts/page-weight.ts'])
  run('node', ['scripts/js-budget.ts'])
}

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]))

// The twins: out/llms.md/<slug>.md → out/docs/<slug>.md, their public URLs (app/llms.md's route explains
// the names). /docs.md itself is app/docs.md; the Worker serves /llms.md/<slug> from these (lib/static-host.ts).
const twins = files(join(OUT, 'llms.md'))
for (const file of twins) {
  const target = join(OUT, 'docs', relative(join(OUT, 'llms.md'), file))
  mkdirSync(dirname(target), { recursive: true })
  renameSync(file, target)
}
rmSync(join(OUT, 'llms.md'), { recursive: true })

writeFileSync(join(OUT, '_headers'), headersFile())
writeFileSync(join(OUT, '_redirects'), redirectsFile())

const all = files(OUT).map((file) => ({ file: relative(OUT, file), bytes: statSync(file).size }))
const largest = all.reduce((a, b) => (b.bytes > a.bytes ? b : a))
const mib = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MiB`
console.log(
  `build:static: for ${env.NEXT_PUBLIC_SITE_URL}; out/ holds ${all.length} files (limit ${MAX_FILES}), ${mib(all.reduce((sum, f) => sum + f.bytes, 0))}; largest ${largest.file} at ${mib(largest.bytes)} (limit 25 MiB)\n` +
    `build:static: ${twins.length} Markdown twins`,
)
if (all.length > MAX_FILES || largest.bytes > MAX_BYTES) {
  console.error('build:static: out/ is over the Workers static-asset limits')
  process.exitCode = 1
} else {
  writeFileSync(MARKER, JSON.stringify({ mode, origin: env.NEXT_PUBLIC_SITE_URL }))
}
