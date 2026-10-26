import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { setupViteAlias } from '../src/alias'
import { Project } from '../src/project'
import { add, addCommand, addPlan, packageEntry, unwired } from '../src/add'
import { wirePackageStyles } from '../src/wiring'
import { addCssImports, addTagAttributes, addVitePlugin, wrapElement, wrapTagContents } from '../src/codemods'
import { MOTION_RANGE, PRESET_MOTION, registryTemplate, sourcePackageOf, THEMES, VERSION } from '../src/constants'
import { diffLines, hunks } from '../src/diff'
import { doctor } from '../src/doctor'
import { init } from '../src/init'
import { format, SHADCN } from '../src/run'
import { silentUi } from '../src/ui'
import { fakeRunner, fixture, read, write } from './helpers'

describe('the shadcn CLI', () => {
  it('is pinned to an exact version, so a shadcn release cannot change what `youj add` writes', () => {
    expect(SHADCN).toMatch(/^shadcn@\d+\.\d+\.\d+$/)
  })
})

describe('add', () => {
  it('adds through the namespace when components.json has it', () => {
    const root = fixture('next-app')
    write(root, 'components.json', JSON.stringify({ registries: { '@youj': 'https://www.youj.dev/r/{name}.json' } }))
    expect(format(addCommand(root, ['button', '@youj/dialog'], ['--overwrite'], {}))).toBe('pnpm dlx shadcn@4.21.0 add @youj/button @youj/dialog --overwrite')
  })

  it('falls back to item URLs without the namespace', () => {
    const root = fixture('next-pages')
    write(root, 'components.json', '{}')
    expect(format(addCommand(root, ['button'], [], { YOUJ_REGISTRY_URL: 'http://localhost:6199/r/{name}.json' }))).toBe(
      'npx --yes shadcn@4.21.0 add http://localhost:6199/r/button.json',
    )
  })

  it('passes URLs without a components.json, so shadcn sets one up', () => {
    expect(format(addCommand(fixture('vite'), ['button'], [], {}))).toBe(`bunx shadcn@4.21.0 add https://www.youj.dev/r/v${VERSION}/button.json`)
  })

  it.each(['button&calc', 'button;rm', 'a b', '$(calc)', 'button|x', '`x`', '../x', 'https://x.dev/r/a.json&calc', 'https://x.dev/r/a.json?x=1&y=2'])('refuses the item %s before it reaches a command', (item) => {
    expect(() => addCommand(fixture('vite'), ['button', item], [], {})).toThrow(/not an item name/)
    expect(() => addPlan(fixture('vite'), [item], [], {})).toThrow(/not an item name/)
  })

  it('takes names, namespaced names and https URLs', () => {
    expect(() => addCommand(fixture('vite'), ['button', '@youj/dialog', '@acme/card', 'tables-data-grid', 'https://www.youj.dev/r/v0.1.0/button.json'], [], {})).not.toThrow()
  })

  it('needs at least one item', () => {
    expect(() => addCommand(fixture('vite'), [], [], {})).toThrow(/Name the items/)
  })
})

