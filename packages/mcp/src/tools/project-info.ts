import type { Catalog } from '../catalog'

const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const strings = (value: unknown): Record<string, string> => Object.fromEntries(Object.entries(object(value)).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
const major = (version: string | undefined) => version?.match(/^[~^>=v\s]*(\d+)(?:\.|$)/)?.[1]

/** What the tools read of an app: its files, inside its folder. The local server reads the disk; the remote one has no app, so it reads nothing. */
export interface ProjectFiles {
  readonly root: string
  path(file: string): string | undefined
  read(file: string): string | undefined
  json(file: string): Record<string, unknown> | undefined
  installed(name: string): string | undefined
  styles(): string[]
}

/** No app to read: what the remote server sees. */
export const noProject: ProjectFiles = {
  root: '/',
  path: () => undefined,
  read: () => undefined,
  json: () => undefined,
  installed: () => undefined,
  styles: () => [],
}

export function inspectProject(project: ProjectFiles) {
  const pkg = project.json('package.json')
  const deps = { ...strings(pkg?.devDependencies), ...strings(pkg?.dependencies) }
  const components = project.json('components.json')
  const route = object(components?.registries)['@youj'] ? 'registry' : 'package'
  const locks = [['pnpm-lock.yaml', 'pnpm'], ['bun.lock', 'bun'], ['bun.lockb', 'bun'], ['yarn.lock', 'yarn'], ['package-lock.json', 'npm']] as const
  const field = typeof pkg?.packageManager === 'string' ? pkg.packageManager.split('@')[0] : undefined
  const lockPm = locks.find(([file]) => project.path(file))?.[1]
  const pm = lockPm ?? (['npm', 'pnpm', 'yarn', 'bun'].includes(field ?? '') ? field! : 'npm')
  // Same precedence as the CLI, without its parent-workspace searches.
  const layout = ['app', 'src/app'].some((dir) => ['tsx', 'jsx', 'js', 'ts'].some((ext) => project.path(`${dir}/layout.${ext}`)))
  const framework = deps.astro ? 'astro' : deps['@react-router/dev'] ? 'react-router' : deps.next ? layout ? 'next-app' : 'next-pages' : deps.vite && deps.react ? 'vite' : 'unknown'
  const version = (name: string) => project.installed(name) ?? deps[name]
  return { project, pkg, deps, components, route, pm, pmKnown: Boolean(lockPm || ['npm', 'pnpm', 'yarn', 'bun'].includes(field ?? '')), framework, version }
}

export function getProjectInfo(catalog: Catalog, cwd?: string): string {
  const { project, pkg, deps, route, pm, framework, version } = inspectProject(catalog.host.project(cwd))
  const warnings: string[] = []
  if (!pkg) warnings.push('package.json is missing, unreadable or invalid.')
  if (project.path('components.json') && !project.json('components.json')) warnings.push('components.json is unreadable or invalid.')
  const names = [...new Set(['@youj/react', '@youj/core', '@youj/motion', '@youj/loaders', '@youj/miniatures', '@youj/icons', '@youj/illustrations', '@youj/sound', ...Object.keys(deps).filter((name) => name.startsWith('@youj/'))])].sort()
  const packages = names.flatMap((name) => {
    const installed = project.installed(name)
    if (!installed && !deps[name]) return []
    if (installed && installed !== catalog.index.meta.version) warnings.push(`${name} ${installed} differs from this MCP's version ${catalog.index.meta.version}.`)
    if (!installed) warnings.push(`${name}: installed version unavailable inside cwd; declared range is not an installed version.`)
    return [`${name}: ${installed ?? 'not found'}${deps[name] ? ` (declared ${deps[name]})` : ''}`]
  })
  for (const [name, required] of [['react', 19], ['tailwindcss', 4]] as const) {
    const found = version(name)
    if (!found) warnings.push(`${name} is missing.`)
    else if (major(found) && Number(major(found)) < required) warnings.push(`${name} ${found}: Youj requires ${required} or newer.`)
  }
  const css = project.styles().map((file) => project.read(file)?.replace(/\/\*[\s\S]*?\*\//g, '') ?? '').join('\n')
  const imports = [...css.matchAll(/@import\s+(?:url\(\s*)?['"]([^'"]+)['"]/g)].map((match) => match[1]!)
  // The tokens (react's sheet brings motion's and the icons'), then a sheet per package whose classes they don't cover.
  const expected = [
    deps['@youj/react'] ? '@youj/react/styles.css' : '@youj/core/styles.css',
    ...(deps['@youj/icons'] && !deps['@youj/react'] ? ['@youj/icons/styles.css'] : []),
    ...(deps['@youj/illustrations'] ? ['@youj/illustrations/styles.css'] : []),
  ]
  if (route === 'registry' ? !imports.some((spec) => /(?:^|\/)styles\/youj\.css$/.test(spec)) : !imports.includes(expected[0]!)) warnings.push('Missing Youj stylesheet import in the inspected CSS files (scan limited to 2,000 entries / 8 levels).')
  else if (route !== 'registry') for (const spec of expected.slice(1)) if (!imports.includes(spec)) warnings.push(`Missing @import '${spec}'; after the Youj tokens (it points Tailwind at that package's classes).`)
  const display = (name: string) => `${version(name) ?? 'not found'}${!project.installed(name) && deps[name] ? ' (declared)' : ''}`
  return [
    `Project: ${project.root}`,
    `Framework: ${framework} · Package manager: ${pm} · Route: ${route}${!packages.length && route === 'package' ? ' (default; Youj not detected)' : ''}`,
    `React: ${display('react')} · Tailwind: ${display('tailwindcss')} · MCP: ${catalog.index.meta.version}`,
    `Youj: ${packages.length ? packages.join('; ') : 'none detected'}`,
    `Warnings:${warnings.length ? '\n' + warnings.map((warning) => `- ${warning}`).join('\n') : ' none'}`,
  ].join('\n')
}
