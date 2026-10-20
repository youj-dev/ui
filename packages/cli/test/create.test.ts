import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { fontsSource, layoutSource, screenSource, shellSource, themeSource } from '../../ui/src/docs/create/codegen'
import { frameItems, readFrame, SCREENS } from '../../ui/src/docs/create/config'
import { navIconItems } from '../../ui/src/docs/create/frame-files'
import { readTheme } from '../../ui/src/docs/create/theme-url'
import { addHtmlClass, pointAtTheme } from '../src/codemods'
import { create, createParams, sizeProvider, type CreateOptions } from '../src/create'
import { init, type InitOptions } from '../src/init'
import { format } from '../src/run'
import { CliError, silentUi } from '../src/ui'
import { fakeRunner, fixture, read, write } from './helpers'

const QUERY = 'sidebar=rail&topbar=tabs&account=status&preset=brutal&accent=%23e5484d&name=Acme'
const LINK = `https://www.youj.dev/create?${QUERY}`
const params = new URLSearchParams(QUERY)
const frame = readFrame(params)
const theme = readTheme(params)
const GEIST = "@import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap');"
/** A Create link's faces that load from Google: Geist and Geist Mono (Basalt's Inter and JetBrains Mono come from @fontsource). */
const GEIST_QUERY = 'sans=geist&mono=geist-mono'

async function run(root: string, options: Partial<CreateOptions> = {}) {
  const runner = fakeRunner(root)
  const result = await create({ cwd: root, link: LINK, ...options }, runner, silentUi(), {})
  return { runner, result, files: Object.fromEntries(result.changes.map((c) => [c.path, c.after])) }
}

/** A fixture after `init` with these options. */
async function initialised(name: string, options: Partial<InitOptions> = {}) {
  const root = fixture(name)
  await init({ cwd: root, yes: true, ...options }, fakeRunner(root), silentUi(), {})
  return root
}

describe('create, given a link with something Create does not offer', () => {
  it('warns about an unknown screen, preset and theme=, and still writes from the defaults', async () => {
    const root = fixture('next-app')
    const ui = silentUi()
    await create({ cwd: root, link: 'https://www.youj.dev/create?sidebar=rail&screens=billing,nonsense&preset=zzz&theme=zzz', dryRun: true }, fakeRunner(root), ui, {})
    const log = ui.log.join('\n')
    expect(log).toContain('screens=nonsense')
    expect(log).toContain('preset=zzz')
    expect(log).toContain('theme=')
  })
})

