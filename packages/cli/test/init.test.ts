import { chmodSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { init, type InitOptions } from '../src/init'
import { Project } from '../src/project'
import type { Command, Runner } from '../src/run'
import { themeScriptCode } from '../../core/src/lib/youj/theme-script'
import { silentUi, CliError } from '../src/ui'
import { fakeRunner, fixture, read, write } from './helpers'

const GEIST = "@import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap');"

async function setup(name: string, options: Partial<InitOptions> = {}, env: NodeJS.ProcessEnv = {}) {
  const root = fixture(name)
  const runner = fakeRunner(root)
  const result = await init({ cwd: root, yes: true, ...options }, runner, silentUi(), env)
  return { root, runner, result, files: Object.fromEntries(result.changes.map((c) => [c.path, c.after])) }
}

describe('init, package mode', () => {
  it('installs no optional peer of @youj/react: nothing it sets up needs one', async () => {
    const { peerDependenciesMeta } = JSON.parse(readFileSync(join(import.meta.dirname, '../../ui/package.json'), 'utf8'))
    const { runner } = await setup('next-app')
    const installed = runner.commands.flatMap((c) => c.split(' ')).map((spec) => spec.replace(/(.)@.*$/, '$1'))
    expect(Object.keys(peerDependenciesMeta).filter((peer) => installed.includes(peer))).toEqual([])
    expect(installed).toContain('@youj/react')
  })

  for (const name of ['next-app', 'next-pages', 'vite', 'react-router', 'astro']) {
    it(`sets up ${name}, and a re-run changes nothing`, async () => {
      const { root, runner, result, files } = await setup(name)
      expect({ packageManager: result.packageManager, commands: runner.commands, manual: result.manual }).toMatchSnapshot('plan')
      for (const [path, content] of Object.entries(files)) {
        if (path === 'package.json') continue
        expect(content).toMatchSnapshot(path)
      }

      const again = fakeRunner(root)
      const second = await init({ cwd: root, yes: true }, again, silentUi(), {})
      expect(second.changes).toEqual([])
      expect(again.commands).toEqual([])
    })
  }

  it('themes Next with a preset, a custom motion personality and quality', async () => {
    const { files } = await setup('next-app', { theme: 'brutal', motion: 'lively', quality: 'low' })
    expect(files['app/layout.tsx']).toMatchSnapshot()
  })

  it('keeps the preset’s own motion without declaring a custom theme', async () => {
    const { files } = await setup('next-app', { theme: 'brutal' })
    expect(files['app/layout.tsx']).toContain('      {...themeProps(brutal)}\n')
    expect(files['app/layout.tsx']).toContain("import { YoujProvider, brutal, themeProps } from \"@youj/core\";")
    expect(files['app/layout.tsx']).not.toContain('defineTheme')
  })

  it('points the @youj scope at YOUJ_NPM_REGISTRY', async () => {
    const { files } = await setup('next-app', {}, { YOUJ_NPM_REGISTRY: 'http://localhost:4873/' })
    expect(files['.npmrc']).toBe('@youj:registry=http://localhost:4873/\n')
  })

  it('adds the one line after an existing three-line setup', async () => {
    const root = fixture('next-app')
    write(root, 'app/globals.css', "@import 'tailwindcss';\n@import '@youj/core/styles.css';\n")
    await init({ cwd: root, yes: true, theme: 'graphite' }, fakeRunner(root), silentUi(), {})
    expect(read(root, 'app/globals.css')).toBe("@import 'tailwindcss';\n@import '@youj/core/styles.css';\n@import '@youj/react/styles.css';\n")
  })

  it('loads Basalt’s faces through @fontsource, once: nothing from Google’s stylesheet', async () => {
    const { root, files } = await setup('react-router')
    expect(files['app/app.css']).not.toContain('fonts.googleapis.com')
    expect(files['app/root.tsx']!.match(/@fontsource/g)).toHaveLength(2)
    await init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})
    expect(read(root, 'app/root.tsx').match(/@fontsource/g)).toHaveLength(2)
  })

  it('on the App Router, loads no Google faces for Basalt, drops the starter’s theme, and a re-run changes nothing', async () => {
    const { root, files } = await setup('next-app')
    expect(files['app/globals.css']).not.toContain('fonts.googleapis.com')
    // create-next-app's colours, Geist-only @theme and body rule would hide the theme's faces and surfaces; no shadcn sheet is needed without them.
    expect(files['app/globals.css']).toBe('@import "tailwindcss";\n@import "@youj/react/styles.css";\n')
    expect(files['lib/fonts.ts']).toBeUndefined()
    const again = await init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})
    expect(again.changes).toEqual([])
    expect(read(root, 'app/globals.css')).toBe(files['app/globals.css'])
  })

  it('on the App Router without the starter’s next/font, still writes no lib/fonts.ts: Basalt’s faces come from @fontsource', async () => {
    const root = fixture('next-app')
    const layout = read(root, 'app/layout.tsx')
      .replace(/^import \{ Geist, Geist_Mono \} from "next\/font\/google";\n/m, '')
      .replace(/const geist(Sans|Mono) = [^;]*;\n/g, '')
      .replace('${geistSans.variable} ${geistMono.variable} ', '')
    write(root, 'app/layout.tsx', layout)
    const result = await init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})
    expect(result.manual).toEqual([])
    expect(read(root, 'app/globals.css')).not.toContain('fonts.googleapis.com')
    expect(existsSync(join(root, 'lib/fonts.ts'))).toBe(false)
    expect(read(root, 'app/layout.tsx')).toContain('import "@fontsource-variable/inter";')
  })

  it('on Next.js before 15 too, loads nothing from Google’s stylesheet for Basalt', async () => {
    const root = fixture('next-app')
    const pkg = JSON.parse(read(root, 'package.json'))
    pkg.dependencies.next = '14.2.15'
    write(root, 'package.json', JSON.stringify(pkg))
    await init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})
    expect(read(root, 'app/globals.css')).not.toContain(GEIST)
    expect(read(root, 'app/globals.css')).not.toContain('fonts.googleapis.com')
  })

  it('loads nothing for a preset in the kit’s own faces', async () => {
    for (const theme of ['basalt', 'graphite', 'terminal'] as const) {
      const { files } = await setup('vite', { theme })
      expect(files['src/index.css'], theme).not.toContain('fonts.googleapis.com')
    }
  })

  it('writes and installs nothing on a dry run', async () => {
    const root = fixture('vite')
    const runner = fakeRunner(root)
    const before = read(root, 'src/main.tsx')
    const result = await init({ cwd: root, yes: true, dryRun: true }, runner, silentUi(), {})
    expect(runner.commands).toEqual([])
    expect(result.commands.length).toBeGreaterThan(0)
    expect(result.changes.map((c) => c.path).sort()).toEqual(['index.html', 'src/index.css', 'src/main.tsx', 'vite.config.ts'])
    expect(read(root, 'src/main.tsx')).toBe(before)
  })

  it('refuses Tailwind v3 non-interactively, with the upgrade command', async () => {
    const root = fixture('next-app')
    const pkg = JSON.parse(read(root, 'package.json'))
    pkg.devDependencies.tailwindcss = '^3.4.1'
    write(root, 'package.json', JSON.stringify(pkg))
    await expect(init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})).rejects.toThrow(/@tailwindcss\/upgrade/)
  })

  it('refuses React before 18.3', async () => {
    for (const react of ['^17.0.2', '18.3.1']) {
      const root = fixture('vite')
      const pkg = JSON.parse(read(root, 'package.json'))
      pkg.dependencies.react = react
      write(root, 'package.json', JSON.stringify(pkg))
      const run = init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})
      await expect(run).rejects.toBeInstanceOf(CliError)
      await expect(run).rejects.toThrow(/needs React 19/)
    }
  })

  it('starts in Basalt and classic on <html>, with the early theme script instead of a fixed scheme', async () => {
    const { files } = await setup('vite')
    expect(files['index.html']).toContain('<html lang="en" data-yj-theme="basalt" data-yj-motion="precise" data-yj-look="classic">')
    expect(files['index.html']).toContain(`<head>\n    <script>${themeScriptCode()}</script>`)
    expect(files['src/main.tsx']).toContain('<YoujProvider theme={basalt}>')
  })

  it('leaves the colour scheme to next-themes where the app has it, with a note', async () => {
    const root = fixture('next-app')
    const pkg = JSON.parse(read(root, 'package.json'))
    pkg.dependencies['next-themes'] = '^0.4.6'
    write(root, 'package.json', JSON.stringify(pkg))
    const result = await init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})
    expect(read(root, 'app/layout.tsx')).not.toContain('data-theme=')
    expect(read(root, 'app/layout.tsx')).not.toContain('ThemeScript')
    expect(result.manual).toEqual([expect.stringContaining('attribute="data-theme"')])
  })

  it("doesn't add shadcn's compat sheet to a shadcn-free app, and keeps the starter's rules once the app has made its colours its own", async () => {
    const root = fixture('next-app')
    write(root, 'app/globals.css', read(root, 'app/globals.css').replace('--background: #ffffff;', '--background: #ffffff;\n  --brand: #0a7;'))
    await init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})
    const css = read(root, 'app/globals.css')
    expect(css).toContain('--color-background: var(--background);')
    expect(css).toContain('@import "@youj/react/shadcn.css";')
  })

  it('puts ThemeScript in the head of a server-rendered layout, so ThemeToggle and setThemeMode need nothing else', async () => {
    const { files } = await setup('next-app')
    expect(files['app/layout.tsx']).toContain('import { ThemeScript } from "@youj/react";')
    expect(files['app/layout.tsx']).toContain('    >\n      <head>\n        <ThemeScript />\n      </head>\n      <body')
    expect(files['app/layout.tsx']).not.toContain('data-theme=')
  })

  it('rejects an unknown preset', async () => {
    const root = fixture('vite')
    await expect(init({ cwd: root, yes: true, theme: 'neon' as never }, fakeRunner(root), silentUi(), {})).rejects.toThrow(/--theme takes/)
  })
})

