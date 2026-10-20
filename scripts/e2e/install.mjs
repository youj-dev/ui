// End-to-end install test: what a new user meets on launch day, for everything the docs offer.
//
// Packs every package and serves the tarballs from a local npm registry (everything else comes from
// npmjs through it), builds the docs' item registry for a local origin into its own folder (the site's
// public/r is left alone, so this is safe to run beside a docs server) and serves it, then:
//   next      a fresh create-next-app: `npx @youj/cli init`, the other packages, `npx @youj/cli add sound`,
//             the Lottie player and its samples, every block and the illustration kit with `npx @youj/cli add`
//             (then `npm run lint`, create-next-app's ESLint over what was copied),
//             then every docs example, block, illustration builder template (its Copy code), icon,
//             illustration, loader, miniature and sound pack on pages of the app: `next build`,
//             each page in Chromium, and each example and block prerendered on a static page of its own
//   vite      the same in a fresh create-vite app (pnpm), built with `tsc -b && vite build`
//   create    a fresh create-next-app set up by `npx @youj/cli create '<link>'`, built
//   registry  a fresh create-vite app on source (`init --mode registry`), every item added, built
// and runs `youj doctor` and the CLI's errors for an unknown item and an unreachable registry.
//
//   pnpm e2e:install                      every app (about an hour; needs the network)
//   pnpm e2e:install --apps next,create   some of them
//   pnpm e2e:install --keep               keep the apps (the folder is printed)
//   pnpm e2e:install --no-browser         build only
//
// Exits 1 on a failure that isn't in KNOWN below, each of which names the reason it's accepted.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { extname, join } from 'node:path'
import { parseArgs, stripVTControlCharacters } from 'node:util'
import { checkPages, loadPage } from './browser.mjs'
import { startRegistry } from './npm-registry.mjs'
import { addedBlocks, builderItems, writePages, writeStaticPages } from './pages.mjs'

const root = join(import.meta.dirname, '../..')
const { values: options } = parseArgs({
  options: { apps: { type: 'string', default: 'next,vite,create,registry' }, keep: { type: 'boolean', default: false }, 'no-browser': { type: 'boolean', default: false } },
})
const apps = new Set(options.apps.split(','))

/** What fails today for a reason that's written up rather than fixed; anything else fails the run. */
const KNOWN = {
  // logo-sting.lottie is binary, so lottie-samples can't carry it (the Lottie page says so).
  request: [/\/samples\/logo-sting\.lottie/],
  // Under create-next-app's cacheComponents, a Client Component that reads the clock while prerendering stops
  // `next build`; the server rendering guide says to wrap those in Suspense (`youj create` does).
  prerender: /unstable value `(new Date\(\)|Date\.now\(\))`/,
  // From source, components typed by the open YoujLabels stub (registry/stubs/labels-types.ts) don't typecheck.
  registryTypes: /\(\.\.\.args: any\[\]\) => string|This expression is not callable|Expected \d+ arguments, but got \d+|is not assignable to type 'YoujLabels'/,
}
const PACKAGES = ['core', 'motion', 'loaders', 'sound', 'icons', 'illustrations', 'miniatures', 'ui', 'cli', 'mcp']
const CREATE_LINK = 'https://www.youj.dev/create?sidebar=rail-panel&screens=analytics-overview,billing'

const work = mkdtempSync(join(tmpdir(), 'youj-e2e-'))
const logs = join(work, 'logs')
mkdirSync(logs)
const report = []
let failed = false
const say = (line) => console.log(line)

// ---------- helpers ----------

function run(cmd, args, cwd, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('close', (code) => resolve({ code, output: stripVTControlCharacters(output) }))
    child.on('error', (error) => resolve({ code: -1, output: `${output}\n${error.message}` }))
  })
}