describe('add, in an app on the package', () => {
  /** The vite fixture after `init`: @youj/react installed, plus `deps`. */
  function onPackage(deps: Record<string, string> = {}) {
    const root = fixture('vite')
    const pkg = JSON.parse(read(root, 'package.json'))
    pkg.dependencies = { ...pkg.dependencies, '@youj/react': '^0.1.0', ...deps }
    write(root, 'package.json', JSON.stringify(pkg, null, 2))
    return root
  }

  it('installs the optional peers a component needs instead of copying it', async () => {
    const root = onPackage()
    const runner = fakeRunner(root)
    const ui = silentUi()
    const plan = await add(root, ['chart', 'button'], [], runner, ui, {})
    expect(runner.commands).toEqual(['bun add recharts@^3.8.0'])
    expect(plan.fromPackage).toEqual([
      { item: 'chart', entry: '@youj/react/chart' },
      { item: 'button', entry: '@youj/react' },
    ])
    expect(ui.log.join('\n')).toContain("chart: import it from '@youj/react/chart'")
    expect(JSON.parse(read(root, 'package.json')).dependencies.recharts).toBe('^3.8.0')
  })

  it("installs each peer once, and only the ones the app doesn't have", () => {
    const plan = addPlan(onPackage({ 'date-fns': '^4.0.0' }), ['date-picker', 'calendar', 'combobox', 'data-table'], [], {})
    expect(plan.peers).toEqual(['react-day-picker', 'cmdk'])
    expect(plan.install && format(plan.install)).toBe('bun add react-day-picker@^10.0.1 cmdk@^1.1.1')
    expect(plan.copy).toBeUndefined()
  })

  it('installs the form entry\'s peer, react-hook-form', () => {
    expect(addPlan(onPackage(), ['form'], [], {}).peers).toEqual(['react-hook-form'])
  })

  it('installs nothing for a component the main entry ships', async () => {
    const root = onPackage()
    const runner = fakeRunner(root)
    await add(root, ['button', 'table'], [], runner, silentUi(), {})
    expect(runner.commands).toEqual([])
  })

  it('still copies in what the package does not ship, such as blocks, by itself rather than through shadcn', () => {
    const plan = addPlan(onPackage(), ['chart', 'auth-login'], ['--overwrite'], {})
    expect(plan.copy).toBeUndefined()
    expect(plan.copyIn).toEqual(['auth-login'])
  })

  it('copies everything in an app on the registry', () => {
    const root = onPackage()
    write(root, 'components.json', JSON.stringify({ registries: { '@youj': 'https://www.youj.dev/r/{name}.json' } }))
    const plan = addPlan(root, ['chart'], [], {})
    expect(plan).toMatchObject({ fromPackage: [], peers: [], install: undefined })
    expect(plan.copy && format(plan.copy)).toBe('bunx shadcn@4.21.0 add @youj/chart')
  })

  it('knows the entry and peers of every item that needs one, from the package', () => {
    const ui = JSON.parse(readFileSync(join(import.meta.dirname, '../../ui/package.json'), 'utf8'))
    for (const item of ['chart', 'form', 'calendar', 'carousel', 'command']) {
      for (const [peer, range] of Object.entries(packageEntry(item)!.peerDependencies)) {
        expect(ui.peerDependencies[peer]).toBe(range)
        expect(ui.peerDependenciesMeta[peer]).toEqual({ optional: true })
      }
    }
  })
})

describe('add miniature-<id>', () => {
  it('is an install and an import, in any app: miniatures are npm only, need no core and no stylesheet', () => {
    const root = fixture('next-app')
    const plan = addPlan(root, ['miniature-turntable', 'miniature-3d-printer'], [], {})
    expect(plan.fromPackage).toEqual([
      { item: 'miniature-turntable', entry: '@youj/miniatures/turntable' },
      { item: 'miniature-3d-printer', entry: '@youj/miniatures/3d-printer' },
    ])
    expect(plan.copy).toBeUndefined()
    expect(plan.copyIn).toBeUndefined()
    expect(plan.packages).toEqual(['@youj/miniatures'])
    expect(plan.css).toEqual([])
    expect(plan.install && format(plan.install)).toMatch(/ add @youj\/miniatures@\^0\.1\.0$/)
  })

  it('installs nothing when the package is already there', () => {
    const root = fixture('next-app')
    const pkg = JSON.parse(read(root, 'package.json'))
    pkg.dependencies = { ...pkg.dependencies, '@youj/miniatures': '^0.1.0' }
    write(root, 'package.json', JSON.stringify(pkg, null, 2))
    expect(addPlan(root, ['miniature-hourglass'], [], {}).install).toBeUndefined()
  })
})

