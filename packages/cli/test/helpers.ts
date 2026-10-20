import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, beforeEach, vi } from 'vitest'
import { format, type Command, type Runner } from '../src/run'

const FIXTURES = join(import.meta.dirname, 'fixtures')
const made: string[] = []

// The tests never reach the network: a registry they read is a file:// one of their own,
// or this stand-in for the hosted one (its versioned path and latest alias, and a local build of it), with a stub of every item (blockItem).
beforeEach(() => {
  vi.stubGlobal('fetch', async (url: string) => {
    const name = /^https?:\/\/(?:www\.youj\.dev|localhost:\d+)\/r\/(?:v[\w.-]+\/)?([\w-]+)\.json$/.exec(String(url))?.[1]
    return name ? Response.json(blockItem(name)) : new Response(null, { status: 404 })
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true })
})

/** A fresh copy of a fixture app in a temp folder. */
export function fixture(name: string): string {
  const dir = mkdtempSync(join(tmpdir(), `youj-cli-${name}-`))
  made.push(dir)
  cpSync(join(FIXTURES, name), dir, { recursive: true })
  return dir
}

export function read(root: string, path: string): string {
  return readFileSync(join(root, path), 'utf8')
}

export function write(root: string, path: string, content: string) {
  mkdirSync(dirname(join(root, path)), { recursive: true })
  writeFileSync(join(root, path), content)
}

const PMS = ['pnpm', 'npm', 'yarn', 'bun']

/**
 * A slice of each Youj package, as its build ships it: entry → module → the names
 * the entry exports from it. Modules mirror the app paths `add` copies to; a module
 * with no names is there but not exported (a helper beside a component).
 */
export const FAKE_PACKAGES: Record<string, Record<string, Record<string, string[]>>> = {
  '@youj/react': {
    '.': {
      'components/ui/button': ['Button', 'type ButtonProps'],
      'components/ui/card': ['Card', 'CardHeader'],
      'components/ui/sidebar': ['Sidebar', 'useSidebar'],
      'lib/utils': [],
      'components/ui/button.variants': [],
    },
    './chart': { 'components/ui/chart': ['ChartContainer', 'useChartMotion'] },
  },
  '@youj/core': {
    '.': { 'lib/youj/provider': ['YoujProvider', 'ThemeScope', 'useYouj'], 'lib/youj/use-labels': ['useLabels'], 'lib/youj/cn': ['cn'] },
  },
  '@youj/icons': { '.': { 'components/youj/icons/menu': ['MenuIcon'], 'components/youj/icons/icon-base': ['createIcon', 'type IconProps'] } },
  '@youj/motion': { '.': { 'components/youj/primitives/reveal': ['Reveal'] }, './players': { 'components/youj/players/lottie-player': ['LottiePlayer'] } },
  '@youj/illustrations': {
    '.': {
      'components/youj/graphics/scenes/coffee': ['CoffeeScene'],
      'components/youj/graphics/iso-scene': ['IsoScene', 'useIsoScene'],
      'components/youj/graphics/iso': ['project'],
      'components/youj/graphics/iso-box': ['IsoBox'],
      // In the package's files, not its exports.
      'components/youj/graphics/tones': [],
      'components/youj/graphics/illustrations/kit': [],
    },
  },
  '@youj/sound': { '.': { 'lib/youj/sound/index': ['beacon'] } },
}

/** Installs a fake Youj package in the app's node_modules: an export map and the type files its build would write. */
export function fakePackage(root: string, name: string, version = '0.1.0') {
  const dir = `node_modules/${name}`
  const exports: Record<string, { types: string; default: string }> = {}
  for (const [entry, modules] of Object.entries(FAKE_PACKAGES[name]!)) {
    const file = entry === '.' ? 'index' : entry.slice(2)
    exports[entry] = { types: `./dist/${file}.d.ts`, default: `./dist/${file}.js` }
    const lines: string[] = []
    const names: string[] = []
    for (const [module, list] of Object.entries(modules)) {
      write(root, `${dir}/dist/${module}.d.ts`, list.map((n) => `export declare const ${n.replace(/^type /, '')}: unknown;`).join('\n') + '\n')
      if (!list.length) continue
      lines.push(`import { ${list.map((n) => n.replace(/^type /, '')).join(', ')} } from "${'../'.repeat(file.split('/').length - 1) || './'}${module}.js";`)
      names.push(...list)
    }
    write(root, `${dir}/dist/${file}.d.ts`, `${lines.join('\n')}\nexport { ${names.join(', ')} };\n`)
  }
  write(root, `${dir}/package.json`, JSON.stringify({ name, version, exports }, null, 2))
}

