// Consumer smoke test: installs the packed packages into two fresh apps (Next.js
// App Router and Vite + React, both on Tailwind v4) and builds them, so a broken
// `exports` map, a missing file in dist/, a bad "use client" or a stylesheet
// that doesn't resolve fails here instead of in someone's app.
//
//   node scripts/smoke-consumer.mjs          pack, install, build, render, clean up
//   node scripts/smoke-consumer.mjs --keep   keep the temp dir to poke at the apps
//   node scripts/smoke-consumer.mjs --no-browser   skip the Playwright render checks
//   node scripts/smoke-consumer.mjs --motion 13.4.4 --base-ui 1.8.0
//                                    install those versions of the peers instead of the newest the ranges allow
//
// The @youj packages come from the tarballs `pnpm pack` makes, exactly as
// scripts/release.mjs packs them for publishing; everything else comes from the
// public registry at its latest compatible version, like a new app would get.
import { spawn, execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, extname, join } from 'node:path'
import { parseArgs } from 'node:util'

const root = join(import.meta.dirname, '..')
const { values: options } = parseArgs({
  options: {
    keep: { type: 'boolean', default: false },
    'no-browser': { type: 'boolean', default: false },
    motion: { type: 'string' },
    'base-ui': { type: 'string' },
  },
})

// The packages a React app installs: the components, the motion core they run
// on, the sounds and the standalone icons. Dependencies first, as in scripts/release.mjs.
const PACKAGES = ['core', 'motion', 'loaders', 'sound', 'icons', 'illustrations', 'miniatures', 'ui']
// A class only the components use, so finding it in the app's CSS proves
// Tailwind scanned the built components through the stylesheet's @source.
const COMPONENT_CLASS = '.h-control'
// A token from core's stylesheet, which @youj/react/styles.css imports (through motion's).
const TOKEN = '--yj-duration-'
// The app's own Tailwind palette, which the stylesheet must leave alone.
const HOST_CLASSES = ['.bg-red-500', '.bg-white']
// Build output that means something went wrong even when the exit code is 0.
const BAD_OUTPUT = [/Module not found/i, /Failed to compile/i, /\berror\b/i]

const work = mkdtempSync(join(tmpdir(), 'youj-smoke-'))
const results = []
let failed = false

// ---------- helpers ----------

// Runs a command, streams nothing, returns { code, output } (stdout + stderr).
function run(cmd, args, cwd, { env = {} } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('close', (code) => resolve({ code, output }))
  })
}

// Records one check and prints it when done (installs run in parallel). `fn` returns nothing on success or throws with the reason.
async function step(name, fn) {
  const start = Date.now()
  try {
    const note = await fn()
    const seconds = ((Date.now() - start) / 1000).toFixed(1)
    console.log(`• ${name}: ok (${seconds}s)${note ? ` ${note}` : ''}`)
    results.push({ name, ok: true, seconds })
  } catch (error) {
    const seconds = ((Date.now() - start) / 1000).toFixed(1)
    console.log(`• ${name}: FAILED (${seconds}s)\n${indent(String(error.message ?? error))}`)
    results.push({ name, ok: false, seconds })
    failed = true
  }
}

const indent = (text) => text.split('\n').map((line) => `    ${line}`).join('\n')

// Runs a build-like command and fails on a non-zero exit or suspicious output.
async function build(cmd, args, cwd, env) {
  const { code, output } = await run(cmd, args, cwd, { env })
  writeFileSync(join(cwd, `${args.join('-').replace(/\W+/g, '-')}.log`), output)
  const bad = output.split('\n').filter((line) => BAD_OUTPUT.some((re) => re.test(line)))
  if (code !== 0 || bad.length) {
    throw new Error(`${cmd} ${args.join(' ')} exited ${code}${bad.length ? `; suspicious lines:\n${bad.slice(0, 20).join('\n')}` : ''}\n--- last output ---\n${output.split('\n').slice(-40).join('\n')}`)
  }
  return output
}

function filesUnder(dir, ext) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { recursive: true })
    .map((f) => join(dir, f))
    .filter((f) => f.endsWith(ext) && statSync(f).isFile())
}

