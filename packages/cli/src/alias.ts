/* The `@/` import alias the copied source uses (`@/lib/utils`, `@/components/ui/button`).
 * shadcn resolves it from the tsconfig it finds in the app's root and writes into a
 * literal `./@/…` folder when there's no `paths` there; Vite's own template keeps its
 * paths in tsconfig.app.json (root tsconfig.json only references it), and the bundler
 * needs the alias too. */

import { styleOf } from './codemods'
import type { Framework } from './detect'
import { importPath, type Project } from './project'

/** JSON with comments and trailing commas (what tsconfig files are), or null when it doesn't parse. */
export function parseJsonc<T = Record<string, any>>(text: string | null): T | null {
  if (text === null) return null
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!
    if (c === '"') {
      let j = i + 1
      while (j < text.length && text[j] !== '"') j += text[j] === '\\' ? 2 : 1
      out += text.slice(i, j + 1)
      i = j
    } else if (c === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++
      out += '\n'
    } else if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2)
      i = end < 0 ? text.length : end + 1
    } else out += c
  }
  try {
    return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1')) as T
  } catch {
    return null
  }
}

type Tsconfig = { extends?: string | string[]; compilerOptions?: { paths?: Record<string, string[]> } }

function joinPath(base: string, rel: string): string {
  const out: string[] = []
  for (const part of `${base}${rel}`.split('/')) {
    if (part === '..') out.pop()
    else if (part !== '.' && part !== '') out.push(part)
  }
  return out.join('/')
}

/** The `paths` a tsconfig sets, itself or through a relative `extends`. `references` don't count: tools that read this file don't follow them. */
export function pathsOf(project: Project, file: string, depth = 4): Record<string, string[]> | null {
  const config = parseJsonc<Tsconfig>(project.read(file))
  if (!config) return null
  if (config.compilerOptions?.paths) return config.compilerOptions.paths
  if (depth === 0) return null
  const base = file.includes('/') ? file.slice(0, file.lastIndexOf('/') + 1) : ''
  for (const parent of [config.extends].flat()) {
    if (typeof parent !== 'string' || !parent.startsWith('.')) continue
    const found = pathsOf(project, joinPath(base, parent.endsWith('.json') ? parent : `${parent}.json`), depth - 1)
    if (found) return found
  }
  return null
}

const hasAt = (paths: Record<string, string[]> | null) => Boolean(paths && '@/*' in paths)

/**
 * Adds `"@/*": ["./src/*"]` to a tsconfig's compilerOptions.paths as a string edit, so its comments
 * and formatting stay. Returns the source unchanged when the alias is there, null when the file
 * doesn't parse.
 */