describe.skipIf(process.getuid?.() === 0)('init, when a file it edits is read-only', () => {
  it('stops before it asks or installs anything, naming the file in one line', async () => {
    const root = fixture('next-app')
    const runner = fakeRunner(root)
    const css = read(root, 'app/globals.css')
    chmodSync(join(root, 'app/layout.tsx'), 0o444)
    const run = init({ cwd: root, yes: false, mode: 'package' }, runner, { ...silentUi(), select: async () => { throw new Error('asked') } }, {})
    await expect(run).rejects.toBeInstanceOf(CliError)
    await expect(run).rejects.toThrow("Can't write app/layout.tsx: it is read-only, or its folder is. Make it writable, then run again. Nothing was installed or changed.")
    expect(runner.commands).toEqual([])
    expect(read(root, 'app/globals.css')).toBe(css)
  })

  it('says a write that fails after the check in one line, not as a stack', () => {
    const root = fixture('next-app')
    chmodSync(join(root, 'app/layout.tsx'), 0o444)
    const project = new Project(root)
    const failure = (() => {
      try {
        project.restore('app/layout.tsx', 'export {}\n')
      } catch (error) {
        return error
      }
    })()
    expect(failure).toBeInstanceOf(CliError)
    expect((failure as Error).message).toBe("Couldn't write app/layout.tsx: permission denied. Make it writable, then run again.")
  })

  it('writes none of a batch when one of its files cannot be written', () => {
    const root = fixture('next-app')
    chmodSync(join(root, 'app/layout.tsx'), 0o444)
    const project = new Project(root)
    const layout = read(root, 'app/layout.tsx')
    project.write('app/globals.css', '@import "tailwindcss";\n')
    project.write('app/layout.tsx', `${layout}\n// edited\n`)
    project.write('lib/new.ts', 'export {}\n')
    expect(() => project.commit()).toThrow(/^Can't write app\/layout\.tsx: it is read-only/)
    expect(existsSync(join(root, 'lib/new.ts'))).toBe(false)
    expect(read(root, 'app/globals.css')).not.toBe('@import "tailwindcss";\n')
    expect(read(root, 'app/layout.tsx')).toBe(layout)
  })
})

describe('init, registry mode', () => {
  it('writes components.json, copies the core and imports its tokens; a re-run changes nothing', async () => {
    const { root, runner, result, files } = await setup('next-app', { mode: 'registry', theme: 'brutal' })
    expect(runner.commands).toMatchSnapshot('commands')
    expect(result.manual).toEqual([])
    expect(files['components.json']).toMatchSnapshot('components.json')
    expect(files['app/globals.css']).toMatchSnapshot('app/globals.css')
    expect(files['app/layout.tsx']).toMatchSnapshot('app/layout.tsx')

    const again = fakeRunner(root)
    const second = await init({ cwd: root, yes: true, theme: 'brutal' }, again, silentUi(), {})
    expect(second.mode).toBe('registry')
    expect(second.changes).toEqual([])
    expect(again.commands).toEqual([])
  })

  it('merges the namespace into an existing components.json and follows YOUJ_REGISTRY_URL', async () => {
    const root = fixture('next-app')
    write(root, 'components.json', JSON.stringify({ style: 'new-york', registries: { '@acme': 'https://acme.dev/r/{name}.json' } }))
    await init({ cwd: root, yes: true, mode: 'registry' }, fakeRunner(root), silentUi(), { YOUJ_REGISTRY_URL: 'http://localhost:6199/r' })
    const json = JSON.parse(read(root, 'components.json'))
    expect(json.style).toBe('new-york')
    expect(json.registries).toEqual({ '@acme': 'https://acme.dev/r/{name}.json', '@youj': 'http://localhost:6199/r/{name}.json' })
  })

  describe('when the core does not arrive', () => {
    /** The package manager works; shadcn, which copies the core, doesn't. */
    const noShadcn = (root: string) => {
      const base = fakeRunner(root)
      return (async (command: Command, cwd: string, options?: { inherit?: boolean; capture?: boolean }) => {
        if (command.args.some((a) => a.startsWith('shadcn@'))) throw new Error('network is down')
        return base(command, cwd, options)
      }) as Runner
    }

    it('leaves no components.json: the app is not set up from the registry', async () => {
      const root = fixture('next-app')
      await expect(init({ cwd: root, yes: true, mode: 'registry' }, noShadcn(root), silentUi(), {})).rejects.toThrow(/Copying the core failed/)
      expect(existsSync(join(root, 'components.json'))).toBe(false)
    })

    it('puts back the components.json the app had', async () => {
      const root = fixture('next-app')
      const own = JSON.stringify({ style: 'new-york', registries: { '@acme': 'https://acme.dev/r/{name}.json' } }, null, 2) + '\n'
      write(root, 'components.json', own)
      await expect(init({ cwd: root, yes: true, mode: 'registry' }, noShadcn(root), silentUi(), {})).rejects.toBeInstanceOf(CliError)
      expect(read(root, 'components.json')).toBe(own)
    })

    it('names the registry it could not reach, and leaves no components.json', async () => {
      vi.stubGlobal('fetch', () => Promise.reject(new TypeError('fetch failed')))
      const root = fixture('next-app')
      await expect(init({ cwd: root, yes: true, mode: 'registry' }, fakeRunner(root), silentUi(), { YOUJ_REGISTRY_URL: 'http://localhost:9/r' })).rejects.toThrow(/Couldn't reach the registry for youj-core \(http:\/\/localhost:9\/r\/youj-core\.json\)/)
      expect(existsSync(join(root, 'components.json'))).toBe(false)
    })

    it('heals on a run once the registry answers', async () => {
      const root = fixture('next-app')
      await expect(init({ cwd: root, yes: true, mode: 'registry' }, noShadcn(root), silentUi(), {})).rejects.toThrow()
      const result = await init({ cwd: root, yes: true, mode: 'registry' }, fakeRunner(root), silentUi(), {})
      expect(result.mode).toBe('registry')
      expect(JSON.parse(read(root, 'components.json')).registries).toHaveProperty('@youj')
    })
  })

  it('imports the preset stylesheet where the theme is an <html> attribute', async () => {
    const { root, files } = await setup('vite', { mode: 'registry', theme: 'brutal' })
    expect(files['src/index.css']).toMatchSnapshot()
    expect(existsSync(join(root, 'src/lib/youj/provider.tsx'))).toBe(true)
    expect(files['src/main.tsx']).toContain("import { YoujProvider } from '@/lib/youj/provider'")
  })

  it("copies the chosen preset's stylesheet as an item of its own where the theme is an <html> attribute", async () => {
    const { root, runner } = await setup('vite', { mode: 'registry', theme: 'brutal' })
    expect(runner.commands.find((c) => c.includes('shadcn@'))).toContain('@youj/youj-core @youj/youj-ui-core')
    expect(runner.commands.find((c) => c.includes('shadcn@'))).toContain('@youj/youj-theme-brutal')
    expect(existsSync(join(root, 'src/lib/youj/theme/themes/brutal.css'))).toBe(true)
  })

  it("copies no theme item for a preset the core holds the stylesheet of, or where the theme isn't an attribute", async () => {
    for (const [name, theme] of [['vite', 'basalt'], ['vite', 'graphite'], ['next-app', 'brutal']] as const) {
      const { runner } = await setup(name, { mode: 'registry', theme })
      expect(runner.commands.join('\n'), `${name} ${theme}`).not.toContain('youj-theme-')
    }
  })
})