describe('add illustration-<id>', () => {
  /** The per-scene items motion's generator writes (packages/illustrations/registry/illustrations.json). */
  const items = JSON.parse(readFileSync(join(import.meta.dirname, '../../illustrations/registry/illustrations.json'), 'utf8')) as { name: string; registryDependencies: string[]; files: { path: string }[] }[]

  it('copies one scene in, through the namespace or by its URL', () => {
    const root = fixture('next-app')
    write(root, 'components.json', JSON.stringify({ registries: { '@youj': 'https://www.youj.dev/r/{name}.json' } }))
    expect(format(addCommand(root, ['illustration-coffee'], [], {}))).toBe('pnpm dlx shadcn@4.21.0 add @youj/illustration-coffee')
    expect(format(addCommand(fixture('vite'), ['illustration-coffee', 'illustration-deploy'], [], {}))).toBe(
      `bunx shadcn@4.21.0 add https://www.youj.dev/r/v${VERSION}/illustration-coffee.json https://www.youj.dev/r/v${VERSION}/illustration-deploy.json`,
    )
  })

  it('comes from @youj/illustrations in an app on the packages: installs it and adds its stylesheet after the tokens', () => {
    const root = fixture('next-app')
    const pkg = JSON.parse(read(root, 'package.json'))
    pkg.dependencies = { ...pkg.dependencies, '@youj/react': '^0.1.0', '@youj/core': '^0.1.0' }
    write(root, 'package.json', JSON.stringify(pkg, null, 2))
    const plan = addPlan(root, ['illustration-coffee', 'iso-shapes'], [], {})
    expect(plan.fromPackage).toEqual([{ item: 'illustration-coffee', entry: '@youj/illustrations' }])
    // The kit and the shapes beside it are copied: the illustration builder's code imports them from there.
    expect(plan.copyIn).toEqual(['iso-shapes'])
    expect(plan.copy).toBeUndefined()
    expect(plan.packages).toEqual(['@youj/illustrations'])
    expect(plan.install && format(plan.install)).toMatch(/ add @youj\/illustrations@\^0\.1\.0$/)
    expect(plan.css).toEqual(['@youj/react/styles.css', '@youj/illustrations/styles.css'])
    write(root, 'app/globals.css', "@import 'tailwindcss';\n@import '@youj/react/styles.css';\n\nbody {}\n")
    wirePackageStyles(root, plan.css)
    expect(read(root, 'app/globals.css')).toBe("@import 'tailwindcss';\n@import '@youj/react/styles.css';\n@import '@youj/illustrations/styles.css';\n\nbody {}\n")
  })

  it('names each loader by its own entry in an app on the packages, the kit by the main one', () => {
    const root = fixture('next-app')
    const pkg = JSON.parse(read(root, 'package.json'))
    write(root, 'package.json', JSON.stringify({ ...pkg, dependencies: { ...pkg.dependencies, '@youj/react': '^0.1.0', '@youj/core': '^0.1.0' } }, null, 2))
    expect(addPlan(root, ['loader-tittle', 'loader-kit'], [], {}).fromPackage).toEqual([
      { item: 'loader-tittle', entry: '@youj/loaders/tittle' },
      { item: 'loader-kit', entry: '@youj/loaders' },
    ])
  })

  it('copies it in an app on the registry, where the kit is source too', () => {
    const root = fixture('vite')
    const plan = addPlan(root, ['illustration-coffee'], [], {})
    expect(plan.fromPackage).toEqual([])
    expect(plan.copy && format(plan.copy)).toBe(`bunx shadcn@4.21.0 add https://www.youj.dev/r/v${VERSION}/illustration-coffee.json`)
  })

  it('knows which package ships every icon, illustration and loader item', () => {
    const fragments = (pkg: string) =>
      readdirSync(join(import.meta.dirname, `../../${pkg}/registry`))
        .filter((f) => f.endsWith('.json'))
        .flatMap((f) => (JSON.parse(readFileSync(join(import.meta.dirname, `../../${pkg}/registry`, f), 'utf8')) as { name: string }[]).map((i) => i.name))
    for (const name of fragments('icons')) expect(sourcePackageOf(name), name).toBe('@youj/icons')
    for (const name of fragments('illustrations')) expect(sourcePackageOf(name), name).toBe('@youj/illustrations')
    for (const name of fragments('loaders')) expect(sourcePackageOf(name), name).toBe('@youj/loaders')
    for (const name of [...fragments('core'), ...fragments('motion'), ...fragments('ui'), ...fragments('sound')]) expect(sourcePackageOf(name), name).toBeUndefined()
  })

  it('has an item for each scene, one file each, on the kit they share', () => {
    const scenes = items.filter((i) => i.name !== 'illustration-kit')
    expect(scenes.length).toBeGreaterThanOrEqual(52)
    expect(scenes.map((i) => i.name)).toContain('illustration-coffee')
    for (const item of scenes) {
      expect(item.files).toHaveLength(1)
      expect(item.registryDependencies).toContain('illustration-kit')
    }
  })
})