/** Runs one check: `fn` returns a note, or { known } for an accepted failure, or throws. */
async function step(app, name, fn) {
  const start = Date.now()
  try {
    const result = (await fn()) ?? {}
    const known = typeof result === 'object' ? result.known : undefined
    const note = typeof result === 'string' ? result : result.note
    report.push({ app, name, status: known ? 'known' : 'ok', note: known ?? note })
    say(`• ${app} · ${name}: ${known ? 'known' : 'ok'} (${((Date.now() - start) / 1000).toFixed(0)}s)${note ? ` ${note}` : ''}${known ? `\n    ${known}` : ''}`)
    return true
  } catch (error) {
    failed = true
    report.push({ app, name, status: 'FAILED', note: String(error.message ?? error).split('\n')[0] })
    say(`• ${app} · ${name}: FAILED\n${String(error.message ?? error).split('\n').slice(0, 30).map((l) => `    ${l}`).join('\n')}`)
    return false
  }
}

async function must(cmd, args, cwd, env, log) {
  const { code, output } = await run(cmd, args, cwd, env)
  if (log) writeFileSync(join(logs, log), output)
  if (code !== 0) throw new Error(`${cmd} ${args.join(' ')} exited ${code}\n${output.split('\n').slice(-25).join('\n')}`)
  return output
}

