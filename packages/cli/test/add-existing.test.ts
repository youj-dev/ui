import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { setupViteAlias } from '../src/alias'
import { add } from '../src/add'
import { otherOutput } from '../src/copy'
import { Project } from '../src/project'
import { format, type Command, type Runner } from '../src/run'
import { silentUi } from '../src/ui'
import { fixture, read, write } from './helpers'

const MORPH_REGISTRY = "export function MorphLabel() {\n  return null\n}\n"
const MORPH_INSTALLED = `'use client'\n\n${MORPH_REGISTRY}`
const BUTTON = 'export const Button = 1\n'

/** A Vite app on the registry, with `@/` set up, and morph-label.tsx installed by an earlier item. */
function app() {
  const root = fixture('vite')
  write(root, 'components.json', JSON.stringify({ aliases: { components: '@/components' }, registries: { '@youj': 'https://www.youj.dev/r/{name}.json' } }))
  const project = new Project(root)
  setupViteAlias(project, [])
  project.commit()
  write(root, 'src/components/ui/morph-label.tsx', MORPH_INSTALLED)
  return root
}

/**
 * Stands in for `shadcn add`: like the real one it writes what it's told to (with
 * --overwrite, over what's there), strips the 'use client' line (rsc: false), and prints
 * the Created/Skipped lists. It fails if it would have to ask, as a script without a terminal.
 */
function shadcn(root: string, files: Record<string, string>) {
  const runs: { command: string; captured: boolean; inherited: boolean }[] = []
  const runner = (async (command: Command, _cwd: string, options: { inherit?: boolean; capture?: boolean } = {}) => {
    runs.push({ command: format(command), captured: Boolean(options.capture), inherited: Boolean(options.inherit) })
    if (command.args.includes('--dry-run') || command.args.includes('--diff')) return ''
    const overwrite = command.args.includes('--overwrite')
    const created: string[] = []
    const skipped: string[] = []
    for (const [path, content] of Object.entries(files)) {
      const exists = existsSync(join(root, path))
      if (exists && !overwrite) {
        if (!command.args.includes('--yes')) throw new Error(`The file ${path} already exists. Would you like to overwrite?`)
        skipped.push(path)
        continue
      }
      write(root, path, content)
      created.push(path)
    }
    return `✔ Checking registry.\n✔ Created ${created.length} files:\n${created.map((p) => `  - ${p}`).join('\n')}\nℹ Skipped ${skipped.length} files: (files might be identical, use --overwrite to overwrite)\n${skipped.map((p) => `  - ${p}`).join('\n')}\n`
  }) as Runner
  return { runner, runs }
}

const files = { 'src/components/ui/morph-label.tsx': MORPH_REGISTRY, 'src/components/ui/button.tsx': BUTTON }