describe('add, after shadcn has copied the items in', () => {
  it('puts back an import shadcn pointed at a same-named file', async () => {
    const root = fixture('next-app')
    const target = 'blocks/app/analytics-overview/kpis.tsx'
    const content = "import { KPIS } from '@/blocks/app/analytics-overview/data'\nimport { Table } from '@/components/ui/data-table'\n"
    const dir = mkdtempSync(join(tmpdir(), 'youj-registry-'))
    writeFileSync(join(dir, 'app-analytics-overview.json'), JSON.stringify({ files: [{ path: `src/${target}`, target, content }] }))
    // As a registry built before its imports were pinned gets installed beside the shell.
    write(root, target, content.replace('analytics-overview/data', 'shell/data'))
    const runner = fakeRunner(root)
    await add(root, ['app-analytics-overview'], [], runner, silentUi(), { YOUJ_REGISTRY_URL: `${pathToFileURL(dir).href}/{name}.json` })
    expect(runner.commands).toHaveLength(1)
    expect(read(root, target)).toBe(content)
    rmSync(dir, { recursive: true })
  })
})

describe('add sound', () => {
  /** The vite fixture after `init`: the provider around <App />, on the packages unless `registry`. */
  function app({ registry = false } = {}) {
    const root = fixture('vite')
    const pkg = JSON.parse(read(root, 'package.json'))
    pkg.dependencies = { ...pkg.dependencies, '@youj/core': '^0.1.0' }
    write(root, 'package.json', JSON.stringify(pkg, null, 2))
    if (registry) {
      write(root, 'components.json', JSON.stringify({ registries: { '@youj': 'https://www.youj.dev/r/{name}.json' } }))
      const project = new Project(root)
      setupViteAlias(project, [])
      project.commit()
    }
    const from = registry ? './lib/youj/provider' : '@youj/core'
    write(
      root,
      'src/main.tsx',
      `import { StrictMode } from 'react'\nimport { createRoot } from 'react-dom/client'\nimport { YoujProvider } from '${from}'\nimport App from './App.tsx'\n\ncreateRoot(document.getElementById('root')!).render(\n  <StrictMode>\n    <YoujProvider>\n      <App />\n    </YoujProvider>\n  </StrictMode>,\n)\n`,
    )
    return root
  }

  it('installs the package, even on motion alone, and gives YoujProvider sound={beacon}', async () => {
    const root = app()
    const runner = fakeRunner(root)
    await add(root, ['sound'], [], runner, silentUi(), {})
    expect(runner.commands).toEqual([`bun add @youj/sound@^${VERSION}`])
    const main = read(root, 'src/main.tsx')
    expect(main).toContain("import { beacon } from '@youj/sound'")
    expect(main).toContain('<YoujProvider sound={beacon}>\n      <App />\n    </YoujProvider>')
  })

  it('changes nothing when run again', async () => {
    const root = app()
    await add(root, ['sound'], [], fakeRunner(root), silentUi(), {})
    const before = read(root, 'src/main.tsx')
    const runner = fakeRunner(root)
    await add(root, ['sound'], [], runner, silentUi(), {})
    expect(runner.commands).toEqual([])
    expect(read(root, 'src/main.tsx')).toBe(before)
  })

  it('copies the source in an app on the registry and imports it from beside the core', async () => {
    const root = app({ registry: true })
    const runner = fakeRunner(root)
    await add(root, ['sound'], [], runner, silentUi(), {})
    expect(runner.commands).toEqual(['bunx shadcn@4.21.0 add @youj/sound --yes --overwrite'])
    expect(read(root, 'src/main.tsx')).toContain("import { beacon } from '@/lib/youj/sound'")
  })

  it('on the App Router, gives the pack from a client Providers file, not the server layout', async () => {
    const root = fixture('next-app')
    const pkg = JSON.parse(read(root, 'package.json'))
    write(root, 'package.json', JSON.stringify({ ...pkg, dependencies: { ...pkg.dependencies, '@youj/core': '^0.1.0' } }, null, 2))
    const layout = read(root, 'app/layout.tsx')
      .replace('import "./globals.css";', 'import { YoujProvider, basalt } from "@youj/core";\nimport "./globals.css";')
      .replace('{children}</body>', '<YoujProvider theme={basalt}>{children}</YoujProvider></body>')
    write(root, 'app/layout.tsx', layout)
    await add(root, ['sound'], [], fakeRunner(root), silentUi(), {})
    const providers = read(root, 'app/providers.tsx')
    expect(providers).toMatch(/^["']use client/)
    expect(providers).toContain('<YoujProvider sound={beacon} {...props} />')
    expect(providers).toContain('from "@youj/sound"')
    const after = read(root, 'app/layout.tsx')
    expect(after).not.toContain('sound={beacon}')
    expect(after).toContain('<Providers theme={basalt}>{children}</Providers>')
    expect(after).toContain('import { basalt } from "@youj/core"')
    expect(after).toContain('import { Providers } from "./providers"')
    // again: nothing more to do
    await add(root, ['sound'], [], fakeRunner(root), silentUi(), {})
    expect(read(root, 'app/layout.tsx')).toBe(after)
    expect(read(root, 'app/providers.tsx')).toBe(providers)
  })

  it('is left alone by a later init, which finds the provider in providers.tsx and wraps no second one', async () => {
    const root = fixture('next-app')
    await init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})
    await add(root, ['sound'], [], fakeRunner(root), silentUi(), {})
    expect(read(root, 'app/providers.tsx')).toContain('<YoujProvider sound={beacon} {...props} />')
    const layout = read(root, 'app/layout.tsx')
    expect(layout).not.toContain('<YoujProvider')
    const again = await init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})
    expect(again.changes).toEqual([])
    expect(read(root, 'app/layout.tsx')).toBe(layout)
  })

  it('says what to do by hand when there is no provider to find', async () => {
    const root = fixture('vite')
    const pkg = JSON.parse(read(root, 'package.json'))
    write(root, 'package.json', JSON.stringify({ ...pkg, dependencies: { ...pkg.dependencies, '@youj/react': '^0.1.0' } }, null, 2))
    const ui = silentUi()
    await add(root, ['sound'], [], fakeRunner(root), ui, {})
    expect(ui.log.join('\n')).toContain("warn: Give <YoujProvider> a pack: <YoujProvider sound={beacon}>, with import { beacon } from '@youj/sound'.")
  })
})