const MIME = { '.json': 'application/json', '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }
// 127.0.0.1, not localhost: under the CLI's parallel fetches, trying ::1 first made some of them fail.
// `overlay` serves one folder from elsewhere: /r from the registry this run built.
function serve(dir, overlay = {}) {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const [prefix, from] = Object.entries(overlay).find(([p]) => path.startsWith(`${p}/`)) ?? ['', dir]
    const file = join(from, path.slice(prefix.length))
    if (!file.startsWith(from) || !existsSync(file) || !statSync(file).isFile()) return void res.writeHead(404).end()
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file))
  })
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` })))
}

async function freePort() {
  const probe = createServer().listen(0)
  await new Promise((r) => probe.once('listening', r))
  const { port } = probe.address()
  probe.close()
  return port
}

/** Starts a server command and resolves once `url` answers. */
async function startServer(cmd, args, cwd, url, env) {
  const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: 'ignore', detached: true })
  for (let i = 0; i < 120; i++) {
    try {
      await fetch(url)
      return child
    } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`${cmd} ${args.join(' ')} never answered on ${url}`)
}
const stop = (child) => child && process.kill(-child.pid)

const chunk = (list, n) => Array.from({ length: Math.ceil(list.length / n) }, (_, i) => list.slice(i * n, i * n + n))

// ---------- setup ----------

say(`youj install test in ${work}\n`)
const version = JSON.parse(readFileSync(join(root, 'packages/core/package.json'), 'utf8')).version
const tarballs = join(work, 'tarballs')
mkdirSync(tarballs)
await step('setup', `pack ${PACKAGES.join(', ')}`, async () => {
  for (const dir of PACKAGES) await must('pnpm', ['pack', '--pack-destination', tarballs], join(root, 'packages', dir))
})
const npm = await startRegistry(readdirSync(tarballs).map((f) => join(tarballs, f)))
const localRegistry = join(work, 'r')
const docsServer = await serve(join(root, 'apps/docs/public'), { '/r': localRegistry })
const itemRegistry = `${docsServer.origin}/r/v${version}`
await step('setup', 'build the docs registry for a local origin', () =>
  must('node', ['apps/docs/scripts/registry.ts', '--out', localRegistry], root, { NEXT_PUBLIC_SITE_URL: docsServer.origin }, 'registry.log'),
)
const registryItems = JSON.parse(readFileSync(join(localRegistry, 'registry.json'), 'utf8')).items
const blockNames = registryItems.filter((i) => i.type === 'registry:block').map((i) => i.name)

// Caches of its own, so npx and pnpm dlx run this run's CLI, never one cached from another build of the same version.
const env = {
  npm_config_registry: npm.url,
  npm_config_cache: join(work, 'npm-cache'),
  YOUJ_NPM_REGISTRY: npm.url,
  YOUJ_REGISTRY_URL: itemRegistry,
  NEXT_TELEMETRY_DISABLED: '1',
}
const youj = (pm) => (pm === 'npm' ? ['npx', ['-y', '@youj/cli']] : ['pnpm', ['dlx', '@youj/cli']])
const cli = (pm, args, cwd, log) => must(youj(pm)[0], [...youj(pm)[1], ...args], cwd, pm === 'npm' ? env : { ...env, npm_config_cache_dir: join(work, 'pnpm-cache') }, log)

// ---------- the package apps ----------

async function packageApp(kind) {
  const dir = join(work, `${kind}-app`)
  const pm = kind === 'next' ? 'npm' : 'pnpm'
  const ok = await step(kind, 'scaffold, then npx @youj/cli init', async () => {
    if (kind === 'next') await must('npx', ['-y', 'create-next-app@latest', dir, '--ts', '--tailwind', '--app', '--eslint', '--no-src-dir', '--import-alias', '@/*', '--use-npm', '--yes'], work, env, `${kind}-scaffold.log`)
    else {
      await must('npm', ['create', '-y', 'vite@latest', `${kind}-app`, '--', '--template', 'react-ts', '--no-interactive'], work, env, `${kind}-scaffold.log`)
      await must('pnpm', ['install'], dir, env)
    }
    await cli(pm, ['init', '--yes'], dir, `${kind}-init.log`)
    if (kind !== 'next') return
    // What init leaves of create-next-app's starter: Youj's theme, the early theme script, the layout's own classes.
    const css = readFileSync(join(dir, 'app/globals.css'), 'utf8')
    const layout = readFileSync(join(dir, 'app/layout.tsx'), 'utf8')
    const wrong = [
      css.includes('shadcn.css') && 'globals.css imports the shadcn compat sheet in an app without shadcn',
      /var\(--(background|font-geist-sans)\)/.test(css) && "globals.css keeps create-next-app's starter colours or Geist-only @theme",
      /\sdata-theme=/.test(layout) && 'layout.tsx hard-codes data-theme',
      !layout.includes('<ThemeScript />') && 'layout.tsx has no ThemeScript in <head>',
      !layout.includes('h-full antialiased') && "layout.tsx lost create-next-app's classes",
    ].filter(Boolean)
    if (wrong.length) throw new Error(wrong.join('\n'))
  })
  if (!ok) return
  const install = (names) => (pm === 'npm' ? must('npm', ['install', ...names], dir, env) : must('pnpm', ['add', ...names], dir, env))
  await step(kind, 'the other packages, sound, the Lottie player and its samples', async () => {
    // As the docs install them; lucide-react is what a few examples import beside the kit.
    await install(['@youj/loaders', '@youj/illustrations', '@youj/miniatures', 'lucide-react'])
    await cli(pm, ['add', 'sound'], dir, `${kind}-sound.log`)
    await cli(pm, ['add', 'lottie-player', 'lottie-samples'], dir, `${kind}-lottie.log`)
  })
  await step(kind, `npx @youj/cli add every block (${blockNames.length})`, async () => {
    for (const [i, batch] of chunk(blockNames, 25).entries()) await cli(pm, ['add', '--yes', ...batch], dir, `${kind}-blocks-${i}.log`)
    const added = addedBlocks(dir, blockNames)
    if (added.length !== blockNames.length) throw new Error(`youj.json lists ${added.length} of ${blockNames.length} blocks`)
  })
  // The illustration builder's Copy code says to add these, then draws with them from where they're copied.
  await step(kind, `npx @youj/cli add ${builderItems.join(' ')}`, () => cli(pm, ['add', '--yes', ...builderItems], dir, `${kind}-kit.log`))
  // What add copied, under the app's own ESLint config (React Compiler's rules among them), before the test pages go in.
  if (kind === 'next') await step(kind, 'npm run lint, no warnings', async () => void (await must('npm', ['run', 'lint', '--', '--max-warnings', '0'], dir, env, `${kind}-lint.log`)))
  const blocks = addedBlocks(dir, blockNames)
  const groups = writePages({ appDir: dir, kind, blocks })
  const built = await step(kind, kind === 'next' ? 'next build' : 'tsc -b && vite build', async () => void (await must(pm, ['run', 'build'], dir, env, `${kind}-build.log`)))
  await step(kind, 'youj doctor', async () => {
    const out = (await run(youj(pm)[0], [...youj(pm)[1], 'doctor'], dir, env)).output
    writeFileSync(join(logs, `${kind}-doctor.log`), out)
    const errors = out.split('\n').filter((l) => l.startsWith('■'))
    if (errors.length) throw new Error(errors.join('\n'))
  })
  if (!built || options['no-browser']) return
  const port = await freePort()
  const server = await startServer(...(kind === 'next' ? ['npx', ['next', 'start', '-p', String(port)]] : ['npx', ['vite', 'preview', '--port', String(port), '--strictPort']]), dir, `http://localhost:${port}/`, env)
  try {
    const results = await checkPages(`http://localhost:${port}`, groups, (line) => writeFileSync(join(logs, `${kind}-browser.log`), `${line}\n`, { flag: 'a' }))
    writeFileSync(join(work, `${kind}-browser.json`), JSON.stringify(results, null, 1))
    for (const [group, r] of Object.entries(results)) {
      const knownRequest = (text) => KNOWN.request.some((re) => re.test(text))
      // A 404 logs a console error too; the per-item pass says whether that's all an item logged.
      const items = Object.entries(r.perItem ?? {}).filter(([, v]) => Object.keys(v.threw).length || v.errors.some((e) => !/Failed to load resource/.test(e) && !knownRequest(e)) || v.errors.some((e) => /^\d{3} /.test(e) && !knownRequest(e)))
      const failedRequests = r.failed.filter((f) => !knownRequest(f))
      const problems = [
        ...Object.entries(r.threw).map(([id, e]) => `${id} threw: ${e.split('\n')[0]}`),
        ...r.stuck.map((id) => `${id} never finished loading`),
        ...items.map(([id, v]) => `${id}: ${[...v.errors, ...Object.values(v.threw)].join(' | ').slice(0, 300)}`),
        ...(r.perItem ? [] : [...r.console, ...r.pageErrors]),
        ...failedRequests,
      ]
      const knownRequests = r.failed.filter(knownRequest)
      await step(kind, `renders ${group} (${r.rendered}/${r.count})`, () => {
        if (problems.length || r.rendered !== r.count) throw new Error([...new Set(problems)].join('\n') || `${r.count - r.rendered} items didn't render`)
        if (knownRequests.length) return { known: `${new Set(knownRequests).size} demo files the docs site serves aren't in the app (${[...new Set(knownRequests.map((f) => f.split('/').pop()))].slice(0, 3).join(', ')}…)` }
      })
    }
  } finally {
    stop(server)
  }
  if (kind === 'next') {
    writeStaticPages(dir, blocks)
    await step(kind, 'each example and block prerenders on a static page of its own', async () => {
      const { output } = await run('npx', ['next', 'build', '--debug-prerender'], dir, env)
      writeFileSync(join(logs, `${kind}-static.log`), output)
      const reasons = [...output.matchAll(/Error: Route "[^"]+": ([^\n]+)\n[\s\S]*?\n\s+at (\w+) \(([^)]+)\)/g)].map((m) => ({ reason: m[1], where: `${m[2]} (${m[3].replace(/:\d+:\d+$/, '')})` }))
      const paths = [...(output.match(/Export encountered errors on \d+ paths?:\n((?:\s+\/.*\n?)+)/)?.[1] ?? '').matchAll(/: (\/s\/\S+)/g)].map((m) => decodeURIComponent(m[1]))
      if (!paths.length && !/Generating static pages[^\n]*\(\d+\/\d+\)/.test(output)) throw new Error(output.split('\n').slice(-25).join('\n'))
      const other = reasons.filter((r) => !KNOWN.prerender.test(r.reason))
      if (other.length || reasons.length < paths.length) throw new Error([...other.map((r) => `${r.where}: ${r.reason}`), ...(reasons.length < paths.length ? [`${paths.length} pages failed, ${reasons.length} with a reason`] : [])].join('\n'))
      if (paths.length) return { known: `${paths.length} read the clock while prerendering: ${paths.map((p) => p.replace(/^\/s\/(ex|bl)~/, '').replace('~', '/')).join(', ')}` }
      return `(${readdirSync(join(dir, '.next/server/app/s')).filter((f) => f.endsWith('.html')).length} pages)`
    })
  }
}