/** The stub `add` copies for a block in these tests:. */
export function blockItem(name: string, files: { target: string; content: string }[] = []) {
  const [, group, block] = name.match(/^(frame|marketing|auth|app|commerce)-([\w-]+)$/) ?? []
  const own = group ? [{ target: `blocks/${group}/${block}.tsx`, content: /marketing|auth/.test(group) ? '<a href="#login" />\nexport {}\n' : 'export {}\n' }] : []
  return { name, type: 'registry:block', files: [...own, ...files].map((f) => ({ path: `src/${f.target}`, type: 'registry:component', ...f })) }
}

/** A registry on disk with these items (a name alone is a block stub), as the env that points `add` at it. */
export function stubRegistry(items: (string | { name: string })[]): NodeJS.ProcessEnv {
  const dir = mkdtempSync(join(tmpdir(), 'youj-registry-'))
  made.push(dir)
  for (const item of items) {
    const json = typeof item === 'string' ? blockItem(item) : item
    writeFileSync(join(dir, `${json.name}.json`), JSON.stringify(json))
  }
  return { YOUJ_REGISTRY_URL: `${pathToFileURL(dir).href}/{name}.json` }
}

/**
 * Stands in for the package manager and shadcn: installs land in package.json
 * (so a re-run sees them), and `shadcn add` copies a stub of the core and of
 * each frame block it adds.
 */
export function fakeRunner(root: string): Runner & { commands: string[] } {
  const commands: string[] = []
  const runner = (async (command: Command) => {
    commands.push(format(command))
    const [verb, ...rest] = command.args
    if (PMS.includes(command.cmd) && (verb === 'add' || verb === 'install')) {
      const dev = rest.includes('-D') || rest.includes('-d')
      const pkg = JSON.parse(read(root, 'package.json'))
      const field = dev ? 'devDependencies' : 'dependencies'
      pkg[field] ??= {}
      for (const spec of rest.filter((a) => !a.startsWith('-'))) {
        const at = spec.lastIndexOf('@')
        const [name, range] = at > 0 ? [spec.slice(0, at), spec.slice(at + 1)] : [spec, '^4.1.0']
        pkg[field][name] = range
        if (name in FAKE_PACKAGES) fakePackage(root, name)
      }
      write(root, 'package.json', JSON.stringify(pkg, null, 2) + '\n')
    }
    if (command.args.some((a) => a.startsWith('shadcn@'))) {
      const base = existsSync(join(root, 'src')) ? 'src/' : ''
      write(root, `${base}styles/youj.css`, '/* tokens */\n')
      write(root, `${base}styles/ui.css`, "/* Load after youj.css:\n *   @import '@youj/core/styles/youj.css';\n */\n")
      write(root, `${base}lib/youj/provider.tsx`, "'use client'\nexport function YoujProvider() {}\n")
      write(root, `${base}lib/youj/theme/index.ts`, 'export {}\n')
      write(root, `${base}lib/youj/theme/themes/basalt.css`, "[data-yj-theme='basalt'] {}\n")
      for (const arg of command.args) {
        const [, group, block] = arg.match(/\b(frame|marketing|auth|app|commerce)-([\w-]+?)(?:\.json)?$/) ?? []
        if (group && block) write(root, `${base}blocks/${group}/${block}.tsx`, /marketing|auth/.test(group) ? '<a href="#login" />\nexport {}\n' : 'export {}\n')
        const icon = arg.match(/\bicon-([\w-]+?)(?:\.json)?$/)?.[1]
        if (icon) write(root, `${base}components/youj/icons/${icon}.tsx`, 'export {}\n')
        const theme = arg.match(/\byouj-theme-([\w-]+?)(?:\.json)?$/)?.[1]
        if (theme) write(root, `${base}lib/youj/theme/themes/${theme}.css`, `[data-yj-theme='${theme}'] {}\n`)
        const style = arg.match(/\byouj-look-([\w-]+?)(?:\.json)?$/)?.[1]
        if (style) write(root, `${base}styles/${style}.css`, `@layer utilities {}\n`)
        if (/\byouj-shadcn-compat(?:\.json)?$/.test(arg)) write(root, `${base}styles/shadcn.css`, '/* shadcn names on roles */\n')
      }
    }
  }) as unknown as Runner & { commands: string[] }
  runner.commands = commands
  return runner
}
