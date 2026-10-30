import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fixture, read } from './helpers'

/* The built CLI, run the way CI and AI agents run it: no terminal (stdin closed),
 * judged by its exit code. A stand-in `npx` on PATH plays shadcn, writing what
 * the scenario says, as the real one does with --overwrite; asked without it, it
 * prints shadcn's prompt and exits 0 with half the files written, which is what
 * the real one did with no one to answer. */

const temp: string[] = []
const tmp = (prefix: string) => {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  temp.push(dir)
  return dir
}
let cli = ''
let bin = ''
let registry = ''

const FAKE_SHADCN = `#!/usr/bin/env node
const { mkdirSync, writeFileSync } = require('node:fs')
const { dirname, join } = require('node:path')
const args = process.argv.slice(2)
const put = (path, content) => { mkdirSync(dirname(join(process.cwd(), path)), { recursive: true }); writeFileSync(join(process.cwd(), path), content) }
if (!args.some((a) => a.startsWith('shadcn@'))) process.exit(0)
const scenario = process.env.FAKE_SHADCN
if (scenario === 'crash' && args.some((a) => /alert-dialog/.test(a))) {
  console.error("error: unknown option '--bogus'")
  process.exit(1)
}
const overwrite = args.includes('--overwrite')
if (args.some((a) => /youj-core/.test(a))) {
  put('styles/youj.css', '/* tokens */\\n')
  if (!overwrite || scenario === 'half') {
    console.log('? The file utils.ts already exists. Would you like to overwrite? › (y/N)')
    process.exit(0)
  }
  put('styles/ui.css', '/* bridge */\\n')
  put('styles/bezel.css', '@layer utilities {}\\n')
  if (args.some((a) => /youj-shadcn-compat/.test(a))) put('styles/shadcn.css', '/* shadcn names on roles */\\n')
  put('lib/youj/provider.tsx', "'use client'\\nexport function YoujProvider() {}\\n")
  put('lib/youj/theme/index.ts', 'export {}\\n')
  put('lib/utils.ts', "import { clsx } from 'clsx'\\nimport { extendTailwindMerge } from 'tailwind-merge'\\n// youj's cn\\nexport function cn() {}\\nexport function formatBytes() {}\\n")
}
if (args.some((a) => /alert-dialog/.test(a))) {
  put('components/ui/dialog.tsx', "import { useYouj } from '@/lib/youj/provider'\\nexport function Dialog() {}\\nexport const dialogPopupClass = ''\\n")
  put('components/ui/alert-dialog.tsx', "import { Dialog, dialogPopupClass } from '@/components/ui/dialog'\\n// youj\\nexport function AlertDialog() {}\\n")
}
`

beforeAll(() => {
  // Built inside the package, so the bundle resolves its one dependency (@clack/prompts) as the published one does.
  const pkg = join(import.meta.dirname, '..')
  mkdirSync(join(pkg, 'node_modules/.tmp'), { recursive: true })
  const dist = mkdtempSync(join(pkg, 'node_modules/.tmp/cli-'))
  temp.push(dist)
  execFileSync('pnpm', ['exec', 'tsdown', '-d', dist], { cwd: pkg, stdio: 'ignore' })
  cli = join(dist, 'cli.mjs')
  bin = tmp('youj-fake-bin-')
  writeFileSync(join(bin, 'npx'), FAKE_SHADCN)
  // Installs succeed and do nothing: what's installed isn't what these tests are about.
  writeFileSync(join(bin, 'npm'), '#!/bin/sh\nexit 0\n')
  for (const name of ['npx', 'npm']) chmodSync(join(bin, name), 0o755)
  // The items the CLI fetches itself (it hands shadcn local copies of a registry of your own).
  registry = tmp('youj-registry-')
  for (const name of ['youj-core', 'youj-ui-core', 'youj-look-bezel', 'youj-shadcn-compat', 'alert-dialog']) writeFileSync(join(registry, `${name}.json`), JSON.stringify({ name, type: 'registry:ui', files: [] }))
}, 60_000)

describe('the repo build', () => {
  // `node dist/cli.mjs` is what people try from a checkout; an old build once ran old behaviour next to new sources.
  it('is not older than the sources, when there is one', () => {
    const pkg = join(import.meta.dirname, '..')
    const built = join(pkg, 'dist/cli.mjs')
    if (!existsSync(built)) return
    const newest = Math.max(...[...readdirSync(join(pkg, 'src')).map((f) => join(pkg, 'src', f)), join(pkg, 'package.json')].map((f) => statSync(f).mtimeMs))
    expect(statSync(built).mtimeMs, 'dist/cli.mjs is older than src/: run `pnpm -F @youj/cli build` (or `pnpm -F @youj/cli verify`, which builds first)').toBeGreaterThanOrEqual(newest)
  })
})

