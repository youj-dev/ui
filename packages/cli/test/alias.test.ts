import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { addTsconfigPaths, addViteAlias, aliasProblems, parseJsonc, pathsOf, setupViteAlias } from '../src/alias'
import { doctor } from '../src/doctor'
import { init } from '../src/init'
import { Project } from '../src/project'
import { silentUi } from '../src/ui'
import { fakeRunner, fixture, read, write } from './helpers'

const ROOT = '{\n  "files": [],\n  "references": [{ "path": "./tsconfig.app.json" }]\n}\n'
const problemsOf = (root: string) => aliasProblems(new Project(root), 'vite')

/** The vite fixture with a components.json on the registry and the @youj packages' stylesheets in place, as far as doctor looks. */
function registryApp() {
  const root = fixture('vite')
  write(root, 'components.json', JSON.stringify({ aliases: { components: '@/components' }, registries: { '@youj': 'https://www.youj.dev/r/{name}.json' } }))
  write(root, 'src/index.css', "@import 'tailwindcss';\n@import './styles/youj.css';\n@import './styles/ui.css';\n")
  write(root, 'src/styles/youj.css', '/* tokens */\n')
  write(root, 'src/styles/ui.css', '/* ui */\n')
  write(root, 'node_modules/react/package.json', '{"version":"19.2.0"}')
  write(root, 'node_modules/tailwindcss/package.json', '{"version":"4.1.13"}')
  write(root, 'vite.config.ts', read(root, 'vite.config.ts').replace('plugins: [react()]', 'plugins: [tailwindcss(), react()]').replace("import react", "import tailwindcss from '@tailwindcss/vite'\nimport react"))
  return root
}

describe('parseJsonc', () => {
  it('reads comments and trailing commas, and keeps // inside strings', () => {
    expect(parseJsonc('{\n  // a\n  "url": "http://x", /* b */\n  "n": [1, 2,],\n}')).toEqual({ url: 'http://x', n: [1, 2] })
  })

  it('is null for text that is not JSON', () => {
    expect(parseJsonc('nope')).toBeNull()
  })
})

describe('addTsconfigPaths', () => {
  it('adds compilerOptions to a solution tsconfig that has none', () => {
    const out = addTsconfigPaths(ROOT)!
    expect(parseJsonc(out)).toMatchObject({ files: [], compilerOptions: { paths: { '@/*': ['./src/*'] } } })
    expect(out).toContain('"references"')
  })

  it('adds paths to compilerOptions, keeping its comments', () => {
    const app = read(fixture('vite'), 'tsconfig.app.json')
    const out = addTsconfigPaths(app)!
    expect(out).toContain('/* Bundler mode */')
    expect(parseJsonc<any>(out).compilerOptions).toMatchObject({ strict: true, paths: { '@/*': ['./src/*'] } })
  })

  it('adds the entry to paths that are there, and changes nothing once it is', () => {
    const source = '{\n  "compilerOptions": {\n    "paths": {\n      "~/*": ["./app/*"]\n    }\n  }\n}\n'
    const out = addTsconfigPaths(source)!
    expect(parseJsonc<any>(out).compilerOptions.paths).toEqual({ '~/*': ['./app/*'], '@/*': ['./src/*'] })
    expect(addTsconfigPaths(out)).toBe(out)
  })

  it('handles an empty compilerOptions and an empty file', () => {
    expect(parseJsonc<any>(addTsconfigPaths('{ "compilerOptions": {} }')!).compilerOptions.paths).toEqual({ '@/*': ['./src/*'] })
    expect(parseJsonc<any>(addTsconfigPaths('{}')!).compilerOptions.paths).toEqual({ '@/*': ['./src/*'] })
  })
})

describe('addViteAlias', () => {
  it('adds resolve.alias before the plugins, once', () => {
    const config = read(fixture('vite'), 'vite.config.ts')
    const out = addViteAlias(config)!
    expect(out).toContain("  resolve: { alias: { '@': '/src' } },\n  plugins: [react()],")
    expect(addViteAlias(out)).toBe(out)
  })

  it('leaves a config that maps @ or uses vite-tsconfig-paths alone', () => {
    const mapped = "export default { resolve: { alias: { '@': '/src' } }, plugins: [] }"
    expect(addViteAlias(mapped)).toBe(mapped)
    const plugin = "import tsconfigPaths from 'vite-tsconfig-paths'\nexport default { plugins: [tsconfigPaths()] }"
    expect(addViteAlias(plugin)).toBe(plugin)
  })

  it('gives up, for the caller to say so, on a resolve it would have to merge into', () => {
    expect(addViteAlias("export default { resolve: { dedupe: ['react'] }, plugins: [] }")).toBeNull()
  })
})

describe('aliasProblems', () => {
  it('names the literal ./@ folder when the alias is only in tsconfig.app.json (Vite’s layout)', () => {
    const root = fixture('vite')
    write(root, 'tsconfig.app.json', addTsconfigPaths(read(root, 'tsconfig.app.json'))!)
    const [problem] = problemsOf(root)
    expect(problem!.message).toMatch(/in tsconfig\.app\.json but not in tsconfig\.json.*literal \.\/@\/ folder/)
    expect(problem!.fix).toContain('tsconfig.json')
  })

  it('also wants the bundler alias, and passes once tsconfig.json, tsconfig.app.json and the config have it', () => {
    const root = fixture('vite')
    const project = new Project(root)
    setupViteAlias(project, [])
    project.commit()
    expect(problemsOf(root)).toEqual([])
    write(root, 'vite.config.ts', read(fixture('vite'), 'vite.config.ts'))
    expect(problemsOf(root).map((p) => p.message)).toEqual([expect.stringContaining('vite.config.ts has no @ alias')])
  })

  it('follows a relative extends, as Astro’s tsconfig does', () => {
    const root = fixture('vite')
    write(root, 'base.json', '{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }')
    write(root, 'tsconfig.json', '{ "extends": "./base" }')
    expect(pathsOf(new Project(root), 'tsconfig.json')).toEqual({ '@/*': ['./src/*'] })
  })

  it('has nothing to say about an app with no tsconfig', () => {
    expect(aliasProblems(new Project(fixture('astro')), 'astro')).toEqual([])
  })
})