/** Fakes what an install leaves in node_modules. */
function installed(root: string, versions: Record<string, string>, at = 'node_modules') {
  for (const [name, version] of Object.entries(versions)) write(root, `${at}/${name}/package.json`, JSON.stringify({ name, version }))
}

describe('doctor', () => {
  it('says to run init in an app without Youj', () => {
    const checks = doctor(fixture('next-app'), {})
    expect(checks.at(-1)).toMatchObject({ level: 'error', fix: 'npx @youj/cli init' })
  })

  it('passes an app init set up', async () => {
    const root = fixture('next-app')
    await init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})
    installed(root, { react: '19.2.0', tailwindcss: '4.1.13', motion: '13.4.4', '@base-ui/react': '1.9.0', '@youj/react': '0.1.0', '@youj/core': '0.1.0', '@youj/motion': '0.1.0', '@youj/icons': '0.1.0' })
    write(root, 'node_modules/@youj/react/dist/styles.css', "@import '@youj/core/styles.css';\n@source './';\n")
    const checks = doctor(root, {})
    expect(checks.filter((c) => c.level !== 'ok')).toEqual([])
    expect(checks.map((c) => c.message)).toContain('YoujProvider in app/layout.tsx')
  })

  it('passes React 19 and flags React before it', async () => {
    const root = fixture('next-app')
    await init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})
    installed(root, { react: '19.2.0', tailwindcss: '4.1.13', motion: '13.4.4', '@base-ui/react': '1.9.0', '@youj/react': '0.1.0', '@youj/core': '0.1.0', '@youj/motion': '0.1.0', '@youj/icons': '0.1.0' })
    write(root, 'node_modules/@youj/react/dist/styles.css', "@import '@youj/core/styles.css';\n@source './';\n")
    expect(doctor(root, {}).filter((c) => c.level !== 'ok')).toEqual([])
    installed(root, { react: '18.3.1' })
    expect(doctor(root, {}).filter((c) => c.level === 'error')).toEqual([
      expect.objectContaining({ message: 'React 18.3.1: Youj needs React 19', fix: expect.stringContaining('react@^19') }),
    ])
  })

  it('passes a registry app, ignoring imports the copied stylesheets mention in comments', async () => {
    const root = fixture('next-app')
    await init({ cwd: root, yes: true, mode: 'registry' }, fakeRunner(root), silentUi(), {})
    const checks = doctor(root, {})
    expect(checks.filter((c) => c.level !== 'ok')).toEqual([])
    expect(checks.map((c) => c.message)).toContain("app/globals.css imports Tailwind, then Youj's tokens")
  })

  it('passes a registry app on the Pages Router, whose stylesheet imports the copied sheets from beside it', async () => {
    const root = fixture('next-pages')
    await init({ cwd: root, yes: true, mode: 'registry' }, fakeRunner(root), silentUi(), {})
    expect(read(root, 'src/styles/globals.css')).toContain('@import "./youj.css";')
    const checks = doctor(root, {})
    expect(checks.filter((c) => c.level !== 'ok')).toEqual([])
    expect(checks.map((c) => c.message)).toContain("src/styles/globals.css imports Tailwind, then Youj's tokens")
    expect(unwired(new Project(root))).toBeNull()
  })

  it('still flags a stylesheet that imports neither of the copied sheets, and one that imports ui.css before youj.css', async () => {
    const root = fixture('next-pages')
    await init({ cwd: root, yes: true, mode: 'registry' }, fakeRunner(root), silentUi(), {})
    const css = read(root, 'src/styles/globals.css')
    write(root, 'src/styles/globals.css', css.replace('@import "./youj.css";\n', ''))
    expect(doctor(root, {}).filter((c) => c.level === 'error').map((c) => c.message)).toContain("src/styles/globals.css doesn't import the copied youj.css")
    expect(unwired(new Project(root))).toContain("src/styles/globals.css doesn't import the copied youj.css")
    write(root, 'src/styles/globals.css', css.replace('@import "./youj.css";\n@import "./ui.css";', '@import "./ui.css";\n@import "./youj.css";'))
    expect(doctor(root, {}).filter((c) => c.level === 'error').map((c) => c.message)).toContain('The Youj imports in src/styles/globals.css are out of order')
  })

  it('looks for YoujProvider in code, not in a comment that mentions it', async () => {
    const root = fixture('next-app')
    await init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})
    write(root, 'app/providers.tsx', "'use client'\nimport { YoujProvider } from '@youj/core'\nexport function Providers({ children }) {\n  return <YoujProvider>{children}</YoujProvider>\n}\n")
    write(root, 'lib/theme.ts', '// Pass it to <YoujProvider theme={theme}>.\nexport const theme = {}\n')
    write(root, 'app/layout.tsx', 'import { theme } from "@/lib/theme";\nimport { Providers } from "./providers";\n\n// <YoujProvider> lives in Providers\nexport default function Layout({ children }) {\n  return <html><body><Providers>{children}</Providers></body></html>\n}\n')
    expect(doctor(root, {}).map((c) => c.message)).toContain('YoujProvider in app/providers.tsx')
  })

  describe('a setup that stopped partway', () => {
    const unfinished = (checks: ReturnType<typeof doctor>) => checks.find((c) => c.message.includes('sets up neither YoujProvider nor the theme'))

    it('is flagged: the stylesheet imports Youj, and the layout was never edited', async () => {
      const root = fixture('next-app')
      const layout = read(root, 'app/layout.tsx')
      await init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})
      write(root, 'app/layout.tsx', layout)
      expect(unfinished(doctor(root, {}))).toMatchObject({ level: 'warn', message: expect.stringContaining('app/globals.css imports Youj\'s styles, but app/layout.tsx sets up neither'), fix: expect.stringContaining('npx @youj/cli init finishes it') })
    })

    it('is not guessed at in a setup init finished, on any framework or mode', async () => {
      for (const name of ['next-app', 'next-pages', 'vite', 'react-router', 'astro']) {
        for (const mode of ['package', 'registry'] as const) {
          const root = fixture(name)
          await init({ cwd: root, yes: true, mode }, fakeRunner(root), silentUi(), {})
          expect(unfinished(doctor(root, {})), `${name} ${mode}`).toBeUndefined()
        }
      }
    })

    it('is not guessed at where the app sets the theme itself', async () => {
      const root = fixture('next-app')
      const layout = read(root, 'app/layout.tsx')
      await init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})
      write(root, 'app/layout.tsx', layout)
      expect(unfinished(doctor(root, {}))).toBeDefined()
      write(root, 'app/layout.tsx', layout.replace('<html', '<html data-theme="dark"'))
      expect(unfinished(doctor(root, {}))).toBeUndefined()
    })
  })

  it("flags a package's stylesheet that's missing or before the tokens", async () => {
    const root = fixture('next-app')
    await init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})
    const pkg = JSON.parse(read(root, 'package.json'))
    pkg.dependencies = { ...pkg.dependencies, '@youj/illustrations': '^0.1.0' }
    write(root, 'package.json', JSON.stringify(pkg, null, 2))
    installed(root, { react: '19.2.0', tailwindcss: '4.1.13', motion: '13.4.4', '@base-ui/react': '1.9.0', '@youj/react': '0.1.0', '@youj/core': '0.1.0', '@youj/motion': '0.1.0', '@youj/icons': '0.1.0', '@youj/illustrations': '0.1.0' })
    const errors = () => doctor(root, {}).filter((c) => c.level === 'error')
    expect(errors()).toEqual([expect.objectContaining({ message: "app/globals.css doesn't import @youj/illustrations/styles.css" })])
    write(root, 'app/globals.css', "@import 'tailwindcss';\n@import '@youj/illustrations/styles.css';\n@import '@youj/react/styles.css';\n")
    expect(errors()).toEqual([expect.objectContaining({ message: 'The Youj imports in app/globals.css are out of order' })])
    write(root, 'app/globals.css', "@import 'tailwindcss';\n@import '@youj/react/styles.css';\n@import '@youj/illustrations/styles.css';\n")
    expect(errors()).toEqual([])
  })

  it('catches styles out of place, mismatched versions and duplicate copies', async () => {
    const root = fixture('next-app')
    await init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})
    installed(root, { react: '19.2.0', tailwindcss: '4.1.13', motion: '13.4.4', '@base-ui/react': '1.9.0', '@youj/react': '0.2.0', '@youj/core': '0.1.0', '@youj/motion': '0.1.0', '@youj/icons': '0.1.0' })
    installed(root, { motion: '12.0.0' }, 'node_modules/@youj/react/node_modules')
    write(root, 'app/globals.css', "@import '@youj/react/styles.css';\n@import 'tailwindcss';\n")
    write(root, 'app/extra.css', "@import '@youj/core/styles.css';\n")
    const problems = doctor(root, {}).filter((c) => c.level === 'error').map((c) => c.message)
    expect(problems).toEqual([
      expect.stringContaining('different versions'),
      expect.stringContaining('2 copies of motion'),
      expect.stringContaining('app/extra.css imports Youj'),
      expect.stringContaining('come before Tailwind'),
    ])
  })
})

