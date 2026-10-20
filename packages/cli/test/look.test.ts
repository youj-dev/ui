import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { frameItems, readFrame } from '../../ui/src/docs/create/config'
import { readTheme } from '../../ui/src/docs/create/theme-url'
import { themeSource } from '../../ui/src/docs/create/codegen'
import { addPlan, expandItemAliases, lookOfItem, themeOfItem } from '../src/add'
import { create, createParams } from '../src/create'
import { init, type InitOptions } from '../src/init'
import { format } from '../src/run'
import { checkLook } from '../src/look'
import { silentUi } from '../src/ui'
import { fakeRunner, fixture, read, write } from './helpers'

const QUERY = 'sidebar=rail&preset=brutal'
const LINK = `https://www.youj.dev/create?${QUERY}`
const BEZEL = `${LINK}&look=bezel`
const frame = readFrame(new URLSearchParams(QUERY))
const theme = readTheme(new URLSearchParams(QUERY))

async function initialised(name: string, options: Partial<InitOptions> = {}) {
  const root = fixture(name)
  await init({ cwd: root, yes: true, ...options }, fakeRunner(root), silentUi(), {})
  return root
}

describe('init --look', () => {
  it('puts classic, the default, on <html> and leaves the provider to write it; the package installs nothing more; a re-run changes nothing', async () => {
    const plain = fixture('next-app')
    const byDefault = fakeRunner(plain)
    await init({ cwd: plain, yes: true }, byDefault, silentUi(), {})
    const root = fixture('next-app')
    const runner = fakeRunner(root)
    const result = await init({ cwd: root, yes: true, look: 'classic' }, runner, silentUi(), {})
    const layout = read(root, 'app/layout.tsx')
    expect(layout).toBe(read(plain, 'app/layout.tsx'))
    expect(layout).toContain('<YoujProvider theme={basalt}>')
    expect(layout).toMatch(/\{\.\.\.themeProps\(basalt\)\}\s+data-yj-look="classic"/)
    expect(runner.commands).toEqual(byDefault.commands)
    expect(result.manual).toEqual([])

    const again = fakeRunner(root)
    const second = await init({ cwd: root, yes: true }, again, silentUi(), {})
    expect(second.changes).toEqual([])
    expect(again.commands).toEqual([])
  })

  it('on the registry, copies no stylesheet for classic, the default', async () => {
    const root = fixture('vite')
    const runner = fakeRunner(root)
    await init({ cwd: root, yes: true, mode: 'registry' }, runner, silentUi(), {})
    expect(runner.commands).toContain('bunx shadcn@4.21.0 add @youj/youj-core @youj/youj-ui-core --yes --overwrite')
    expect(read(root, 'src/index.css')).not.toContain('bezel.css')
    expect(read(root, 'index.html')).toContain('data-yj-look="classic"')
    expect(read(root, 'src/main.tsx')).not.toContain('look=')
  })

  it('puts bezel on the provider and <html>, and on the registry copies it with the core and imports it right after ui.css', async () => {
    const root = fixture('vite')
    const runner = fakeRunner(root)
    await init({ cwd: root, yes: true, mode: 'registry', look: 'bezel' }, runner, silentUi(), {})
    expect(runner.commands).toContain('bunx shadcn@4.21.0 add @youj/youj-core @youj/youj-ui-core @youj/youj-look-bezel --yes --overwrite')
    const css = read(root, 'src/index.css')
    expect(css.indexOf("@import './styles/bezel.css';")).toBeGreaterThan(css.indexOf("@import './styles/ui.css';"))
    expect(read(root, 'index.html')).toContain('data-yj-look="bezel"')
    expect(read(root, 'src/main.tsx')).toContain('<YoujProvider theme={basalt} look="bezel">')
  })

  it('switches an app on the default to bezel, <html> included; the default takes no style away', async () => {
    const root = await initialised('next-app')
    const result = await init({ cwd: root, yes: true, look: 'bezel' }, fakeRunner(root), silentUi(), {})
    const layout = read(root, 'app/layout.tsx')
    expect(layout).toContain('<YoujProvider theme={basalt} look="bezel">')
    expect(layout).toContain('data-yj-look="bezel"')
    expect(layout).not.toContain('data-yj-look="classic"')
    expect(result.manual).toEqual([])

    const again = await init({ cwd: root, yes: true }, fakeRunner(root), silentUi(), {})
    expect(again.changes).toEqual([])
    expect(read(root, 'app/layout.tsx')).toBe(layout)
  })

  it('refuses a style it doesn’t know', async () => {
    expect(() => checkLook('gothic')).toThrow(/--look takes classic, bezel; got "gothic"/)
    expect(checkLook(undefined)).toBeUndefined()
    const root = fixture('next-app')
    await expect(init({ cwd: root, yes: true, look: 'gothic' as never }, fakeRunner(root), silentUi(), {})).rejects.toThrow(/--look takes/)
  })
})