describe('init on Vite, on the registry', () => {
  it('sets the alias up in tsconfig.json, tsconfig.app.json and the Vite config', async () => {
    const root = fixture('vite')
    const result = await init({ cwd: root, yes: true, mode: 'registry' }, fakeRunner(root), silentUi(), {})
    expect(parseJsonc<any>(read(root, 'tsconfig.json')).compilerOptions.paths).toEqual({ '@/*': ['./src/*'] })
    expect(parseJsonc<any>(read(root, 'tsconfig.app.json')).compilerOptions.paths).toEqual({ '@/*': ['./src/*'] })
    expect(read(root, 'vite.config.ts')).toContain("resolve: { alias: { '@': '/src' } }")
    expect(result.manual.filter((m) => m.includes('@/'))).toEqual([])
    expect(problemsOf(root)).toEqual([])
  })

  it('is a no-op the second time', async () => {
    const root = fixture('vite')
    await init({ cwd: root, yes: true, mode: 'registry' }, fakeRunner(root), silentUi(), {})
    const files = ['tsconfig.json', 'tsconfig.app.json', 'vite.config.ts'].map((f) => read(root, f))
    await init({ cwd: root, yes: true, mode: 'registry' }, fakeRunner(root), silentUi(), {})
    expect(['tsconfig.json', 'tsconfig.app.json', 'vite.config.ts'].map((f) => read(root, f))).toEqual(files)
  })

  it('repairs an app that has the alias only in tsconfig.app.json', async () => {
    const root = fixture('vite')
    write(root, 'tsconfig.app.json', addTsconfigPaths(read(root, 'tsconfig.app.json'))!)
    await init({ cwd: root, yes: true, mode: 'registry' }, fakeRunner(root), silentUi(), {})
    expect(problemsOf(root)).toEqual([])
  })

  it('writes nothing on a dry run', async () => {
    const root = fixture('vite')
    const before = read(root, 'tsconfig.json')
    const result = await init({ cwd: root, yes: true, mode: 'registry', dryRun: true }, fakeRunner(root), silentUi(), {})
    expect(read(root, 'tsconfig.json')).toBe(before)
    expect(result.changes.map((c) => c.path)).toContain('tsconfig.json')
  })

  it('on a package-mode app, leaves the tsconfigs alone', async () => {
    const root = fixture('vite')
    await init({ cwd: root, yes: true, mode: 'package' }, fakeRunner(root), silentUi(), {})
    expect(read(root, 'tsconfig.json')).not.toContain('paths')
  })
})

describe('doctor, on the alias', () => {
  it('reports an alias only in tsconfig.app.json instead of "All good"', () => {
    const root = registryApp()
    write(root, 'tsconfig.app.json', addTsconfigPaths(read(root, 'tsconfig.app.json'))!)
    const errors = doctor(root, {}).filter((c) => c.level === 'error')
    expect(errors.map((c) => c.message)).toEqual([expect.stringContaining('alias is in tsconfig.app.json but not in tsconfig.json'), expect.stringContaining('vite.config.ts has no @ alias')])
  })

  it('reports a missing alias, and the literal @ folder a copy left behind', () => {
    const root = registryApp()
    write(root, '@/components/ui/button.tsx', 'export {}\n')
    const errors = doctor(root, {}).filter((c) => c.level === 'error').map((c) => c.message)
    expect(errors).toContainEqual(expect.stringContaining('No @/ alias in tsconfig.json'))
    expect(errors).toContainEqual(expect.stringContaining('literal @ folder'))
  })

  it('reports copied source whose @/ imports land on nothing', async () => {
    const root = registryApp()
    const project = new Project(root)
    setupViteAlias(project, [])
    project.commit()
    write(root, 'src/components/ui/button.tsx', "import { cn } from '@/lib/utils'\nimport { X } from '@/components/ui/x'\nexport {}\n")
    write(root, 'src/components/ui/x.tsx', 'export const X = 1\n')
    const errors = doctor(root, {}).filter((c) => c.level === 'error')
    expect(errors.map((c) => c.message)).toEqual([expect.stringMatching(/1 @\/ import.*@\/lib\/utils/)])
  })

  it('passes when the alias is set up and the imports resolve', () => {
    const root = registryApp()
    const project = new Project(root)
    setupViteAlias(project, [])
    project.commit()
    write(root, 'src/lib/utils.ts', 'export const cn = 1\n')
    write(root, 'src/components/ui/button.tsx', "import { cn } from '@/lib/utils'\nexport {}\n")
    const checks = doctor(root, {})
    expect(checks.filter((c) => c.level === 'error')).toEqual([])
    expect(checks.map((c) => c.message)).toContain('The @/ alias is set up, and the copied source’s @/ imports resolve')
    expect(existsSync(join(root, '@'))).toBe(false)
  })

  it('says when components.json is not JSON', () => {
    const root = registryApp()
    write(root, 'components.json', '{ nope')
    expect(doctor(root, {}).map((c) => c.message)).toContain('components.json isn’t valid JSON, so shadcn can’t read it')
  })
})