describe('codemods', () => {
  it('adds CSS imports after Tailwind, in order, once', () => {
    const once = addCssImports('@import "tailwindcss";\n\nbody {}\n', ['a.css', 'b.css'])
    expect(once).toBe('@import "tailwindcss";\n@import "a.css";\n@import "b.css";\n\nbody {}\n')
    expect(addCssImports(once, ['a.css', 'b.css'])).toBe(once)
    expect(addCssImports('', ['a.css'])).toBe("@import 'tailwindcss';\n@import 'a.css';\n")
  })

  it('wraps single-line and multi-line tag contents', () => {
    expect(wrapTagContents('  <body>{children}</body>', 'body', '<P>', '</P>')).toBe('  <body>\n    <P>{children}</P>\n  </body>')
    expect(wrapTagContents('  <body a={x > 1}>\n    {children}\n  </body>', 'body', '<P>', '</P>')).toBe('  <body a={x > 1}>\n    <P>\n      {children}\n    </P>\n  </body>')
    expect(wrapTagContents('<main />', 'body', '<P>', '</P>')).toBeNull()
  })

  it('wraps an element on its own line or inline', () => {
    expect(wrapElement('  <StrictMode>\n    <App />\n  </StrictMode>', /<App\s*\/>/, '<P>', '</P>')).toBe('  <StrictMode>\n    <P>\n      <App />\n    </P>\n  </StrictMode>')
    expect(wrapElement('return <App />;', /<App\s*\/>/, '<P>', '</P>')).toBe('return <P><App /></P>;')
  })

  it('adds attributes once', () => {
    const html = addTagAttributes('<html lang="en">', 'html', 'data-yj-theme="terminal"', /data-yj-theme/)!
    expect(html).toBe('<html lang="en" data-yj-theme="terminal">')
    expect(addTagAttributes(html, 'html', 'data-yj-theme="terminal"', /data-yj-theme/)).toBe(html)
  })

  it('adds the Tailwind Vite plugin', () => {
    expect(addVitePlugin("import react from '@vitejs/plugin-react'\n\nexport default { plugins: [react()] }\n")).toBe(
      "import react from '@vitejs/plugin-react'\nimport tailwindcss from '@tailwindcss/vite'\n\nexport default { plugins: [tailwindcss(), react()] }\n",
    )
    expect(addVitePlugin('export default {}')).toBeNull()
  })

  it('summarises a diff as hunks', () => {
    expect(hunks(diffLines('a\nb\nc\nd\ne\n', 'a\nb\nX\nd\ne\n'))).toEqual(['  b', '- c', '+ X', '  d'])
  })
})