function assertCss(dir) {
  const css = filesUnder(dir, '.css').map((f) => readFileSync(f, 'utf8')).join('\n')
  if (!css) throw new Error(`no CSS emitted under ${dir}`)
  if (!css.includes(COMPONENT_CLASS)) throw new Error(`the built CSS has no ${COMPONENT_CLASS}: Tailwind didn't scan the components`)
  if (!css.includes(TOKEN)) throw new Error(`the built CSS has no ${TOKEN}* tokens: core's stylesheet wasn't imported`)
  for (const cls of HOST_CLASSES) if (!css.includes(cls)) throw new Error(`the built CSS has no ${cls}: the stylesheet took the app's palette away`)
  return `(${Math.round(css.length / 1024)} KB CSS)`
}

// ---------- the apps ----------

// One page, shared by both apps: Button, Dialog and a data table built from the kit inside the
// providers (sound on, so its lazy player and pack must bundle), written the
// way the docs show them. Next gets "use client" on top.
const DEMO = `import { YoujProvider } from '@youj/core'
import { BellIcon } from '@youj/icons'
import { beacon } from '@youj/sound'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@youj/react'
import {
  DataTableColumnFilter,
  DataTableColumnHeader,
  DataTableSearch,
  DataTableToolbar,
  createDataTableColumnHelper,
  useDataTable,
} from '@youj/react/data-table'

interface Deployment {
  id: string
  commit: string
  status: 'ready' | 'error'
  duration: number
}

const rows: Deployment[] = [
  { id: 'd1', commit: 'Fix the focus ring on menus', status: 'ready', duration: 42 },
  { id: 'd2', commit: 'Add saved views', status: 'error', duration: 67 },
  { id: 'd3', commit: 'Virtualize long tables', status: 'ready', duration: 38 },
]

const col = createDataTableColumnHelper<Deployment>()
const columns = col.columns([
  col.accessor('commit', { header: 'Commit', size: 240, meta: { grow: true } }),
  col.accessor('status', { header: 'Status', size: 120, meta: { filter: { type: 'select' } } }),
  col.accessor('duration', { header: 'Duration', size: 104, cell: (ctx) => \`\${ctx.getValue()}s\`, meta: { numeric: true } }),
])

export function Demo() {
  const table = useDataTable({ data: rows, columns, getRowId: (d) => d.id })
  return (
    <YoujProvider sound={beacon}>
      <main style={{ padding: 24, display: 'grid', gap: 24 }}>
        <Dialog>
          <DialogTrigger render={<Button />}>
            <BellIcon /> Open dialog
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Smoke test</DialogTitle>
              <DialogDescription>Rendered from the packed packages.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div>
          <DataTableToolbar>
            <DataTableSearch table={table} placeholder="Search deployments" />
            <DataTableColumnFilter column={table.getColumn('status')!} />
          </DataTableToolbar>
          <Table aria-label="Deployments">
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => (
                    <DataTableColumnHeader key={header.id} header={header} />
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* The app's own palette, beside Youj's. */}
        <div className="flex gap-2">
          <span data-host="red" className="size-4 bg-red-500" />
          <span data-host="white" className="size-4 bg-white" />
        </div>
      </main>
    </YoujProvider>
  )
}
`

// A server component (no "use client") that calls what the docs say a server can call: the style recipes
// (buttonVariants for a link that looks like a button), cn, defineTheme and themeProps, and a plain list from core.
// In the App Router, calling a function exported from a client module here throws at build time, so a recipe that
// slips back into a "use client" file fails `next build` instead of an app.
const SERVER_PAGE = `import { COLOR_MODES, basalt, cn, defineTheme, themeProps } from '@youj/core'
import { alertVariants, badgeVariants, buttonVariants, toggleVariants } from '@youj/react'

const theme = defineTheme({ ...basalt, id: 'smoke-server' })

export default function ServerPage() {
  return (
    <main {...themeProps(theme)}>
      <a href="/" className={buttonVariants({ variant: 'outline' })}>Server button link</a>
      <span className={badgeVariants({ variant: 'success' })}>Server badge</span>
      <div className={alertVariants({ variant: 'info' })}>Server alert</div>
      <span className={toggleVariants({ variant: 'default' })}>Server toggle</span>
      <p className={cn('h-control', 'h-full')}>Merged classes</p>
      <ul>{COLOR_MODES.map((mode) => <li key={mode}>{'mode-' + mode}</li>)}</ul>
    </main>
  )
}
`

const GLOBALS_CSS = `@import 'tailwindcss';\n@import '@youj/react/styles.css';\n`

