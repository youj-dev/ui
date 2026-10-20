// After the launch (scripts/ship.sh --launch): checks that production is public, as a visitor and the CLI see it.
// Read-only: it only sends GET requests, and the CLI runs with --dry-run in a temp folder it deletes.
//
//   pnpm launch:verify                         www.youj.dev, with `npx youj@<this version> add button --dry-run`
//   pnpm launch:verify --origin <url>          another origin (a local `cf:dev`); the CLI reads that origin's registry
//   pnpm launch:verify --cli <path to cli.mjs> run a local build of the CLI instead of the published one
//   pnpm launch:verify --no-cli                the HTTP checks only
//
// Checks: / is a 200 with no redirect and no noindex; /r/button.json and /r/v<version>/button.json are the item;
// /robots.txt allows everything and names the sitemap; /sitemap.xml is a 200; /stealth is a 404; /launch.json has
// no launch moment left (LAUNCH_AT deleted). Exits 1 if any fails.
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

const root = join(import.meta.dirname, '..')
const PRODUCTION = 'https://www.youj.dev'
const { values: options } = parseArgs({
  options: { origin: { type: 'string', default: PRODUCTION }, cli: { type: 'string' }, 'no-cli': { type: 'boolean', default: false } },
})
const origin = options.origin.replace(/\/+$/, '')
const { version } = JSON.parse(readFileSync(join(root, 'packages/cli/package.json'), 'utf8'))

const failures = []
const check = (ok, what, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${what}${!ok && detail ? `: ${detail}` : ''}`)
  if (!ok) failures.push(what)
}
const get = (path) => fetch(`${origin}${path}`, { redirect: 'manual', headers: { 'user-agent': 'youj-launch-verify' } })

const home = await get('/')
check(home.status === 200, '/ answers 200 without a redirect', `${home.status} ${home.headers.get('location') ?? ''}`)
check(!/noindex/i.test(home.headers.get('x-robots-tag') ?? ''), '/ is indexable (no X-Robots-Tag noindex)', home.headers.get('x-robots-tag'))

for (const path of ['/r/button.json', `/r/v${version}/button.json`]) {
  const response = await get(path)
  const item = response.status === 200 ? await response.json().catch(() => null) : null
  check(item?.name === 'button', `${path} is the registry item`, `${response.status}`)
}

const robots = await get('/robots.txt')
const robotsText = robots.status === 200 ? await robots.text() : ''
check(/^Allow: \/$/m.test(robotsText) && !/^Disallow: \/$/m.test(robotsText), '/robots.txt allows everything', `${robots.status} ${JSON.stringify(robotsText)}`)
check(robotsText.includes(`Sitemap: ${PRODUCTION}/sitemap.xml`), '/robots.txt names the sitemap')

check((await get('/sitemap.xml')).status === 200, '/sitemap.xml answers 200')
const stealth = await get('/stealth')
check(stealth.status === 404, '/stealth is a 404', `${stealth.status}`)
const launch = await get('/launch.json')
const launchAt = launch.status === 200 ? (await launch.json().catch(() => ({}))).launchAt : undefined
check(launchAt === null, '/launch.json has no launch moment (LAUNCH_AT deleted from the Worker)', `${launch.status} ${launchAt}`)

if (!options['no-cli']) {
  // A bare Vite app on the registry, as `init --mode registry` leaves it; nothing is installed, the dry run only fetches.
  const dir = mkdtempSync(join(tmpdir(), 'youj-launch-'))
  try {
    const registry = `${origin}/r/v${version}/{name}.json`
    mkdirSync(join(dir, 'src'))
    const files = {
      'package.json': { name: 'launch-check', private: true, type: 'module', dependencies: { react: '^19', 'react-dom': '^19' }, devDependencies: { vite: '^7', tailwindcss: '^4', '@tailwindcss/vite': '^4' } },
      'tsconfig.json': { compilerOptions: { baseUrl: '.', paths: { '@/*': ['./src/*'] } } },
      'components.json': {
        $schema: 'https://ui.shadcn.com/schema.json',
        style: 'base-nova',
        rsc: false,
        tsx: true,
        tailwind: { config: '', css: 'src/index.css', baseColor: 'neutral', cssVariables: true, prefix: '' },
        iconLibrary: 'lucide',
        aliases: { components: '@/components', utils: '@/lib/utils', ui: '@/components/ui', lib: '@/lib', hooks: '@/hooks' },
        registries: { '@youj': registry },
      },
    }
    for (const [name, json] of Object.entries(files)) writeFileSync(join(dir, name), JSON.stringify(json, null, 2) + '\n')
    writeFileSync(join(dir, 'vite.config.ts'), "import { defineConfig } from 'vite'\nexport default defineConfig({})\n")
    writeFileSync(join(dir, 'src/index.css'), "@import 'tailwindcss';\n")
    const [cmd, args] = options.cli ? [process.execPath, [resolve(options.cli)]] : ['npx', ['-y', `youj@${version}`]]
    const env = { ...process.env, ...(origin === PRODUCTION ? {} : { YOUJ_REGISTRY_URL: registry }) }
    const label = `${options.cli ? 'youj (local)' : `npx youj@${version}`} add button --dry-run`
    const run = spawnSync(cmd, [...args, 'add', 'button', '--dry-run'], { cwd: dir, env, encoding: 'utf8', timeout: 300_000 })
    const output = `${run.stdout}${run.stderr}`
    check(run.status === 0 && /components\/ui\/button\.tsx/.test(output), label, `exit ${run.status}\n${output.trim()}`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

console.log(failures.length ? `launch:verify: ${failures.length} failed (${origin})` : `launch:verify: ${origin} is public`)
process.exit(failures.length ? 1 : 0)