describe('add, over files that are already there', () => {
  it('with --yes never asks: the same file (bar the directive) stays as it is, silently', async () => {
    const root = app()
    const { runner, runs } = shadcn(root, files)
    const ui = silentUi()
    await add(root, ['app-customers'], ['--yes'], runner, ui, {})
    expect(runs.map((r) => r.command)).toEqual(['bunx shadcn@4.21.0 add @youj/app-customers --yes --overwrite'])
    expect(runs[0]).toMatchObject({ captured: true, inherited: false })
    expect(read(root, 'src/components/ui/morph-label.tsx')).toBe(MORPH_INSTALLED)
    expect(read(root, 'src/components/ui/button.tsx')).toBe(BUTTON)
    const log = ui.log.join('\n')
    expect(log).toContain('1 file already in place')
    expect(log).not.toContain('warn:')
  })

  it('never asks without --yes either, and does not give the Created and Skipped lists again', async () => {
    const root = app()
    const { runner } = shadcn(root, files)
    const ui = silentUi()
    await add(root, ['app-customers'], [], runner, ui, {})
    const log = ui.log.join('\n')
    expect(log).toContain('+ src/components/ui/button.tsx (new)')
    expect(log).not.toMatch(/Skipped|files might be identical|Checking registry/)
    expect(log).not.toContain('- src/components/ui/morph-label.tsx')
  })

  it('collapses a large shared core into one line', async () => {
    const root = app()
    const core = Object.fromEntries(Array.from({ length: 33 }, (_, i) => [`src/lib/youj/core-${i}.ts`, `export const c${i} = ${i}\n`]))
    for (const [path, content] of Object.entries(core)) write(root, path, content)
    const { runner } = shadcn(root, { ...core, ...files })
    const ui = silentUi()
    await add(root, ['app-customers'], ['--yes'], runner, ui, {})
    const log = ui.log.join('\n')
    expect(log).toContain('34 files already in place')
    expect(log.split('\n').filter((l) => l.includes('core-'))).toEqual([])
  })

  it('does not take an import that add repaired after shadcn misrouted it for a change of yours', async () => {
    const root = app()
    const repaired = "import { rows } from '@/blocks/app/customers/data'\nexport const Page = rows\n"
    write(root, 'src/blocks/app/customers.tsx', repaired)
    const { runner } = shadcn(root, { 'src/blocks/app/customers.tsx': "import { rows } from '@/blocks/frame/shell/data'\nexport const Page = rows\n" })
    const ui = silentUi()
    await add(root, ['app-customers'], ['--yes'], runner, ui, {})
    expect(read(root, 'src/blocks/app/customers.tsx')).toBe(repaired)
    expect(ui.log.join('\n')).not.toContain('warn:')
  })

  it('keeps a file you changed, and says so at the end', async () => {
    const root = app()
    const mine = "'use client'\n\nexport function MorphLabel() {\n  return <span>mine</span>\n}\n"
    write(root, 'src/components/ui/morph-label.tsx', mine)
    const { runner } = shadcn(root, files)
    const ui = silentUi()
    await add(root, ['app-customers'], ['--yes'], runner, ui, {})
    expect(read(root, 'src/components/ui/morph-label.tsx')).toBe(mine)
    expect(read(root, 'src/components/ui/button.tsx')).toBe(BUTTON)
    const last = ui.log.at(-1)!
    expect(last).toMatch(/^warn: Kept your version of 1 file that differs/)
    expect(last).toContain('src/components/ui/morph-label.tsx')
    expect(last).toContain('--overwrite')
  })

  it('replaces it with --overwrite, and reports which', async () => {
    const root = app()
    write(root, 'src/components/ui/morph-label.tsx', 'export const mine = 1\n')
    const { runner, runs } = shadcn(root, files)
    const ui = silentUi()
    await add(root, ['app-customers'], ['--overwrite'], runner, ui, {})
    expect(runs[0]!.command).toBe('bunx shadcn@4.21.0 add @youj/app-customers --yes --overwrite')
    expect(read(root, 'src/components/ui/morph-label.tsx')).toBe(MORPH_REGISTRY)
    expect(ui.log.join('\n')).toContain('Replaced 1 file (--overwrite): src/components/ui/morph-label.tsx')
    expect(ui.log.join('\n')).not.toContain('warn:')
  })

  it('passes --diff to shadcn as it is, with its own output', async () => {
    const root = app()
    const { runner, runs } = shadcn(root, files)
    await add(root, ['app-customers'], ['--diff'], runner, silentUi(), {})
    expect(runs).toEqual([{ command: 'bunx shadcn@4.21.0 add @youj/app-customers --diff', captured: false, inherited: true }])
  })

  it('lists the files --dry-run would copy itself, runs nothing, and names no temp folder', async () => {
    const root = app()
    const registry = mkdtempSync(join(tmpdir(), 'youj-registry-'))
    writeFileSync(join(registry, 'app-customers.json'), JSON.stringify({ name: 'app-customers', registryDependencies: ['morph-label'], files: [{ path: 'src/blocks/app/customers.tsx', type: 'registry:block', content: 'export function Customers() {}\n' }] }))
    writeFileSync(join(registry, 'morph-label.json'), JSON.stringify({ name: 'morph-label', files: [{ path: 'src/components/ui/morph-label.tsx', type: 'registry:ui', content: MORPH_INSTALLED }] }))
    const { runner, runs } = shadcn(root, files)
    const ui = silentUi()
    await add(root, ['app-customers'], ['--dry-run'], runner, ui, { YOUJ_REGISTRY_URL: `file://${registry}/{name}.json` })
    expect(runs).toEqual([])
    const log = ui.log.join('\n')
    expect(log).toContain('+ src/blocks/app/customers.tsx')
    expect(log).toContain('1 file already in place')
    expect(log).not.toContain(tmpdir())
  })

  it('says how to import what it copied', async () => {
    const root = app()
    const registry = mkdtempSync(join(tmpdir(), 'youj-registry-'))
    writeFileSync(join(registry, 'app-customers.json'), JSON.stringify({ name: 'app-customers', files: [{ path: 'src/blocks/app/customers.tsx', type: 'registry:block', content: 'export function Customers() {}\n' }] }))
    const ui = silentUi()
    const runner = (async () => {
      write(root, 'src/blocks/app/customers.tsx', 'export function Customers() {}\n')
      return ''
    }) as Runner
    await add(root, ['app-customers'], [], runner, ui, { YOUJ_REGISTRY_URL: `file://${registry}/{name}.json` })
    expect(ui.log.join('\n')).toContain("import { Customers } from '@/blocks/app/customers'")
  })

  it('leaves other flags in place, once each', async () => {
    const root = app()
    const { runner, runs } = shadcn(root, files)
    await add(root, ['button'], ['-y', '--path', 'src/components/kit', '-o'], runner, silentUi(), {})
    expect(runs[0]!.command).toBe('bunx shadcn@4.21.0 add @youj/button --path src/components/kit --yes --overwrite')
  })
})