describe('create with a styled link', () => {
  it('reads a bare style parameter as a Create link', () => {
    expect(createParams('look=bezel')?.get('look')).toBe('bezel')
  })

  it('sets a fresh app up in the link’s style, and writes the theme with its note', async () => {
    const root = fixture('next-app')
    const runner = fakeRunner(root)
    const result = await create({ cwd: root, link: BEZEL }, runner, silentUi(), {})
    expect(read(root, 'app/layout.tsx')).toContain('look="bezel"')
    expect(read(root, 'app/layout.tsx')).toContain('data-yj-look="bezel"')
    expect(read(root, 'lib/theme.ts')).toBe(themeSource(theme, 'package', 'bezel'))
    expect(result.manual).toEqual([])
  })

  it('gives an app already on the package the link’s bezel, copying nothing but the frame', async () => {
    const root = await initialised('next-pages')
    const runner = fakeRunner(root)
    await create({ cwd: root, link: BEZEL }, runner, silentUi(), {})
    expect(read(root, 'src/pages/_app.tsx')).toMatch(/<YoujProvider theme=\{theme\} look="bezel">/)
    expect(read(root, 'src/pages/_document.tsx')).toContain('data-yj-look="bezel"')
    // The frame's blocks are all that's copied, by the CLI itself: nothing to run.
    expect(runner.commands).toEqual([])
    for (const item of frameItems(frame)) expect(read(root, `src/blocks/${item.replace('-', '/')}.tsx`)).toBe('export {}\n')
    for (const copy of ['src/components/ui', 'src/lib/youj', 'src/styles/youj.css']) expect(existsSync(join(root, copy)), copy).toBe(false)
  })

  it('on the registry, copies bezel in for an app on the default, and imports it after ui.css; the same link again changes nothing', async () => {
    const root = await initialised('next-app', { mode: 'registry' })
    const runner = fakeRunner(root)
    await create({ cwd: root, link: BEZEL }, runner, silentUi(), {})
    expect(runner.commands).toContain('pnpm dlx shadcn@4.21.0 add @youj/youj-look-bezel --yes --overwrite')
    const css = read(root, 'app/globals.css')
    expect(css.indexOf('styles/bezel.css')).toBeGreaterThan(css.indexOf('styles/ui.css'))
    expect(read(root, 'app/layout.tsx')).toContain('data-yj-look="bezel"')
    expect(read(root, 'app/layout.tsx')).toMatch(/<YoujProvider[^>]*\slook="bezel"/)

    const again = fakeRunner(root)
    const second = await create({ cwd: root, link: BEZEL }, again, silentUi(), {})
    expect(second.changes).toEqual([])
    expect(again.commands).toEqual([])
  })

  it('takes no style away: a default link leaves the app’s own bezel as it is', async () => {
    const root = await initialised('next-app', { look: 'bezel' })
    const result = await create({ cwd: root, link: LINK }, fakeRunner(root), silentUi(), {})
    expect(read(root, 'app/layout.tsx')).toContain('look="bezel"')
    expect(read(root, 'app/layout.tsx')).not.toContain('classic')
    expect(result.manual).toEqual([])
  })

  it('leaves a provider that names another style as it is, and says so', async () => {
    const root = await initialised('next-app')
    write(root, 'app/layout.tsx', read(root, 'app/layout.tsx').replace('<YoujProvider theme={basalt}>', '<YoujProvider theme={basalt} density="compact" scaling="90%" look="classic">'))
    const result = await create({ cwd: root, link: BEZEL }, fakeRunner(root), silentUi(), {})
    expect(read(root, 'app/layout.tsx')).toContain('look="classic"')
    expect(result.manual).toEqual(['app/layout.tsx: YoujProvider already sets a look ("classic"); change it to look="bezel" to use bezel.'])
  })

  it('shows the style’s copy in a dry run on the registry', async () => {
    const root = await initialised('next-app', { mode: 'registry' })
    const { commands } = await create({ cwd: root, link: BEZEL, dryRun: true }, fakeRunner(root), silentUi(), {})
    expect(commands.map(format)).toContain('pnpm dlx shadcn@4.21.0 add @youj/youj-look-bezel')
  })
})

describe('add youj-look-<id>', () => {
  it('knows the style items', () => {
    expect(lookOfItem('youj-look-bezel')).toBe('bezel')
    expect(lookOfItem('@youj/youj-look-bezel')).toBe('bezel')
    expect(lookOfItem('youj-look-gothic')).toBeUndefined()
    expect(lookOfItem('button')).toBeUndefined()
  })

  it('copies nothing on the package, whose stylesheet has every style', async () => {
    const root = await initialised('next-app')
    const plan = addPlan(root, ['youj-look-bezel'], [])
    expect(plan.styles).toEqual(['youj-look-bezel'])
    expect(plan.copy).toBeUndefined()
  })

  it('copies it on the registry', async () => {
    const root = await initialised('next-app', { mode: 'registry' })
    expect(format(addPlan(root, ['youj-look-bezel'], []).copy!)).toBe('pnpm dlx shadcn@4.21.0 add @youj/youj-look-bezel')
  })
})

describe('add locale <id> and theme <id>', () => {
  it('spell the registry items the docs name', () => {
    expect(expandItemAliases(['locale', 'de', 'theme', 'Terminal', 'button'])).toEqual(['youj-locale-de', 'youj-theme-terminal', 'button'])
    expect(expandItemAliases(['locale', 'pt-BR'])).toEqual(['youj-locale-pt-br'])
    expect(expandItemAliases(['theme', 'check'])).toEqual(['youj-theme-check'])
    expect(expandItemAliases(['youj-locale-de', 'theme'])).toEqual(['youj-locale-de', 'theme'])
  })

  it('know the theme stylesheet items, and not the check', () => {
    expect(themeOfItem('youj-theme-terminal')).toBe('terminal')
    expect(themeOfItem('@youj/youj-theme-brutal')).toBe('brutal')
    expect(themeOfItem('youj-theme-check')).toBeUndefined()
  })
})