// The optional peers the demo's entries need: the data table kit's filter menus are
// Command (cmdk). Every other optional peer stays uninstalled, which proves the
// main entry resolves without them.
const OPTIONAL_USED = ['cmdk']

// Peer dependencies the packed packages require, plus OPTIONAL_USED, so the
// apps install what the packages declare rather than a list kept here.
function requiredPeers(tarballs) {
  const peers = {}
  for (const tarball of tarballs) {
    const manifest = JSON.parse(execFileSync('tar', ['-xzOf', tarball, 'package/package.json'], { encoding: 'utf8' }))
    for (const [name, range] of Object.entries(manifest.peerDependencies ?? {})) {
      const optional = manifest.peerDependenciesMeta?.[name]?.optional && !OPTIONAL_USED.includes(name)
      // The Youj packages come from the tarballs; each app installs Tailwind its own way (Next's PostCSS plugin, Vite's).
      if (optional || name.startsWith('@youj/') || name === 'tailwindcss') continue
      peers[name] = range
    }
  }
  if (options.motion) peers.motion = options.motion
  if (options['base-ui']) peers['@base-ui/react'] = options['base-ui']
  return peers
}

function write(dir, files) {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), typeof content === 'string' ? content : JSON.stringify(content, null, 2) + '\n')
  }
}

const TSCONFIG = {
  compilerOptions: {
    target: 'ES2022',
    lib: ['dom', 'dom.iterable', 'ES2022'],
    module: 'esnext',
    moduleResolution: 'bundler',
    jsx: 'react-jsx',
    strict: true,
    skipLibCheck: true,
    noEmit: true,
    isolatedModules: true,
    esModuleInterop: true,
    resolveJsonModule: true,
  },
}

function nextApp(dir, deps) {
  write(dir, {
    'package.json': {
      name: 'youj-smoke-next',
      private: true,
      scripts: { build: 'next build', start: 'next start' },
      dependencies: { ...deps, next: 'latest', tailwindcss: '^4', '@tailwindcss/postcss': '^4' },
      devDependencies: { typescript: '^5', '@types/react': '^19', '@types/react-dom': '^19', '@types/node': '*' },
    },
    // Next rewrites tsconfig.json on build to add its plugin and includes.
    'tsconfig.json': { ...TSCONFIG, compilerOptions: { ...TSCONFIG.compilerOptions, jsx: 'preserve', allowJs: true, incremental: true, plugins: [{ name: 'next' }] }, include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'] },
    'postcss.config.mjs': `export default { plugins: { '@tailwindcss/postcss': {} } }\n`,
    'app/globals.css': GLOBALS_CSS,
    'app/layout.tsx': `import './globals.css'\nimport type { ReactNode } from 'react'\n\nexport const metadata = { title: 'youj smoke' }\n\nexport default function RootLayout({ children }: { children: ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  )\n}\n`,
    'app/demo.tsx': `'use client'\n${DEMO}`,
    // The page is a server component rendering the client demo, the common
    // App Router shape: it proves the packages' "use client" boundaries hold.
    'app/page.tsx': `import { Demo } from './demo'\n\nexport default function Page() {\n  return <Demo />\n}\n`,
    'app/server/page.tsx': SERVER_PAGE,
  })
}

function viteApp(dir, deps) {
  write(dir, {
    'package.json': {
      name: 'youj-smoke-vite',
      private: true,
      type: 'module',
      scripts: { build: 'tsc && vite build' },
      dependencies: deps,
      devDependencies: {
        vite: 'latest',
        '@vitejs/plugin-react': 'latest',
        tailwindcss: '^4',
        '@tailwindcss/vite': '^4',
        typescript: '^5',
        '@types/react': '^19',
        '@types/react-dom': '^19',
      },
    },
    // tsc checks the app against the published .d.ts files, which vite build skips.
    'tsconfig.json': { ...TSCONFIG, compilerOptions: { ...TSCONFIG.compilerOptions, types: ['vite/client'] }, include: ['src'] },
    'vite.config.ts': `import react from '@vitejs/plugin-react'\nimport tailwindcss from '@tailwindcss/vite'\nimport { defineConfig } from 'vite'\n\nexport default defineConfig({ plugins: [react(), tailwindcss()] })\n`,
    'index.html': `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <title>youj smoke</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`,
    'src/index.css': GLOBALS_CSS,
    'src/demo.tsx': DEMO,
    // Under skipLibCheck, as every app's tsconfig has it, a miniature handle's own keys still type.
    'src/miniature-keys.ts': `import type { MiniatureServerCabinetHandle } from '@youj/miniatures/server-cabinet'\n\nexport const fail = (cabinet: MiniatureServerCabinetHandle) => cabinet.press('f')\n`,
    'src/main.tsx': `import { StrictMode } from 'react'\nimport { createRoot } from 'react-dom/client'\nimport { Demo } from './demo'\nimport './index.css'\n\ncreateRoot(document.getElementById('root')!).render(\n  <StrictMode>\n    <Demo />\n  </StrictMode>,\n)\n`,
  })
}

// ---------- browser checks ----------

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }

// A static server for the Vite build, so the check needs no extra process.
function serveStatic(dir) {
  const server = createServer((req, res) => {
    const path = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname))
    const file = existsSync(path) && statSync(path).isFile() ? path : join(dir, 'index.html')
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
  })
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}/` })))
}

// Starts `next start` on a free port and resolves once it answers.
async function startNext(dir) {
  const probe = createServer().listen(0)
  await new Promise((r) => probe.once('listening', r))
  const port = probe.address().port
  probe.close()
  const child = spawn('npx', ['next', 'start', '-p', String(port)], { cwd: dir, stdio: 'ignore', env: process.env })
  const url = `http://127.0.0.1:${port}/`
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) return { child, url }
    } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
  child.kill()
  throw new Error('next start never answered')
}

// Loads the page, then opens and closes the dialog: the first interaction runs
// the provider, the portal and the motion presets, where runtime errors hide.
async function checkPage(browser, url) {
  const page = await browser.newPage()
  const problems = []
  page.on('console', (msg) => msg.type() === 'error' && problems.push(`console: ${msg.text()}`))
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
  await page.goto(url, { waitUntil: 'networkidle' })
  const trigger = page.getByRole('button', { name: 'Open dialog' })
  await trigger.waitFor({ timeout: 10_000 })
  await page.getByRole('cell', { name: 'Add saved views' }).waitFor({ timeout: 10_000 })
  // The app's own palette paints: Youj's stylesheet adds its colors beside Tailwind's, never in place of them.
  const host = await page.$$eval('[data-host]', (els) => els.map((el) => [el.getAttribute('data-host'), getComputedStyle(el).backgroundColor]))
  for (const [name, color] of host) if (/rgba\(0, 0, 0, 0\)|transparent/.test(color)) problems.push(`bg of the app's ${name} swatch is ${color}: the palette was removed`)
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Smoke test' })
  await dialog.waitFor({ timeout: 5_000 })
  await dialog.getByRole('button', { name: 'Close' }).first().click()
  await dialog.waitFor({ state: 'detached', timeout: 5_000 })
  await page.close()
  if (problems.length) throw new Error(problems.join('\n'))
}

// ---------- main ----------

const tarballDir = join(work, 'tarballs')
const nextDir = join(work, 'next-app')
const viteDir = join(work, 'vite-app')
const env = { NEXT_TELEMETRY_DISABLED: '1', CI: '1' }
let deps

console.log(`youj consumer smoke test in ${work}\n`)

await step(`pack ${PACKAGES.map((p) => `packages/${p}`).join(', ')}`, async () => {
  mkdirSync(tarballDir)
  for (const dir of PACKAGES) {
    // pnpm pack runs prepack (tsdown), applies publishConfig and turns
    // workspace: ranges into versions, the same path release.mjs publishes.
    const { code, output } = await run('pnpm', ['pack', '--pack-destination', tarballDir], join(root, 'packages', dir))
    if (code !== 0) throw new Error(`pnpm pack in packages/${dir} failed:\n${output.split('\n').slice(-30).join('\n')}`)
  }
  const tarballs = readdirSync(tarballDir).filter((f) => f.endsWith('.tgz')).map((f) => join(tarballDir, f))
  deps = requiredPeers(tarballs)
  for (const tarball of tarballs) {
    const name = JSON.parse(execFileSync('tar', ['-xzOf', tarball, 'package/package.json'], { encoding: 'utf8' })).name
    deps[name] = `file:${tarball}`
  }
  return `(${tarballs.length} tarballs; peers: ${Object.keys(deps).filter((d) => !d.startsWith('@youj/')).join(', ')})`
})