describe('constants stay in sync with the packages', () => {
  const packages = join(import.meta.dirname, '../..')
  it('motion peer range', () => {
    expect(JSON.parse(readFileSync(join(packages, 'ui/package.json'), 'utf8')).peerDependencies.motion).toBe(MOTION_RANGE)
  })
  it('presets and their motion personalities', () => {
    const dir = join(packages, 'core/src/lib/youj/theme/themes')
    // Youj is the docs' internal preset (Basalt's pair), not one the CLI offers.
    const ids = readdirSync(dir).filter((f) => f.endsWith('.css') && f !== 'youj.css').map((f) => f.replace('.css', ''))
    expect([...THEMES].sort()).toEqual(ids.sort())
    // A preset's motion is its style's: the style it composes, as styles.ts defines it.
    const styles = readFileSync(join(dir, '../styles.ts'), 'utf8')
    for (const id of THEMES) {
      const style = readFileSync(join(dir, `${id}.ts`), 'utf8').match(/composeTheme\(\w+, (\w+)Style/)![1]
      const block = styles.slice(styles.indexOf(`export const ${style}Style`))
      expect([id, block.match(/motionPersonality: '(\w+)'/)![1]]).toEqual([id, PRESET_MOTION[id]])
    }
  })
  it('registry URL template: the CLI’s own version by default, the latest alias on request, an override over both', () => {
    expect(registryTemplate({})).toBe(`https://www.youj.dev/r/v${VERSION}/{name}.json`)
    expect(registryTemplate({ YOUJ_REGISTRY_LATEST: '1' })).toBe('https://www.youj.dev/r/{name}.json')
    expect(registryTemplate({ YOUJ_REGISTRY_LATEST: 'false' })).toBe(`https://www.youj.dev/r/v${VERSION}/{name}.json`)
    expect(registryTemplate({ YOUJ_REGISTRY_URL: 'http://localhost:3100/r/' })).toBe('http://localhost:3100/r/{name}.json')
    expect(registryTemplate({ YOUJ_REGISTRY_URL: 'http://localhost:3100/r/', YOUJ_REGISTRY_LATEST: '1' })).toBe('http://localhost:3100/r/{name}.json')
  })
})