describe('create', () => {
  it('sets a fresh Next app up: Youj, the theme, the frame’s blocks and the shell', async () => {
    const root = fixture('next-app')
    const { runner, result, files } = await run(root)
    expect(result.mode).toBe('package')
    // The blocks are copied by the CLI itself, on top of the packages: no shadcn, no components.json.
    expect(runner.commands).toEqual(['pnpm add @youj/react@^0.1.0 @youj/core@^0.1.0 @youj/motion@^0.1.0 @youj/icons@^0.1.0 motion@^14 @base-ui/react@~1.9.0'])
    for (const item of frameItems(frame)) expect(existsSync(join(root, `blocks/${item.replace('-', '/')}.tsx`)), item).toBe(true)
    expect(existsSync(join(root, 'components.json'))).toBe(false)
    expect(result.manual).toEqual([])
    expect(read(root, 'lib/theme.ts')).toBe(themeSource(theme, 'package'))
    expect(read(root, 'components/app-shell.tsx')).toBe(shellSource(frame, LINK))
    expect(files['app/layout.tsx']).toMatchSnapshot()
    expect(result.next).toMatch(/^Open \/analytics-overview: 3 screens are routes in app\/\(app\)/)
  })

  it('sets the link’s size on the provider and in the theme file’s note, and leaves the provider’s own size when it names none', async () => {
    const plain = await run(fixture('next-app'))
    expect(plain.files['app/layout.tsx']).not.toMatch(/density=|scaling=/)
    const root = fixture('next-app')
    const { result, files } = await run(root, { link: `${LINK}&layout=roomy&scale=110` })
    expect(result.manual).toEqual([])
    expect(files['app/layout.tsx']).toContain('density="roomy" scaling="110%"')
    expect(files['app/layout.tsx']).not.toContain('density="compact"')
    expect(read(root, 'lib/theme.ts')).toBe(themeSource(theme, 'package', 'classic', { density: 'roomy', scaling: '110%' }))
  })

  it('adds a size to a provider without one, keeps one in place, and leaves an expression to the reader', () => {
    expect(sizeProvider('<YoujProvider theme={theme}>{children}</YoujProvider>', { density: 'roomy', scaling: '75%' })).toBe(
      '<YoujProvider theme={theme} density="roomy" scaling="75%">{children}</YoujProvider>',
    )
    expect(sizeProvider('<YoujProvider density="compact" theme={theme} scaling="90%">', { density: 'roomy', scaling: '120%' })).toBe(
      '<YoujProvider density="roomy" theme={theme} scaling="120%">',
    )
    expect(sizeProvider('<YoujProvider scaling={scale}>', { density: 'roomy', scaling: '120%' })).toBeNull()
    expect(sizeProvider('<div />', { density: 'roomy', scaling: '120%' })).toBeNull()
  })

  it('declares no theme of its own in the layout when the link changes the preset’s motion', async () => {
    const { files } = await run(fixture('next-app'), { link: 'https://www.youj.dev/create?preset=brutal&motion=lively' })
    expect(files['app/layout.tsx']).toContain('import { YoujProvider, themeProps } from "@youj/core";\nimport { ThemeScript } from "@youj/react";\nimport { theme } from "@/lib/theme";\n\nconst geistSans')
    expect(files['app/layout.tsx']).not.toContain('defineTheme')
  })

  it('in an app already on the package, installs nothing and swaps the preset for the theme', async () => {
    const root = await initialised('next-pages')
    const { runner, result, files } = await run(root)
    expect(runner.commands).toEqual([])
    expect(read(root, 'src/blocks/frame/shell.tsx')).toBe('export {}\n')
    expect(result.manual).toEqual([])
    expect(files['src/lib/theme.ts']).toBe(themeSource(theme, 'package'))
    expect(files['src/pages/_app.tsx']).toMatchSnapshot('src/pages/_app.tsx')
    expect(files['src/pages/_document.tsx']).toMatchSnapshot('src/pages/_document.tsx')
  })

  it('in an app on the registry, imports the theme from the copied core and adds through the namespace', async () => {
    const root = await initialised('next-app', { mode: 'registry', theme: 'brutal' })
    const { runner, result, files } = await run(root)
    expect(result.mode).toBe('registry')
    expect(files['lib/theme.ts']).toBe(themeSource(theme, 'registry'))
    expect(files['lib/theme.ts']).toContain("from '@/lib/youj/theme'")
    expect(runner.commands).toEqual([`pnpm dlx shadcn@4.21.0 add ${[...frameItems(frame), ...navIconItems(frame)].map((item) => `@youj/${item}`).join(' ')} --yes --overwrite`])
    expect(files['app/layout.tsx']).toMatchSnapshot()
  })

  it('writes and runs nothing on a dry run, and shows every change and command', async () => {
    const root = fixture('vite')
    const main = read(root, 'src/main.tsx')
    const { runner, result, files } = await run(root, { dryRun: true })
    expect(runner.commands).toEqual([])
    expect(result.commands.map(format)).toEqual([
      'bun add -d tailwindcss @tailwindcss/vite',
      'bun add @youj/react@^0.1.0 @youj/core@^0.1.0 @youj/motion@^0.1.0 @youj/icons@^0.1.0 motion@^14 @base-ui/react@~1.9.0',
      `npx @youj/cli add ${frameItems(frame).join(' ')}`,
    ])
    expect(Object.keys(files).sort()).toEqual(['index.html', 'src/components/app-shell.tsx', 'src/index.css', 'src/lib/nav.ts', 'src/lib/theme.ts', 'src/main.tsx', 'tsconfig.app.json', 'tsconfig.json', 'vite.config.ts'])
    expect(files['src/main.tsx']).toContain("import { theme } from './lib/theme'")
    expect(files['index.html']).toContain('data-yj-theme="brutal" data-yj-motion="precise"')
    expect(read(root, 'src/main.tsx')).toBe(main)
    expect(existsSync(join(root, 'src/lib/theme.ts'))).toBe(false)
  })

  it('shows a dry run in a fresh app on the registry adding through the namespace init would map', async () => {
    const { runner, result } = await run(fixture('next-app'), { mode: 'registry', dryRun: true })
    expect(runner.commands).toEqual([])
    expect(result.commands.map(format)).toEqual([
      'pnpm dlx shadcn@4.21.0 add @youj/youj-core @youj/youj-ui-core --yes --overwrite',
      `pnpm dlx shadcn@4.21.0 add ${[...frameItems(frame), ...navIconItems(frame)].map((item) => `@youj/${item}`).join(' ')}`,
    ])
  })

  it('changes nothing when run again with the same link, whole or as its query string', async () => {
    const root = fixture('next-app')
    await run(root)
    const again = await run(root, { link: `?${QUERY}` })
    expect(again.result.changes).toEqual([])
    expect(again.runner.commands).toEqual([])
    expect(again.result.manual).toEqual([])
  })

  it('keeps the theme when adding the blocks fails, and a re-run finishes the job', async () => {
    const root = await initialised('next-app')
    const offline = { YOUJ_REGISTRY_URL: 'https://offline.test/r' }
    await expect(create({ cwd: root, link: LINK }, fakeRunner(root), silentUi(), offline)).rejects.toThrow(/No registry found at https:\/\/offline\.test\/r\//)
    expect(read(root, 'app/layout.tsx')).toContain('<YoujProvider theme={theme}>')
    expect(existsSync(join(root, 'components/app-shell.tsx'))).toBe(false)
    const { runner } = await run(root)
    expect(runner.commands).toEqual([])
    expect(existsSync(join(root, 'blocks/frame/shell.tsx'))).toBe(true)
    expect(read(root, 'components/app-shell.tsx')).toBe(shellSource(frame, LINK))
  })

  it('keeps a shell that’s already there, unless told to overwrite it', async () => {
    const root = fixture('next-app')
    write(root, 'components/app-shell.tsx', 'export function AppShell() {}\n')
    const { result } = await run(root)
    expect(read(root, 'components/app-shell.tsx')).toBe('export function AppShell() {}\n')
    expect(result.manual).toEqual([expect.stringContaining('components/app-shell.tsx is already there')])
    await run(root, { overwrite: true })
    expect(read(root, 'components/app-shell.tsx')).toBe(shellSource(frame, LINK))
  })

  it('leaves a provider on a theme of the app’s own to a manual step', async () => {
    const root = await initialised('vite')
    write(root, 'src/main.tsx', read(root, 'src/main.tsx').replace('theme={basalt}', 'theme={brand}'))
    const { result, files } = await run(root)
    expect(result.manual).toEqual([expect.stringContaining("Point src/main.tsx at Create's theme by hand: import { theme } from './lib/theme'")])
    expect(files['src/main.tsx']).toBeUndefined()
  })

  it('on the App Router, sets up the typefaces with next/font and routes the screen inside the shell', async () => {
    const root = fixture('next-app')
    const link = 'https://www.youj.dev/create?sans=geist&display=fraunces&mono=geist-mono&screens=billing'
    const { result, files } = await run(root, { link })
    const fontTheme = readTheme(new URLSearchParams(link.split('?')[1]))
    expect(result.manual).toEqual([])
    expect(files['lib/fonts.ts']).toBe(fontsSource(fontTheme))
    expect(files['lib/theme.ts']).toContain(`sans: "var(--font-geist, 'Geist'), ui-sans-serif, system-ui, sans-serif"`)
    // The starter's own font classes stay; the theme's come first.
    expect(files['app/layout.tsx']).toContain('className={`${fontVariables} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}')
    expect(files['app/layout.tsx']).toContain('import { fontVariables } from "@/lib/fonts";')
    expect(files['app/(app)/layout.tsx']).toBe(layoutSource())
    expect(files['app/(app)/billing/page.tsx']).toBe(screenSource(SCREENS['app-billing']!))
    expect(result.next).toMatch(/^Open \/billing/)
    // Twice changes nothing.
    const again = await run(root, { link })
    expect(again.result.changes).toEqual([])
  })

  it('on the App Router, writes a route per screen, the home screen at /, and a nav that links them', async () => {
    const root = fixture('next-app')
    const link = 'https://www.youj.dev/create?screens=customers,week-calendar,ai-workspace'
    const { result, files } = await run(root, { link })
    expect(result.manual).toEqual([])
    expect(files['app/(app)/layout.tsx']).toBe(layoutSource())
    expect(files['app/(app)/customers/page.tsx']).toContain('<Customers />')
    expect(files['app/page.tsx']).toContain("redirect('/customers')")
    expect(files['app/(app)/week-calendar/page.tsx']).toContain('<WeekCalendar />')
    expect(files['app/(app)/ai-workspace/page.tsx']).toContain('<AiWorkspace />')
    expect(files['lib/nav.ts']).toContain("href: '/week-calendar'")
    expect(files['components/app-shell.tsx']).toContain('activeNav(pathname)')
    expect(result.next).toMatch(/^Open \/customers: 3 screens/)
    const again = await run(root, { link })
    expect(again.result.changes).toEqual([])
  })

  it('loads a link’s web faces once in a fresh App Router app: next/font for its theme, and no stylesheet import from init', async () => {
    const root = fixture('next-app')
    const { result, files } = await run(root, { link: `https://www.youj.dev/create?${GEIST_QUERY}&page=inbox` })
    expect(result.manual).toEqual([])
    expect(files['lib/fonts.ts']).toBe(fontsSource(readTheme(new URLSearchParams(GEIST_QUERY))))
    expect(files['app/layout.tsx']).toContain('className={`${fontVariables} ${geistSans.variable}')
    expect(files['app/globals.css']).not.toContain('fonts.googleapis.com')
  })

  it('replaces the @fontsource faces an earlier init loaded with next/font on the App Router', async () => {
    const root = await initialised('next-app')
    expect(read(root, 'app/layout.tsx')).toContain('@fontsource-variable/inter')
    const { result, files } = await run(root, { link: `https://www.youj.dev/create?${GEIST_QUERY}&page=inbox` })
    expect(result.manual).toEqual([])
    expect(files['lib/fonts.ts']).toBe(fontsSource(readTheme(new URLSearchParams(GEIST_QUERY))))
    expect(files['app/layout.tsx']).not.toContain('@fontsource')
    expect(read(root, 'app/globals.css')).not.toContain('fonts.googleapis.com')
    const again = await run(root, { link: `https://www.youj.dev/create?${GEIST_QUERY}&page=inbox` })
    expect(again.result.changes).toEqual([])
  })

  it('elsewhere, loads nothing for faces init loaded, and one import for a link’s web faces', async () => {
    const root = await initialised('vite')
    const same = await run(root, { link: 'https://www.youj.dev/create?page=board' })
    expect(same.files['src/index.css']).toBeUndefined()
    const { files } = await run(root, { link: `https://www.youj.dev/create?${GEIST_QUERY}&display=fraunces&page=board`, overwrite: true })
    const css = files['src/index.css']!
    expect(css).not.toContain(GEIST)
    expect(css.match(/fonts\.googleapis\.com/g)).toHaveLength(1)
    expect(css.startsWith("@import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&family=Fraunces")).toBe(true)
  })

  it('elsewhere, loads the typefaces from the stylesheet and leaves the screens to the app’s router', async () => {
    const root = await initialised('vite')
    const { result, files } = await run(root, { link: 'https://www.youj.dev/create?preset=graphite&sans=ibm-plex-sans&page=board' })
    expect(files['src/index.css']!.startsWith("@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@100..700&display=swap');\n")).toBe(true)
    expect(files['src/lib/fonts.ts']).toBeUndefined()
    expect(result.manual).toEqual([])
    expect(result.next).toContain('with your router: <TaskBoard /> from blocks/app/task-board')
    expect(files['src/lib/nav.ts']).toContain("href: '/task-board'")
    expect(files['src/components/app-shell.tsx']).not.toContain('next/navigation')
  })

  it('writes no route for a frame with no screens, or an older link’s blank page', async () => {
    for (const link of ['https://www.youj.dev/create?screens=', 'https://www.youj.dev/create?page=blank']) {
      const { files, result } = await run(fixture('next-app'), { link })
      expect(Object.keys(files).some((path) => path.startsWith('app/(app)/')), link).toBe(false)
      expect(files['lib/nav.ts'], link).toContain('export const NAV: FrameNavSection[] = []')
      expect(result.next).toContain('Wrap your pages in <AppShell>')
    }
  })

  it('refuses anything that isn’t a Create link', async () => {
    const root = fixture('next-app')
    for (const link of ['https://www.youj.dev/docs/components/button', 'https://www.youj.dev/?sidebar=rail', 'foo=bar', 'hello', ''])
      await expect(create({ cwd: root, link }, fakeRunner(root), silentUi(), {})).rejects.toThrow(CliError)
    await expect(create({ cwd: root, link: 'foo=bar' }, fakeRunner(root), silentUi(), {})).rejects.toThrow(`"foo=bar" isn't a link from Create.`)
    expect(read(root, 'app/layout.tsx')).toBe(read(join(import.meta.dirname, 'fixtures/next-app'), 'app/layout.tsx'))
  })

  it('reads the link whole, as its query string, or with no query at all', () => {
    expect(createParams(LINK)?.toString()).toBe(QUERY)
    expect(createParams(`?${QUERY}`)?.toString()).toBe(QUERY)
    expect(createParams(QUERY)?.toString()).toBe(QUERY)
    expect(createParams('http://localhost:3000/create/?preset=terminal#top')?.toString()).toBe('preset=terminal')
    expect(createParams('https://www.youj.dev/create')?.toString()).toBe('')
  })
})

describe('addHtmlClass', () => {
  it('adds the class, or leads the string or template that is there, once', () => {
    expect(addHtmlClass('<html lang="en">', 'fontVariables')).toBe('<html lang="en" className={fontVariables}>')
    expect(addHtmlClass('<html lang="en" className="dark">', 'fontVariables')).toBe('<html lang="en" className={`${fontVariables} dark`}>')
    const template = '<html className={`${a.variable} h-full`}>'
    const once = addHtmlClass(template, 'fontVariables')!
    expect(once).toBe('<html className={`${fontVariables} ${a.variable} h-full`}>')
    expect(addHtmlClass(once, 'fontVariables')).toBe(once)
  })

  it('gives up on a className it can’t extend safely, or no <html>', () => {
    expect(addHtmlClass('<html className={cn(a, b)}>', 'fontVariables')).toBeNull()
    expect(addHtmlClass('<body>', 'fontVariables')).toBeNull()
  })
})

describe('pointAtTheme', () => {
  const layout = 'import { YoujProvider, graphite } from "@youj/core";\n\nexport const App = () => <YoujProvider theme={graphite}><Page /></YoujProvider>;\n'

  it('swaps the preset for the imported theme once', () => {
    const once = pointAtTheme(layout, '../lib/theme')!
    expect(once).toBe('import { YoujProvider } from "@youj/core";\nimport { theme } from "../lib/theme";\n\nexport const App = () => <YoujProvider theme={theme}><Page /></YoujProvider>;\n')
    expect(pointAtTheme(once, '../lib/theme')).toBe(once)
  })

  it('keeps an import the file still uses', () => {
    const source = layout.replace('<Page />', '<Page accent={graphite.accent} />')
    expect(pointAtTheme(source, '../lib/theme')).toContain('import { YoujProvider, graphite } from "@youj/core";')
  })

  it('gives up on any other theme, or another `theme` in the file', () => {
    expect(pointAtTheme(layout.replaceAll('graphite', 'brand'), '../lib/theme')).toBeNull()
    expect(pointAtTheme(`${layout}const theme = 1;\n`, '../lib/theme')).toBeNull()
    expect(pointAtTheme(layout.replace('() =>', '() => { const { theme } = useTheme(); return').replace('</YoujProvider>;', '</YoujProvider> };'), '../lib/theme')).toBeNull()
    expect(pointAtTheme('<YoujProvider><Page /></YoujProvider>', '../lib/theme')).toBeNull()
  })

  it('is not put off by attributes, properties and strings that say theme', () => {
    const busy = layout.replace('<Page />', '<Page mode={props.theme} /><Toaster theme="dark" /><meta name="theme-color" />')
    expect(pointAtTheme(busy, '../lib/theme')).toContain('<YoujProvider theme={theme}>')
  })
})