if (!failed) {
  nextApp(nextDir, deps)
  viteApp(viteDir, deps)

  // Both installs at once: they're independent and mostly network-bound. The
  // @youj packages resolve to the tarballs (react's ^0.1.0 range on
  // motion is satisfied by the motion tarball at the root), never the registry.
  await Promise.all(
    [nextDir, viteDir].map((dir) =>
      step(`npm install (${dir.endsWith('next-app') ? 'next' : 'vite'})`, async () => {
        const { code, output } = await run('npm', ['install', '--no-audit', '--no-fund'], dir)
        if (code !== 0) throw new Error(output.split('\n').slice(-30).join('\n'))
      }),
    ),
  )
}

// @youj/core holds YoujProvider's contexts and is a peer of the other packages,
// so each app must resolve exactly one copy of it: a second, nested one would
// silently cut components off from the provider.
if (!failed) {
  for (const dir of [nextDir, viteDir])
    await step(`one copy of @youj/core (${dir.endsWith('next-app') ? 'next' : 'vite'})`, async () => {
      const { output } = await run('npm', ['ls', '@youj/core', '--all', '--parseable'], dir)
      const copies = new Set(output.split('\n').filter((line) => line.endsWith(join('node_modules', '@youj', 'core'))))
      if (copies.size !== 1) throw new Error(`found ${copies.size} copies of @youj/core:\n${[...copies].join('\n')}\n--- npm ls ---\n${output}`)
      // The peer ranges let npm pick the newest versions they allow, so the note says which this run proved.
      const installed = (name) => JSON.parse(readFileSync(join(dir, 'node_modules', name, 'package.json'), 'utf8')).version
      return `(motion ${installed('motion')}, @base-ui/react ${installed('@base-ui/react')})`
    })
}

if (!failed) {
  await step('next build', async () => {
    const output = await build('npm', ['run', 'build'], nextDir, env)
    // "○ /" in the route table and the prerendered HTML both mean the page
    // rendered on the server with the packages, not just compiled.
    const html = join(nextDir, '.next/server/app/index.html')
    if (!existsSync(html)) throw new Error(`no prerendered ${html}\n${output.split('\n').slice(-30).join('\n')}`)
    const prerendered = readFileSync(html, 'utf8')
    if (!prerendered.includes('Open dialog') || !prerendered.includes('Add saved views')) throw new Error('the prerendered page is missing the button or the table rows')
  })
  await step('next server component calls the style recipes, cn, defineTheme and themeProps', () => {
    const html = join(nextDir, '.next/server/app/server.html')
    if (!existsSync(html)) throw new Error(`no prerendered ${html}: the server page didn't build`)
    const page = readFileSync(html, 'utf8')
    for (const text of ['Server button link', 'Server badge', 'Server alert', 'Server toggle', 'data-yj-theme="smoke-server"', 'mode-system', 'mode-light', 'mode-dark'])
      if (!page.includes(text)) throw new Error(`the server page is missing ${text}`)
    // cn resolved the Tailwind conflict with Youj's own utilities: h-full won over h-control.
    if (!page.includes('class="h-full"')) throw new Error('cn kept h-control beside h-full: core\'s cn doesn\'t know the Youj utilities')
  })
  await step('next CSS has the component classes and tokens', () => assertCss(join(nextDir, '.next/static')))

  await step('vite build (tsc + vite build)', async () => {
    await build('npm', ['run', 'build'], viteDir, env)
  })
  await step('vite CSS has the component classes and tokens', () => assertCss(join(viteDir, 'dist')))
}

if (!failed && !options['no-browser']) {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  try {
    await step('vite app renders in Chromium without errors', async () => {
      const { server, url } = await serveStatic(join(viteDir, 'dist'))
      try {
        await checkPage(browser, url)
      } finally {
        server.close()
      }
    })
    await step('next start renders in Chromium without errors', async () => {
      const { child, url } = await startNext(nextDir)
      try {
        await checkPage(browser, url)
      } finally {
        child.kill()
      }
    })
  } finally {
    await browser.close()
  }
}

console.log(`\n${failed ? 'FAIL' : 'PASS'}: ${results.filter((r) => r.ok).length}/${results.length} checks passed`)
for (const r of results) console.log(`  ${r.ok ? '✓' : '✗'} ${r.name} (${r.seconds}s)`)
if (options.keep) console.log(`\nkept ${work} (build logs are in each app folder)`)
else rmSync(work, { recursive: true, force: true })
process.exit(failed ? 1 : 0)