export function addTsconfigPaths(source: string, target = './src/*'): string | null {
  const config = parseJsonc<Tsconfig>(source)
  if (!config) return null
  const paths = config.compilerOptions?.paths
  if (hasAt(paths ?? null)) return source
  const { indent } = styleOf(source)
  const entry = `"@/*": ["${target}"]`
  const insertAfter = (re: RegExp, text: string) => {
    const m = re.exec(source)
    return m ? source.slice(0, m.index + m[0].length) + text + source.slice(m.index + m[0].length) : null
  }
  if (paths) return insertAfter(/"paths"\s*:\s*\{/, `\n${indent}${indent}${indent}${entry}${Object.keys(paths).length ? ',' : `\n${indent}${indent}`}`)
  if (config.compilerOptions)
    return insertAfter(/"compilerOptions"\s*:\s*\{/, `\n${indent}${indent}"paths": { ${entry} }${Object.keys(config.compilerOptions).length ? ',' : `\n${indent}`}`)
  if (!Object.keys(config).length) return `{\n${indent}"compilerOptions": {\n${indent}${indent}"paths": { ${entry} }\n${indent}}\n}\n`
  return insertAfter(/\{/, `\n${indent}"compilerOptions": {\n${indent}${indent}"paths": { ${entry} }\n${indent}},`)
}

/** Whether a Vite config maps `@` (a resolve.alias entry, or the vite-tsconfig-paths plugin). */
export function viteHasAlias(config: string): boolean {
  return /\balias\b[\s\S]*?['"]@['"]/.test(config) || /find\s*:\s*['"]@['"]/.test(config) || /tsconfig-?paths/i.test(config)
}

/**
 * Adds `resolve: { alias: { '@': '/src' } }` to a Vite config, before `plugins:`. `/src` is
 * root-absolute, so the config needs no `path` import or Node types. Unchanged when the alias
 * is there; null when there's no `plugins:` to anchor on or the config already has a `resolve` key.
 */
export function addViteAlias(config: string): string | null {
  if (viteHasAlias(config)) return config
  if (/\bresolve\s*:/.test(config)) return null
  const plugins = /^([ \t]*)plugins\s*:/m.exec(config)
  if (!plugins) return null
  const { quote } = styleOf(config)
  const line = `${plugins[1]}resolve: { alias: { ${quote}@${quote}: ${quote}/src${quote} } },\n`
  return config.slice(0, plugins.index) + line + config.slice(plugins.index)
}

export const VITE_CONFIGS = ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs']

/** The tsconfig shadcn reads, and the one TypeScript uses for src in Vite's split layout. */
function tsconfigs(project: Project): { root: string | null; app: string | null } {
  return { root: project.find('tsconfig.json', 'jsconfig.json'), app: project.exists('tsconfig.app.json') ? 'tsconfig.app.json' : null }
}

const targetOf = (project: Project) => (project.exists('src') ? './src/*' : './*')

/**
 * Stages the alias for a Vite app: `paths` in the tsconfig shadcn reads and in tsconfig.app.json
 * (Vite's template splits them), and `resolve.alias` in the Vite config. Anything it can't edit
 * goes to `manual`.
 */
export function setupViteAlias(project: Project, manual: string[]) {
  const { root, app } = tsconfigs(project)
  const target = targetOf(project)
  for (const file of new Set([root, app].filter((f): f is string => f !== null))) {
    const edited = addTsconfigPaths(project.read(file)!, target)
    if (edited === null) manual.push(`Add "paths": { "@/*": ["${target}"] } to compilerOptions in ${file}.`)
    else project.write(file, edited)
  }
  // No tsconfig at all: a bare one for shadcn to read (jsconfig.json in a JavaScript app).
  if (!root) project.write(project.find('src/main.tsx', 'src/main.ts') ? 'tsconfig.json' : 'jsconfig.json', addTsconfigPaths('{}', target)!)
  const config = project.find(...VITE_CONFIGS)
  const source = config && project.read(config)
  const line = 'resolve: { alias: { \'@\': \'/src\' } }'
  if (!config || source === null) manual.push(`Add ${line} to your Vite config.`)
  else {
    const edited = addViteAlias(source)
    if (edited === null) manual.push(`Add ${line} to ${config}: Vite needs the @/ alias too, not just tsconfig.`)
    else project.write(config, edited)
  }
}

/**
 * Stages the `@/` alias where it's missing: in tsconfig, and in the Vite config when
 * there is one (Vite, React Router). Next.js and Astro read tsconfig's.
 */
export function setupAlias(project: Project, manual: string[]) {
  if (project.find(...VITE_CONFIGS)) return setupViteAlias(project, manual)
  const config = project.find('tsconfig.json', 'jsconfig.json')
  const target = targetOf(project)
  const edited = config ? addTsconfigPaths(project.read(config)!, target) : addTsconfigPaths('{}', target)
  if (edited === null) manual.push(`Add "paths": { "@/*": ["${target}"] } to compilerOptions in ${config}.`)
  else project.write(config ?? 'tsconfig.json', edited)
}

export interface AliasProblem {
  message: string
  fix: string
}

/** What's wrong with the `@/` alias. Empty when it's fine, or when the app has no tsconfig/jsconfig to judge by. */
export function aliasProblems(project: Project, framework: Framework | null): AliasProblem[] {
  const { root, app } = tsconfigs(project)
  if (!root) return []
  const problems: AliasProblem[] = []
  const paths = `"paths": { "@/*": ["${targetOf(project)}"] }`
  if (!hasAt(pathsOf(project, root))) {
    const inApp = app && hasAt(pathsOf(project, app))
    problems.push({
      message: inApp
        ? `The @/ alias is in ${app} but not in ${root}. shadcn reads ${root}, so \`add\` would write into a literal ./@/ folder`
        : `No @/ alias in ${root}: shadcn would write copied items into a literal ./@/ folder, and their @/ imports wouldn't resolve`,
      fix: `Add ${paths} to compilerOptions in ${root}${framework === 'vite' ? `${app ? ` and ${app}` : ''}, plus resolve.alias in your Vite config. \`npx youj init --mode registry\` does all three` : ''}.`,
    })
  } else if (app && !hasAt(pathsOf(project, app)))
    problems.push({ message: `The @/ alias is in ${root} but not in ${app}, which TypeScript uses for your source, so its imports are type errors`, fix: `Add ${paths} to compilerOptions in ${app}.` })
  if (framework === 'vite') {
    const config = project.find(...VITE_CONFIGS)
    const source = config && project.read(config)
    if (config && source && !viteHasAlias(source))
      problems.push({ message: `${config} has no @ alias, so Vite can't resolve the copied source's @/ imports`, fix: `Add resolve: { alias: { '@': '/src' } } to ${config}.` })
  }
  return problems
}

/**
 * How a file imports another of the app's: `@/lib/youj/sound` when the app has the `@/` alias
 * (tsconfig, and the Vite config in a Vite app) and `to` is under it, as the docs show it,
 * else the relative path.
 */
export function importSpecifier(project: Project, from: string, to: string): string {
  const target = (pathsOf(project, 'tsconfig.json') ?? pathsOf(project, 'tsconfig.app.json') ?? pathsOf(project, 'jsconfig.json'))?.['@/*']?.[0]
  const config = project.find(...VITE_CONFIGS)
  const resolvable = target && (!config || viteHasAlias(project.read(config) ?? ''))
  if (resolvable) {
    const base = target.replace(/^\.\//, '').replace(/\/?\*$/, '')
    if (!base) return `@/${to}`
    if (to.startsWith(`${base}/`)) return `@/${to.slice(base.length + 1)}`
  }
  return importPath(from, to)
}
