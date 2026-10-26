import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { posix } from 'node:path'
import type { Project } from './project'
import { majorOf, unsupportedReact, TAILWIND_IMPORT } from './versions'

export { majorOf, unsupportedReact, TAILWIND_IMPORT }

export type Framework = 'next-app' | 'next-pages' | 'vite' | 'react-router' | 'astro'
export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun'

export const FRAMEWORK_NAMES: Record<Framework, string> = {
  'next-app': 'Next.js (App Router)',
  'next-pages': 'Next.js (Pages Router)',
  vite: 'Vite + React',
  'react-router': 'React Router v7',
  astro: 'Astro + React',
}

export interface PackageJson {
  name?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  packageManager?: string
  workspaces?: string[] | { packages?: string[] }
}

export function allDeps(pkg: PackageJson | null): Record<string, string> {
  return { ...pkg?.dependencies, ...pkg?.devDependencies }
}

/** The installed version of a package, read from node_modules (walking up for hoisted workspaces). */
export function installedVersion(root: string, name: string): string | null {
  let dir = resolve(root)
  for (;;) {
    const file = join(dir, 'node_modules', name, 'package.json')
    if (existsSync(file)) {
      try {
        return (JSON.parse(readFileSync(file, 'utf8')) as { version?: string }).version ?? null
      } catch {
        return null
      }
    }
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

/** The major version in use: the installed one, else the declared range. */
export function versionMajor(project: Project, name: string): number | null {
  return majorOf(installedVersion(project.root, name) ?? undefined) ?? majorOf(allDeps(project.json<PackageJson>('package.json'))[name])
}

/** The installed version of a package, else its range in package.json. */
export function versionOrRange(project: Project, name: string): string | null {
  return installedVersion(project.root, name) ?? allDeps(project.json<PackageJson>('package.json'))[name] ?? null
}

export function detectFramework(project: Project): Framework | null {
  const deps = allDeps(project.json<PackageJson>('package.json'))
  if (deps.astro) return 'astro'
  if (deps['@react-router/dev']) return 'react-router'
  if (deps.next) {
    const layout = ['app', 'src/app'].some((dir) => ['tsx', 'jsx', 'js', 'ts'].some((ext) => project.exists(`${dir}/layout.${ext}`)))
    return layout ? 'next-app' : 'next-pages'
  }
  if (deps.vite && deps.react) return 'vite'
  return null
}

/**
 * The apps of a workspace when this folder is its root (pnpm-workspace.yaml, or "workspaces" in package.json): the packages
 * that use React in its `dir/*` entries, relative to the root. Null for a folder that isn't a workspace root.
 */
export function workspaceApps(project: Project): string[] | null {
  const field = project.json<PackageJson>('package.json')?.workspaces
  const pnpm = project.read('pnpm-workspace.yaml')
  if (!pnpm && !field) return null
  const listed = [...(pnpm ?? '').matchAll(/^[ \t]*-[ \t]*['"]?([^'"#\n]+?)['"]?[ \t]*(?:#.*)?$/gm)].map((m) => m[1]!)
  const globs = [...listed, ...(Array.isArray(field) ? field : (field?.packages ?? []))]
  const folders = (dir: string) => {
    try {
      return readdirSync(project.abs(dir), { withFileTypes: true }).filter((e) => e.isDirectory() && e.name !== 'node_modules' && !e.name.startsWith('.')).map((e) => `${dir}/${e.name}`)
    } catch {
      return []
    }
  }
  return globs
    .filter((glob) => !glob.startsWith('!') && /[/*]/.test(glob))
    .flatMap((glob) => (/\/\*+$/.test(glob) ? folders(glob.replace(/\/\*+$/, '')) : [glob.replace(/^\.\//, '')]))
    .filter((dir) => allDeps(project.json<PackageJson>(`${dir}/package.json`)).react)
    .sort()
}

/** What to say when a command that sets up an app is run at the root of a workspace: run it on an app, with --cwd. Null for any other folder. */
export function workspaceRootMessage(project: Project, command: string): string | null {
  const apps = workspaceApps(project)
  if (!apps) return null
  return `${project.root} is the root of a workspace, not an app. Run this on an app with --cwd: npx @youj/cli ${command} --cwd ${apps[0] ?? 'apps/web'}${apps.length > 1 ? ` (the apps here: ${apps.join(', ')})` : ''}`
}

const LOCKFILES: [string, PackageManager][] = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['yarn.lock', 'yarn'],
  ['package-lock.json', 'npm'],
]

/** From the lockfile (here or in a parent workspace), then the packageManager field, then who ran us. */
export function detectPackageManager(root: string, env: NodeJS.ProcessEnv = process.env): PackageManager {
  let dir = resolve(root)
  for (;;) {
    for (const [file, pm] of LOCKFILES) if (existsSync(join(dir, file))) return pm
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  try {
    const field = (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as PackageJson).packageManager
    const named = field?.split('@')[0]
    if (named === 'pnpm' || named === 'yarn' || named === 'bun' || named === 'npm') return named
  } catch {
    // no package.json: detectFramework reports it
  }
  const agent = env.npm_config_user_agent ?? ''
  if (agent.startsWith('pnpm')) return 'pnpm'
  if (agent.startsWith('yarn')) return 'yarn'
  if (agent.startsWith('bun')) return 'bun'
  return 'npm'
}

export type TailwindState = 'v4' | 'v3' | 'missing'

export function detectTailwind(project: Project): TailwindState {
  const major = versionMajor(project, 'tailwindcss')
  if (major === null) return 'missing'
  return major >= 4 ? 'v4' : 'v3'
}

/**
 * Where Tailwind v4 plugs into the framework's build, and whether it does:
 * the PostCSS plugin on Next.js, the Vite plugin elsewhere. Installed isn't
 * enough: npm installs Tailwind as a peer of @youj/react, and nothing then
 * compiles it. Null where it can't be told (no config file to read).
 */
export function tailwindWiring(project: Project, framework: Framework): { file: string | null; wired: boolean | null } {
  const next = framework === 'next-app' || framework === 'next-pages'
  // create-next-app 16.4 wires Tailwind as a Turbopack loader in next.config instead of PostCSS.
  const nextConfig = next ? project.find('next.config.ts', 'next.config.mjs', 'next.config.js', 'next.config.mts') : null
  if (nextConfig && (project.read(nextConfig) ?? '').includes('@tailwindcss/turbopack')) return { file: nextConfig, wired: true }
  const files = next
    ? ['postcss.config.mjs', 'postcss.config.js', 'postcss.config.cjs', 'postcss.config.ts', '.postcssrc.json']
    : framework === 'astro'
      ? ['astro.config.mjs', 'astro.config.ts', 'astro.config.mts', 'astro.config.js']
      : ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs']
  const file = project.find(...files)
  if (!file) return { file: null, wired: next ? false : null }
  return { file, wired: (project.read(file) ?? '').includes(next ? '@tailwindcss/postcss' : '@tailwindcss/vite') }
}

const EXT = ['tsx', 'jsx', 'ts', 'js']
const withExt = (base: string) => EXT.map((ext) => `${base}.${ext}`)

/** Where the framework puts its React root (the provider goes here) and, for SSR frameworks, the document. */
export interface Entry {
  /** The file that renders the app root, or null (Astro has none). */
  root: string | null
  /** The file with <html>, when the framework renders one. */
  document: string | null
  /** The file that imports the global stylesheet. */
  styles: string | null
}

export function detectEntry(project: Project, framework: Framework): Entry {
  switch (framework) {
    case 'next-app': {
      const layout = project.find(...withExt('app/layout'), ...withExt('src/app/layout'))
      return { root: layout, document: layout, styles: layout }
    }
    case 'next-pages': {
      const app = project.find(...withExt('pages/_app'), ...withExt('src/pages/_app'))
      const doc = project.find(...withExt('pages/_document'), ...withExt('src/pages/_document'))
      return { root: app, document: doc, styles: app }
    }
    case 'vite': {
      const main = project.find(...withExt('src/main'), ...withExt('src/index'))
      return { root: main, document: project.find('index.html'), styles: main }
    }
    case 'react-router': {
      const root = project.find(...withExt('app/root'))
      return { root, document: root, styles: root }
    }
    case 'astro': {
      const layout = project.find('src/layouts/Layout.astro', 'src/layouts/BaseLayout.astro', 'src/layouts/Base.astro') ?? project.walk('src/layouts', (n) => n.endsWith('.astro'))[0] ?? project.find('src/pages/index.astro')
      return { root: null, document: layout, styles: layout }
    }
  }
}

const CSS_IMPORT = /^\s*import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+\.css)(?:\?\w+)?['"]/gm

/** The .css files a module imports (relative ones, resolved to project paths). */
export function cssImports(project: Project, file: string): string[] {
  const source = project.read(file) ?? ''
  const out: string[] = []
  for (const [, spec] of source.matchAll(CSS_IMPORT)) {
    // The starters' `@/` alias points at src/ when there is one, else the root.
    if (spec!.startsWith('@/')) out.push(`${project.exists('src') ? 'src/' : ''}${spec!.slice(2)}`)
    else if (spec!.startsWith('.')) out.push(posix.normalize(posix.join(posix.dirname(file), spec!)))
  }
  return out
}


/** Where each framework's starter keeps its global stylesheet, if the entry imports none. */
export function defaultStylesheet(project: Project, framework: Framework): string {
  const src = project.exists('src') ? 'src/' : ''
  switch (framework) {
    case 'next-app':
      return project.exists('src/app') ? 'src/app/globals.css' : 'app/globals.css'
    case 'next-pages':
      return `${src}styles/globals.css`
    case 'vite':
      return 'src/index.css'
    case 'react-router':
      return 'app/app.css'
    case 'astro':
      return 'src/styles/global.css'
  }
}

/**
 * The app's global stylesheet: of the CSS files the entry imports, the one
 * with Tailwind's import, else the first; `created` when there's none yet.
 */
export function detectStylesheet(project: Project, framework: Framework, entry: Entry): { path: string; imported: boolean } {
  const imported = entry.styles ? cssImports(project, entry.styles).filter((p) => project.exists(p)) : []
  const withTailwind = imported.find((p) => TAILWIND_IMPORT.test(project.read(p) ?? ''))
  if (withTailwind ?? imported[0]) return { path: (withTailwind ?? imported[0])!, imported: true }
  return { path: defaultStylesheet(project, framework), imported: false }
}