// ---------- create ----------

async function createApp() {
  const dir = join(work, 'create-app')
  await step('create', `npx @youj/cli create '${CREATE_LINK}'`, async () => {
    await must('npx', ['-y', 'create-next-app@latest', dir, '--ts', '--tailwind', '--app', '--eslint', '--no-src-dir', '--import-alias', '@/*', '--use-npm', '--yes'], work, env, 'create-scaffold.log')
    await cli('npm', ['create', CREATE_LINK], dir, 'create.log')
  })
  await step('create', 'next build', async () => void (await must('npm', ['run', 'build'], dir, env, 'create-build.log')))
}

// ---------- registry (source) ----------

async function registryApp() {
  const dir = join(work, 'registry-app')
  const ok = await step('registry', 'scaffold, npx @youj/cli init --mode registry, build', async () => {
    await must('npm', ['create', '-y', 'vite@latest', 'registry-app', '--', '--template', 'react-ts', '--no-interactive'], work, env, 'registry-scaffold.log')
    await must('pnpm', ['install'], dir, env)
    await cli('pnpm', ['init', '--mode', 'registry', '--yes'], dir, 'registry-init.log')
    await must('pnpm', ['run', 'build'], dir, env, 'registry-init-build.log')
  })
  if (!ok) return
  const names = registryItems.map((i) => i.name).filter((n) => !['youj-core', 'youj-ui-core'].includes(n))
  await step('registry', `npx @youj/cli add every item (${names.length})`, async () => {
    for (const [i, batch] of chunk(names, 40).entries()) await cli('pnpm', ['add', '--yes', ...batch], dir, `registry-add-${i}.log`)
  })
  await step('registry', 'tsc -b', async () => {
    const { code, output } = await run('npx', ['tsc', '-b'], dir, env)
    writeFileSync(join(logs, 'registry-tsc.log'), output)
    if (code === 0) return
    // Each error with the lines that elaborate it, where the union type often is.
    const errors = []
    for (const line of output.split('\n')) {
      if (/error TS/.test(line)) errors.push(line)
      else if (errors.length && /^\s/.test(line)) errors[errors.length - 1] += `\n${line}`
    }
    const other = errors.filter((e) => !KNOWN.registryTypes.test(e))
    if (other.length || !errors.length) throw new Error(other.slice(0, 20).join('\n') || output.slice(-2000))
    const files = new Set(errors.map((l) => l.split('(')[0]))
    return { known: `${errors.length} label-typing errors in ${files.size} files (the open YoujLabels stub)` }
  })
  // Every copied module, loaded at once: one that throws while it loads, or doesn't resolve, fails here.
  writeFileSync(join(dir, 'src/e2e-all.ts'), `const modules = import.meta.glob(['./components/**/*.{ts,tsx}', './blocks/**/*.{ts,tsx}', './hooks/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'], { eager: true })\nconsole.info('modules', Object.keys(modules).length)\n`)
  const main = join(dir, 'src/main.tsx')
  writeFileSync(main, `import './e2e-all'\n${readFileSync(main, 'utf8')}`)
  const built = await step('registry', 'vite build of every copied module', async () => void (await must('npx', ['vite', 'build'], dir, env, 'registry-build.log')))
  if (!built || options['no-browser']) return
  const port = await freePort()
  const server = await startServer('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], dir, `http://localhost:${port}/`, env)
  try {
    await step('registry', 'every copied module loads in Chromium', async () => {
      const problems = await loadPage(`http://localhost:${port}/`)
      if (problems.length) throw new Error(problems.join('\n'))
    })
  } finally {
    stop(server)
  }
}

// ---------- the CLI's own errors ----------

async function cliErrors() {
  const dir = join(work, 'next-app')
  if (!existsSync(dir)) return
  await step('cli', 'add names an unknown item and suggests the near one', async () => {
    const { code, output } = await run('npx', ['-y', '@youj/cli', 'add', 'buton'], dir, env)
    if (code !== 1 || !/buton isn't in the registry.*Did you mean button\?/.test(output)) throw new Error(`exit ${code}\n${output.slice(-600)}`)
  })
  await step('cli', 'add says when the registry is unreachable', async () => {
    const { code, output } = await run('npx', ['-y', '@youj/cli', 'add', 'app-billing'], dir, { ...env, YOUJ_REGISTRY_URL: 'http://localhost:9/r' })
    if (code !== 1 || !/Couldn't reach the registry/.test(output)) throw new Error(`exit ${code}\n${output.slice(-600)}`)
  })
  await step('cli', 'add says when YOUJ_REGISTRY_URL names a folder with no registry', async () => {
    const { code, output } = await run('npx', ['-y', '@youj/cli', 'add', 'app-billing'], dir, { ...env, YOUJ_REGISTRY_URL: `${docsServer.origin}/nope` })
    if (code !== 1 || !/No registry found at .*\/nope\//.test(output)) throw new Error(`exit ${code}\n${output.slice(-600)}`)
  })
  await step('cli', 'mcp --print', async () => {
    const { code, output } = await run('npx', ['-y', '@youj/cli', 'mcp', '--print', '--client', 'cursor'], dir, env)
    if (code !== 0 || !output.includes(`@youj/mcp@${version}`)) throw new Error(output.slice(-600))
  })
}

// ---------- run ----------

try {
  const jobs = []
  if (apps.has('next')) jobs.push(packageApp('next'))
  if (apps.has('vite')) jobs.push(packageApp('vite'))
  await Promise.all(jobs)
  await cliErrors()
  if (apps.has('create')) await createApp()
  if (apps.has('registry')) await registryApp()
} finally {
  npm.close()
  docsServer.server.close()
}

say(`\n${failed ? 'FAIL' : 'PASS'}: ${report.filter((r) => r.status === 'ok').length} ok, ${report.filter((r) => r.status === 'known').length} known, ${report.filter((r) => r.status === 'FAILED').length} failed`)
for (const r of report) say(`  ${r.status === 'ok' ? '✓' : r.status === 'known' ? '~' : '✗'} ${r.app.padEnd(8)} ${r.name}${r.status !== 'ok' && r.note ? `: ${r.note.slice(0, 200)}` : ''}`)
writeFileSync(join(work, 'report.json'), JSON.stringify(report, null, 1))
if (options.keep) say(`\nkept ${work} (logs in logs/, browser results in *-browser.json)`)
else {
  for (const name of readdirSync(work)) if (name.endsWith('-app')) rmSync(join(work, name), { recursive: true, force: true })
  rmSync(join(work, 'npm-cache'), { recursive: true, force: true })
  rmSync(join(work, 'pnpm-cache'), { recursive: true, force: true })
  say(`\nreport and logs in ${work}`)
}
process.exit(failed ? 1 : 0)