afterAll(() => {
  for (const dir of temp.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function youj(root: string, args: string[], scenario = 'full', cwdFlag = '--cwd') {
  const result = spawnSync(process.execPath, [cli, ...args, cwdFlag, root], {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, FAKE_SHADCN: scenario, NO_COLOR: '1', YOUJ_REGISTRY_URL: `${pathToFileURL(registry).href}/{name}.json` },
  })
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

describe('youj without a terminal', () => {
  it('init --mode registry exits 1, and points nothing at a core that copied halfway', () => {
    const root = fixture('shadcn')
    const css = read(root, 'app/globals.css')
    const { status, output } = youj(root, ['init', '--mode', 'registry', '--yes'], 'half')
    expect(status).toBe(1)
    expect(output).toMatch(/The core didn't copy completely \(missing: styles\/ui\.css/)
    expect(output).not.toMatch(/Done\./)
    expect(read(root, 'app/globals.css')).toBe(css)
  })

  it('init --mode registry finishes, merges lib/utils.ts and exits 0', () => {
    const root = fixture('shadcn')
    const { status, output } = youj(root, ['init', '--mode', 'registry'])
    expect(output).toContain('Done.')
    expect(output).toContain('npx @youj/cli add button dialog input label --overwrite')
    expect(status).toBe(0)
    expect(read(root, 'app/globals.css')).toContain('../styles/ui.css')
    expect(read(root, 'app/globals.css')).not.toContain('@custom-variant dark')
  })

  it('add exits 1 when Youj’s code needs a file of yours replaced, and 0 with --overwrite', () => {
    const root = fixture('shadcn')
    expect(youj(root, ['init', '--mode', 'registry']).status).toBe(0)
    const kept = youj(root, ['add', 'alert-dialog'])
    expect(kept.status).toBe(1)
    expect(kept.output).toContain('npx @youj/cli add alert-dialog --overwrite')
    expect(read(root, 'components/ui/dialog.tsx')).toContain('@radix-ui/react-dialog')
    const replaced = youj(root, ['add', 'alert-dialog', '--overwrite'])
    expect(replaced.status).toBe(0)
    expect(read(root, 'components/ui/dialog.tsx')).toContain('dialogPopupClass')
  })

  it.each(['--overwrite', '-o'])('create %s previews replacing an existing theme and shell', (flag) => {
    const root = fixture('next-app')
    mkdirSync(join(root, 'lib'), { recursive: true })
    mkdirSync(join(root, 'components'), { recursive: true })
    writeFileSync(join(root, 'lib/theme.ts'), '// My theme\n')
    writeFileSync(join(root, 'components/app-shell.tsx'), '// My shell\n')
    const link = 'https://www.youj.dev/create?preset=basalt'
    const kept = youj(root, ['create', link, '--dry-run'])
    expect(kept.status).toBe(0)
    expect(kept.output).toContain('Pass --overwrite to replace it.')
    const replaced = youj(root, ['create', link, flag, '--dry-run'])
    expect(replaced.status, replaced.output).toBe(0)
    expect(replaced.output).not.toContain('Pass --overwrite to replace it.')
    expect(replaced.output).toContain('lib/theme.ts')
    expect(replaced.output).toContain('components/app-shell.tsx')
    expect(read(root, 'lib/theme.ts')).toBe('// My theme\n')
    expect(read(root, 'components/app-shell.tsx')).toBe('// My shell\n')
  })

  it('add --help lists the options add takes, and only add\'s command', () => {
    const { status, output } = youj(fixture('shadcn'), ['add', '--help'])
    expect(status).toBe(0)
    for (const flag of ['--path', '--dry-run', '--diff', '--view', '--overwrite']) expect(output).toContain(flag)
    expect(output).not.toContain('npx @youj/cli init')
  })

  it('says a command that fails in a line, not as a stack', () => {
    const root = fixture('shadcn')
    expect(youj(root, ['init', '--mode', 'registry']).status).toBe(0)
    const { status, output } = youj(root, ['add', 'alert-dialog', '--overwrite'], 'crash')
    expect(status).toBe(1)
    expect(output).toContain('exited with')
    expect(output).not.toMatch(/\n\s+at /)
  })

  describe('an option it does not take', () => {
    it('stops init before it writes anything: --dryrun is not a dry run', () => {
      const root = fixture('next-app')
      const layout = read(root, 'app/layout.tsx')
      const { status, output } = youj(root, ['init', '--yes', '--dryrun'])
      expect(status).toBe(1)
      expect(output).toContain('Unknown option --dryrun: did you mean --dry-run?')
      expect(read(root, 'app/layout.tsx')).toBe(layout)
      expect(existsSync(join(root, 'components.json'))).toBe(false)
      // Spelled right, it previews and writes nothing.
      const preview = youj(root, ['init', '--yes', '--dry-run'])
      expect(preview.status).toBe(0)
      expect(read(root, 'app/layout.tsx')).toBe(layout)
    })

    it('stops add on a misspelled option instead of handing it to shadcn, or ignoring it', () => {
      const root = fixture('shadcn')
      expect(youj(root, ['init', '--mode', 'registry']).status).toBe(0)
      const dialog = read(root, 'components/ui/dialog.tsx')
      const { status, output } = youj(root, ['add', 'alert-dialog', '--overwite'])
      expect(status).toBe(1)
      expect(output).toContain('Unknown option --overwite: did you mean --overwrite?')
      expect(read(root, 'components/ui/dialog.tsx')).toBe(dialog)
    })

    it('says so for an option another command takes, without a guess', () => {
      const { status, output } = youj(fixture('next-app'), ['doctor', '--theme', 'brutal'])
      expect(status).toBe(1)
      expect(output).toContain('Unknown option --theme.')
      expect(output).toContain('npx @youj/cli doctor --help lists the options.')
    })

    it('still lets add pass shadcn its own options, and takes -c for --cwd', () => {
      const root = fixture('shadcn')
      expect(youj(root, ['init', '--mode', 'registry']).status).toBe(0)
      const replaced = youj(root, ['add', 'alert-dialog', '-o', '--silent'], 'full', '-c')
      expect(replaced.output).not.toContain('Unknown option')
      expect(replaced.status).toBe(0)
      expect(read(root, 'components/ui/dialog.tsx')).toContain('dialogPopupClass')
    })

    it('needs --cwd to name a folder that is there', () => {
      const missing = youj(join(tmpdir(), 'youj-no-such-folder'), ['add', 'button'])
      expect(missing.status).toBe(1)
      expect(missing.output).toMatch(/--cwd names .*youj-no-such-folder, which isn't a folder/)
      expect(missing.output).not.toContain('ENOENT')
      const bare = spawnSync(process.execPath, [cli, 'add', 'button', '--cwd'], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } })
      expect(bare.status).toBe(1)
      expect(bare.stdout + bare.stderr).toContain('--cwd takes a folder')
    })
  })

  describe('where there is no app', () => {
    it('refuses a folder without a package.json, as the other commands do, and writes nothing', () => {
      const root = tmp('youj-empty-')
      const { status, output } = youj(root, ['add', 'button'])
      expect(status).toBe(1)
      expect(output).toContain('No package.json in')
      expect(output).toContain('(or pass --cwd)')
      expect(readdirSync(root)).toEqual([])
    })

    it('points a workspace root at its app with --cwd, and writes nothing', () => {
      const root = tmp('youj-workspace-')
      mkdirSync(join(root, 'apps/web'), { recursive: true })
      mkdirSync(join(root, 'packages/ui'), { recursive: true })
      writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'repo', private: true, workspaces: ['apps/*', 'packages/*'] }))
      writeFileSync(join(root, 'apps/web/package.json'), JSON.stringify({ name: 'web', dependencies: { next: '16.0.0', react: '19.2.0' } }))
      writeFileSync(join(root, 'packages/ui/package.json'), JSON.stringify({ name: 'ui', dependencies: { clsx: '2.0.0' } }))
      for (const command of [['add', 'button'], ['init'], ['create', 'https://www.youj.dev/create?preset=basalt'], ['doctor']]) {
        const { status, output } = youj(root, command)
        expect(status, command.join(' ')).toBe(1)
        expect(output).toContain('is the root of a workspace, not an app')
        expect(output).toContain(`npx @youj/cli ${command[0] === 'create' ? `create '${command[1]}'` : command.join(' ')} --cwd apps/web`)
        expect(output).not.toContain('Couldn’t tell which framework')
        expect(output).not.toMatch(/React isn’t installed|react@\^19|react-dom@\^19/)
      }
      expect(readdirSync(root).sort()).toEqual(['apps', 'package.json', 'packages'])
      // From the app itself it is not a workspace root, whatever the repo around it is.
      expect(youj(join(root, 'apps/web'), ['add', 'button'], 'full').output).not.toContain('workspace')
    })

    it('refuses React 18 before it copies anything', () => {
      const root = fixture('next-app')
      const pkg = JSON.parse(read(root, 'package.json'))
      writeFileSync(join(root, 'package.json'), JSON.stringify({ ...pkg, dependencies: { ...pkg.dependencies, react: '18.3.1', 'react-dom': '18.3.1' } }))
      for (const flags of [[], ['--dry-run']]) {
        const { status, output } = youj(root, ['add', 'button', ...flags])
        expect(status, flags.join(' ')).toBe(1)
        expect(output).toContain('React 18.3.1: Youj needs React 19. Upgrade React first.')
      }
      expect(readdirSync(root).sort()).toEqual(['app', 'package.json', 'pnpm-lock.yaml', 'postcss.config.mjs', 'tsconfig.json'])
    })
  })

  it('init in a Vite app ends with the hint for Vite, not next-themes', () => {
    const root = fixture('create-vite')
    const { status, output } = youj(root, ['init', '--yes'])
    expect(status).toBe(0)
    expect(output).toContain('Add <ThemeToggle /> from @youj/react to let them switch')
    expect(output).not.toContain('next-themes')
    // From source there's no @youj/react to import it from.
    const source = youj(fixture('create-vite'), ['init', '--yes', '--mode', 'registry', '--look', 'classic'])
    expect(source.output).toContain('Add a ThemeToggle (npx @youj/cli add theme-toggle) to let them switch')
  })
})