describe('add, on a Vite app whose alias is only in tsconfig.app.json', () => {
  it('stops before shadcn writes into a literal ./@/ folder, and says how to fix it', async () => {
    const root = fixture('vite')
    write(root, 'components.json', JSON.stringify({ aliases: { components: '@/components' }, registries: { '@youj': 'https://www.youj.dev/r/{name}.json' } }))
    write(root, 'tsconfig.app.json', read(root, 'tsconfig.app.json').replace('"strict": true', '"strict": true,\n    "paths": { "@/*": ["./src/*"] }'))
    const { runner, runs } = shadcn(root, files)
    await expect(add(root, ['button'], ['--yes'], runner, silentUi(), {})).rejects.toThrow(/in tsconfig\.app\.json but not in tsconfig\.json[\s\S]*Fix: Add "paths"/)
    expect(runs).toEqual([])
    expect(existsSync(join(root, '@'))).toBe(false)
  })

  it('does not object when the aliases are not @/ ones', async () => {
    const root = fixture('vite')
    write(root, 'components.json', JSON.stringify({ aliases: { components: '~/components' } }))
    const { runner, runs } = shadcn(root, {})
    await add(root, ['button'], ['--yes'], runner, silentUi(), {})
    expect(runs).toHaveLength(1)
  })
})

describe('otherOutput', () => {
  it('drops the file lists and progress, and keeps what else shadcn said', () => {
    const output = '\u001b[32m✔\u001b[0m Checking registry.\n- Installing dependencies.\n✔ Created 2 files:\n  - a.tsx\n  - b.tsx\nℹ Skipped 1 file: (files might be identical)\n  - c.tsx\n- Updating files.\nRun pnpm install to finish.\n'
    expect(otherOutput(output)).toEqual(['Run pnpm install to finish.'])
  })
})
