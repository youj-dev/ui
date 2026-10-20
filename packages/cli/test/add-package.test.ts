import { existsSync, readFileSync } from 'node:fs'
import { join, posix } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { NOTICE_PATH, SHADCN_NOTICE } from '../src/notice'
import { add } from '../src/add'
import { codeOnly, moduleSpecifiers } from '../src/copy-in'
import { installCommand, isPackageName } from '../src/run'
import { dependencyRef } from '../src/registry'
import { doctor } from '../src/doctor'
import { CliError, silentUi, type Ui } from '../src/ui'
import { blockItem, fakePackage, fakeRunner, fixture, read, stubRegistry, write } from './helpers'

/** The vite fixture on the package: @youj/react in package.json and installed (with motion and icons beside it, as its dependencies). */
function onPackage() {
  const root = fixture('vite')
  const pkg = JSON.parse(read(root, 'package.json'))
  pkg.dependencies = { ...pkg.dependencies, '@youj/react': '^0.1.0' }
  write(root, 'package.json', JSON.stringify(pkg, null, 2))
  write(root, 'src/index.css', "@import 'tailwindcss';\n@import '@youj/react/styles.css';\n")
  for (const name of ['@youj/react', '@youj/core', '@youj/icons']) fakePackage(root, name)
  return root
}

/** A Ui that fails the test if anything asks a question. */
function noPrompts(): Ui & { log: string[] } {
  const ui = silentUi()
  const ask = () => {
    throw new Error('add asked a question')
  }
  return { ...ui, select: ask, confirm: ask }
}

const DEMO = [
  "'use client'",
  '',
  "import { useState } from 'react'",
  "import { Button } from '@/components/ui/button'",
  "import { Card, CardHeader } from '@/components/ui/card'",
  "import { useLabels } from '@/lib/youj/use-labels'",
  "import { MenuIcon } from '@/components/youj/icons/menu'",
  "import { cn } from '@/lib/utils'",
  "import { Part } from '@/blocks/frame/part'",
  '',
  'export function Demo() {}',
  '',
].join('\n')

/** A block as the registry builds it: imports through @/, dependencies as URLs on whatever origin the build had. */
const REGISTRY = [
  { ...blockItem('frame-demo', [{ target: 'blocks/frame/demo.tsx', content: DEMO }]), files: [{ path: 'src/blocks/frame/demo.tsx', target: 'blocks/frame/demo.tsx', type: 'registry:component', content: DEMO }], dependencies: ['motion'], registryDependencies: ['https://www.youj.dev/r/button.json', 'http://localhost:3100/r/card.json', '@youj/youj-core', 'icon-menu', 'frame-part', 'youj-presets'] },
  { name: 'frame-part', files: [{ path: 'src/blocks/frame/part.tsx', target: 'blocks/frame/part.tsx', content: "import { Sidebar } from '@/components/ui/sidebar'\nexport const Part = Sidebar\n" }], registryDependencies: ['https://www.youj.dev/r/sidebar.json'] },
  { name: 'button', files: [{ path: 'src/components/ui/button.tsx', type: 'registry:ui', content: 'export function Button() {}\n' }, { path: 'src/components/ui/button.variants.tsx', type: 'registry:ui', content: "import { cva } from 'class-variance-authority'\nexport const buttonVariants = cva('')\n" }], dependencies: ['class-variance-authority'], registryDependencies: ['https://www.youj.dev/r/youj-ui-core.json'] },
  { name: 'card', files: [{ path: 'src/components/ui/card.tsx', type: 'registry:ui', content: 'export function Card() {}\n' }] },
  { name: 'sidebar', files: [{ path: 'src/components/ui/sidebar.tsx', type: 'registry:ui', content: 'export function Sidebar() {}\n' }] },
  { name: 'youj-ui-core', files: [{ path: 'src/lib/utils.ts', target: 'lib/utils.ts', content: 'export const cn = () => ""\nexport const numberFormat = 1\n' }, { path: 'src/styles/ui.css', target: 'styles/ui.css', content: '/* ui */\n' }] },
  { name: 'youj-core', files: [{ path: 'src/lib/youj/provider.tsx', target: 'lib/youj/provider.tsx', content: 'export function YoujProvider() {}\n' }, { path: 'registry/generated/youj.css', target: 'styles/youj.css', type: 'registry:file', content: '/* tokens */\n' }] },
  { name: 'icon-menu', files: [{ path: 'src/components/youj/icons/menu.tsx', target: 'components/youj/icons/menu.tsx', content: 'export const MenuIcon = 1\n' }] },
  { name: 'youj-presets', css: { '@utility yj-fade': {} } },
]

describe('add form, in an app on the package', () => {
  it('names the schema packages the usual setup needs, unless the app has them', async () => {
    const root = onPackage()
    const ui = silentUi()
    await add(root, ['form'], [], fakeRunner(root), ui)
    expect(ui.log.join('\n')).toContain('also install @hookform/resolvers zod')
    const pkg = JSON.parse(read(root, 'package.json'))
    write(root, 'package.json', JSON.stringify({ ...pkg, dependencies: { ...pkg.dependencies, '@hookform/resolvers': '^5.0.0', zod: '^4.0.0' } }))
    const again = silentUi()
    await add(root, ['form'], [], fakeRunner(root), again)
    expect(again.log.join('\n')).not.toContain('also install')
  })
})

describe('add a block, in an app on the package', () => {
  it("writes shadcn's notice once beside what it copies, and keeps one that is there", async () => {
    const root = onPackage()
    await add(root, ['frame-demo'], [], fakeRunner(root), noPrompts(), stubRegistry(REGISTRY))
    expect(read(root, NOTICE_PATH)).toBe(SHADCN_NOTICE)
    write(root, NOTICE_PATH, 'mine\n')
    await add(root, ['frame-demo'], ['--overwrite'], fakeRunner(root), noPrompts(), stubRegistry(REGISTRY))
    expect(read(root, NOTICE_PATH)).toBe('mine\n')
  })

  it("copies only the block's own files, imports the rest from the packages and asks nothing", async () => {
    const root = onPackage()
    const css = read(root, 'src/index.css')
    const runner = fakeRunner(root)
    await add(root, ['frame-demo'], [], runner, noPrompts(), stubRegistry(REGISTRY))
    expect(read(root, 'src/blocks/frame/demo.tsx')).toBe(
      [
        "'use client'",
        '',
        "import { useState } from 'react'",
        "import { Button, Card, CardHeader } from '@youj/react'",
        "import { useLabels, cn } from '@youj/core'",
        "import { MenuIcon } from '@youj/icons'",
        "import { Part } from '@/blocks/frame/part'",
        '',
        'export function Demo() {}',
        '',
      ].join('\n'),
    )
    expect(read(root, 'src/blocks/frame/part.tsx')).toContain("import { Sidebar } from '@youj/react'")
    for (const copy of ['src/components', 'src/lib', 'src/styles', 'components.json']) expect(existsSync(join(root, copy)), copy).toBe(false)
    expect(read(root, 'src/index.css')).toBe(css)
    // Motion and icons are installed (react's dependencies), but the app imports them now, so it declares them.
    expect(runner.commands).toEqual(['bun add @youj/core@^0.1.0 @youj/icons@^0.1.0'])
  })

  it("drops the .ts the registry pins a copied file's import to for shadcn, which the app's TypeScript refuses", async () => {
    const root = onPackage()
    const content = "import { SURVEY } from '@/blocks/surveys/question/data.ts'\nimport { useSeed } from '@/blocks/surveys/question/flow.ts'\nexport const Form = () => [SURVEY, useSeed]\n"
    const files = [
      { path: 'src/blocks/surveys/form.tsx', target: 'blocks/surveys/form.tsx', content },
      { path: 'src/blocks/surveys/question/data.ts', target: 'blocks/surveys/question/data.ts', content: 'export const SURVEY = 1\n' },
      { path: 'src/blocks/surveys/question/flow.ts', target: 'blocks/surveys/question/flow.ts', content: 'export const useSeed = 1\n' },
    ]
    const form = { ...blockItem('surveys-form'), files }
    await add(root, ['surveys-form'], [], fakeRunner(root), noPrompts(), stubRegistry([...REGISTRY, form]))
    expect(read(root, 'src/blocks/surveys/form.tsx')).toBe(content.replaceAll(".ts'", "'"))
  })

  it('installs the optional peer an item the package ships names, at its range: lottie-player needs dotLottie', async () => {
    const root = onPackage()
    fakePackage(root, '@youj/motion')
    const lottie = { name: 'lottie-player', type: 'registry:component', dependencies: ['@lottiefiles/dotlottie-react@^0.19.16'], files: [{ path: 'src/components/youj/players/lottie-player.tsx', type: 'registry:component', content: '' }] }
    const runner = fakeRunner(root)
    await add(root, ['lottie-player'], [], runner, noPrompts(), stubRegistry([...REGISTRY, lottie]))
    expect(existsSync(join(root, 'src/components/youj/players/lottie-player.tsx'))).toBe(false)
    expect(runner.commands).toEqual(['bun add @lottiefiles/dotlottie-react@^0.19.16'])
  })

  it("installs an entry's optional peer, and copies a helper a package has but doesn't export", async () => {
    const root = onPackage()
    const content = "import { ChartContainer } from '@/components/ui/chart'\nimport { buttonVariants } from '@/components/ui/button.variants'\nexport { ChartContainer, buttonVariants }\n"
    const registry = stubRegistry([...REGISTRY, { name: 'chart', files: [{ path: 'src/components/ui/chart.tsx', type: 'registry:ui', content: '' }] }, { ...blockItem('app-usage-overview'), files: [{ path: 'src/blocks/app/usage-overview.tsx', target: 'blocks/app/usage-overview.tsx', content }], registryDependencies: ['chart', 'button'] }])
    const runner = fakeRunner(root)
    await add(root, ['app-usage-overview'], [], runner, noPrompts(), registry)
    expect(read(root, 'src/blocks/app/usage-overview.tsx')).toBe(content.replace('@/components/ui/chart', '@youj/react/chart'))
    expect(read(root, 'src/components/ui/button.variants.tsx')).toContain('cva')
    expect(existsSync(join(root, 'src/components/ui/button.tsx'))).toBe(false)
    expect(runner.commands).toEqual(['bun add recharts@^3.8.0 class-variance-authority'])
  })

  it("writes into the folder the @/ alias names, and leaves what's there: the same file quietly, your edits unless --overwrite", async () => {
    const root = fixture('next-app')
    const pkg = JSON.parse(read(root, 'package.json'))
    pkg.dependencies = { ...pkg.dependencies, '@youj/react': '^0.1.0', '@youj/core': '^0.1.0', '@youj/icons': '^0.1.0' }
    write(root, 'package.json', JSON.stringify(pkg, null, 2))
    for (const name of ['@youj/react', '@youj/core', '@youj/icons']) fakePackage(root, name)
    const env = stubRegistry(REGISTRY)
    await add(root, ['frame-demo'], [], fakeRunner(root), noPrompts(), env)
    expect(existsSync(join(root, 'blocks/frame/demo.tsx'))).toBe(true)

    const runner = fakeRunner(root)
    const ui = noPrompts()
    write(root, 'blocks/frame/part.tsx', 'export const Part = 1 // mine\n')
    await add(root, ['frame-demo'], [], runner, ui, env)
    expect(runner.commands).toEqual([])
    expect(read(root, 'blocks/frame/part.tsx')).toContain('// mine')
    expect(ui.log.join('\n')).toContain('1 file already in place')
    expect(ui.log.join('\n')).toMatch(/Kept your version of 1 file[\s\S]*blocks\/frame\/part\.tsx/)

    await add(root, ['frame-demo'], ['--overwrite'], runner, noPrompts(), env)
    expect(read(root, 'blocks/frame/part.tsx')).toContain('@youj/react')
  })

  it('writes and installs nothing on --dry-run, and lists what it would copy', async () => {
    const root = onPackage()
    const runner = fakeRunner(root)
    const ui = noPrompts()
    await add(root, ['frame-demo'], ['--dry-run'], runner, ui, stubRegistry(REGISTRY))
    expect(runner.commands).toEqual([])
    expect(existsSync(join(root, 'src/blocks'))).toBe(false)
    expect(ui.log.join('\n')).toMatch(/copy 2 files \(frame-demo, frame-part\):\n {2}src\/blocks\/frame\/demo\.tsx\n {2}src\/blocks\/frame\/part\.tsx/)
  })

  it("stops when the package is in package.json but not installed: it can't tell what the package ships", async () => {
    const root = fixture('vite')
    const pkg = JSON.parse(read(root, 'package.json'))
    pkg.dependencies = { ...pkg.dependencies, '@youj/react': '^0.1.0' }
    write(root, 'package.json', JSON.stringify(pkg, null, 2))
    const run = add(root, ['frame-demo'], [], fakeRunner(root), noPrompts(), stubRegistry(REGISTRY))
    await expect(run).rejects.toThrow(CliError)
    await expect(run).rejects.toThrow('bun install')
  })
})

describe('a custom registry', () => {
  it('serves every Youj dependency, whatever origin the build wrote, and keeps the token to itself', async () => {
    const root = onPackage()
    const served = new Map<string, unknown>(REGISTRY.map((item) => [`https://registry.test/r/${item.name}.json`, item]))
    served.set('https://other.test/r/extra.json', { name: 'extra', files: [{ path: 'src/blocks/x/extra.tsx', target: 'blocks/x/extra.tsx', content: 'export {}\n' }] })
    const demo = REGISTRY[0]!
    served.set('https://registry.test/r/frame-demo.json', { ...demo, registryDependencies: [...(demo.registryDependencies as string[]), 'https://other.test/r/extra.json'] })
    const fetch = vi.fn(async (url: string) => (served.has(url) ? Response.json(served.get(url)) : new Response(null, { status: 404 })))
    vi.stubGlobal('fetch', fetch)
    await add(root, ['frame-demo'], [], fakeRunner(root), noPrompts(), { YOUJ_REGISTRY_URL: 'https://registry.test/r', YOUJ_REGISTRY_TOKEN: 'tok' })
    const calls = fetch.mock.calls as unknown as [string, RequestInit][]
    expect(calls.every(([url]) => url.startsWith('https://registry.test/r/') || url === 'https://other.test/r/extra.json')).toBe(true)
    for (const [url, init] of calls) expect([url, init.headers]).toEqual([url, url.startsWith('https://registry.test/') ? { Authorization: 'Bearer tok' } : {}])
    expect(read(root, 'src/blocks/x/extra.tsx')).toBe('export {}\n')
  })

  it('on the registry, hands shadcn local copies of the items, their dependencies pointing at each other', async () => {
    const root = fixture('next-app')
    write(root, 'components.json', JSON.stringify({ registries: { '@youj': 'https://registry.test/r/{name}.json' } }))
    const env = stubRegistry(REGISTRY)
    let seen: { args: string[]; deps: string[] } | undefined
    const runner = fakeRunner(root)
    const capture: typeof runner = Object.assign(async (command: Parameters<typeof runner>[0], cwd: string, options?: Parameters<typeof runner>[2]) => {
      const file = command.args.find((a) => a.endsWith('frame-demo.json'))!
      seen = { args: command.args, deps: JSON.parse(readFileSync(file, 'utf8')).registryDependencies }
      return runner(command, cwd, options)
    }, { commands: runner.commands })
    await add(root, ['frame-demo'], [], capture, noPrompts(), env)
    expect(seen!.args.slice(0, 3)).toEqual(['dlx', 'shadcn@4.21.0', 'add'])
    expect(seen!.deps).toHaveLength(6)
    for (const dep of seen!.deps) expect(dep).toMatch(/^\/.*\/(button|card|youj-core|icon-menu|frame-part|youj-presets)\.json$/)
  })

  it('names Youj dependencies by item, and leaves other registries’ URLs as they are', () => {
    expect(dependencyRef('https://www.youj.dev/r/button.json', {})).toBe('button')
    expect(dependencyRef('http://localhost:3100/r/icon-check.json', {})).toBe('icon-check')
    expect(dependencyRef('@youj/card', {})).toBe('card')
    expect(dependencyRef('https://reg.test/r/x.json', { YOUJ_REGISTRY_URL: 'https://reg.test/r/{name}.json' })).toBe('x')
    expect(dependencyRef('https://acme.dev/r/x.json', {})).toBe('https://acme.dev/r/x.json')
  })

  it('says the registry refused, and what to do about the token', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 401 }))
    const root = onPackage()
    await expect(add(root, ['frame-demo'], [], fakeRunner(root), noPrompts(), {})).rejects.toThrow(/refused .*frame-demo\.json \(401\)\. If it's a private registry, set YOUJ_REGISTRY_TOKEN/)
    await expect(add(root, ['frame-demo'], [], fakeRunner(root), noPrompts(), { YOUJ_REGISTRY_TOKEN: 'old' })).rejects.toThrow(/doesn't accept the token/)
  })
})

describe('doctor, in an app on the package', () => {
  it('warns about copies of what the packages ship, the provider among them', () => {
    const root = onPackage()
    write(root, 'src/components/ui/button.tsx', "import { useYouj } from '@/lib/youj/provider'\nexport function Button() {}\n")
    write(root, 'src/lib/youj/provider.tsx', 'export function YoujProvider() {}\n')
    write(root, 'src/styles/youj.css', '/* tokens */\n')
    write(root, 'src/lib/utils.ts', 'export const cn = () => ""\n')
    write(root, 'src/blocks/frame/demo.tsx', 'export {}\n')
    const warning = doctor(root, {}).find((c) => c.message.includes('duplicate'))
    expect(warning).toMatchObject({ level: 'warn' })
    expect(warning!.message).toMatch(/^3 copied Youj files duplicate what the Youj packages ship, the provider among them \(src\/components\/ui\/button\.tsx, src\/lib\/youj\/provider\.tsx, src\/styles\/youj\.css\)/)
  })

  it("calls a shadcn app's own components its own, not copies left over", () => {
    const root = onPackage()
    write(root, 'src/components/ui/button.tsx', 'import { Slot } from "@radix-ui/react-slot"\nexport function Button() {}\n')
    const checks = doctor(root, {}).filter((c) => c.level !== 'ok')
    expect(checks.find((c) => c.message.includes('duplicate'))).toBeUndefined()
    expect(checks.find((c) => c.message.includes('src/components/ui/button.tsx'))).toMatchObject({
      level: 'warn',
      message: expect.stringMatching(/^1 component of your own has a Youj version in @youj\/react \(src\/components\/ui\/button\.tsx\)\. They keep working/),
    })
  })

  it('says nothing about blocks on their own', async () => {
    const root = onPackage()
    await add(root, ['frame-demo'], [], fakeRunner(root), noPrompts(), stubRegistry(REGISTRY))
    expect(doctor(root, {}).filter((c) => c.message.includes('duplicate'))).toEqual([])
  })

  it("reads a block's own export before an export-from as two statements, not a broken import (no semicolons)", () => {
    const root = onPackage()
    write(root, 'src/blocks/tables/data-grid.tsx', "// youj\nfunction DataGrid() {}\nexport { DataGrid }\nexport { createColumns } from './data-grid/columns'\n")
    write(root, 'src/blocks/tables/data-grid/columns.tsx', 'export function createColumns() {}\n')
    expect(doctor(root, {}).find((c) => c.message.includes("can't stand in"))).toBeUndefined()
  })
})

const UI = join(import.meta.dirname, '../../ui')

/** A UI registry item as the registry serves it: its real source files, relative imports spelled `@/` the way the build spells them. */
function realItem(name: string) {
  const items: { name: string; files: { path: string; target: string }[]; registryDependencies?: string[] }[] = JSON.parse(readFileSync(join(UI, 'registry/ui.json'), 'utf8'))
  const item = items.find((i) => i.name === name)!
  const files = item.files.map((file) => {
    const at = posix.dirname(file.path.replace(/^src\//, ''))
    const content = readFileSync(join(UI, file.path), 'utf8').replace(/(from\s*)(['"])(\.{1,2}\/[^'"]+)\2/g, (_, lead: string, q: string, rel: string) => `${lead}${q}@/${posix.normalize(posix.join(at, rel))}${q}`)
    return { ...file, content }
  })
  return { ...item, files }
}

describe('what a copied file imports', () => {
  it('reads real import and export-from statements only, not prose in strings, templates, comments or regexes', () => {
    const src = [
      "import { a } from 'pkg-a'",
      "import type { B } from '@scope/pkg-b/sub'",
      "export * from './local'",
      "import 'side-effect'",
      "const lazy = () => import('lazy-pkg')",
      "const copy = { channelsDescription: 'Where this period’s orders came from', title: `Imported from ${'x'} 'nowhere'` }",
      "const s = 'came from' + ' \\'' + \"import 'not-this'\"",
      '// import { c } from "commented"',
      "/* export { d } from 'blocked' */",
      "const re = /from 'regexed'/",
      "const list = Array.from('abc')",
      '<p>Don\'t import from "jsx-text"</p>',
      "export { e } from 'pkg-e'",
    ].join('\n')
    expect(moduleSpecifiers(src)).toEqual(['pkg-a', '@scope/pkg-b/sub', './local', 'side-effect', 'lazy-pkg', 'pkg-e'])
    expect(codeOnly(src)).toHaveLength(src.length)
  })

  it('refuses to run an install with something that is not a package name', () => {
    expect(isPackageName('@youj/react')).toBe(true)
    expect(isPackageName(', channelsSummary: (top: string')).toBe(false)
    expect(() => installCommand('pnpm', ['recharts@^3', ', channelsSummary: (top:'])).toThrow(CliError)
    expect(installCommand('pnpm', ['recharts@^3', '@youj/react@^0.1.0']).args).toEqual(['add', 'recharts@^3', '@youj/react@^0.1.0'])
  })

  it('adds app-analytics-overview installing only packages its files import, not words from its copy strings', async () => {
    const root = onPackage()
    const block = realItem('app-analytics-overview')
    expect(block.files.find((f) => f.target.endsWith('copy.ts'))!.content).toMatch(/came from'/)
    const deps = (block.registryDependencies ?? []).map((name) => ({ name, files: [] }))
    const runner = fakeRunner(root)
    await add(root, ['app-analytics-overview'], [], runner, noPrompts(), stubRegistry([block, ...deps]))
    expect(existsSync(join(root, 'src/blocks/app/analytics-overview/copy.ts'))).toBe(true)
    const installed = runner.commands.flatMap((c) => c.split(' ').slice(2)).map((spec) => spec.slice(0, spec.lastIndexOf('@') > 0 ? spec.lastIndexOf('@') : undefined))
    expect(installed.every(isPackageName)).toBe(true)
    expect(installed).not.toContain(',')
    expect(installed).toContain('recharts')
  })
})

describe('add the illustration kit, in an app on the package', () => {
  const graphics = 'src/components/youj/graphics'
  const file = (target: string, content: string) => ({ path: `src/${target}`, target, type: 'registry:component', content })
  const KIT = [
    {
      name: 'illustration-kit',
      files: [file('components/youj/graphics/illustrations/kit.tsx', "import { IsoScene } from '../iso-scene'\nimport { project } from '../iso'\nimport { DASH } from '../tones'\nexport const IllustrationStage = [IsoScene, project, DASH]\n")],
      registryDependencies: ['https://www.youj.dev/r/iso-scene.json'],
    },
    {
      name: 'iso-shapes',
      files: [
        file('components/youj/graphics/iso-box.tsx', "import { useIsoScene } from './iso-scene'\nexport const IsoBox = useIsoScene\n"),
        file('components/youj/graphics/iso-cylinder.tsx', "import { IsoBox } from './iso-box'\nexport const IsoCylinder = IsoBox\n"),
      ],
      registryDependencies: ['https://www.youj.dev/r/iso-scene.json'],
    },
    {
      name: 'iso-scene',
      files: [
        file('components/youj/graphics/iso-scene.tsx', 'export const IsoScene = 1\nexport const useIsoScene = 1\n'),
        file('components/youj/graphics/iso.ts', 'export const project = 1\n'),
        file('components/youj/graphics/tones.ts', 'export const DASH = 1\n'),
      ],
    },
  ]

  it("copies the kit and the shapes the builder's code imports, their scene pointed at @youj/illustrations", async () => {
    const root = onPackage()
    fakePackage(root, '@youj/illustrations')
    write(root, 'package.json', JSON.stringify({ ...JSON.parse(read(root, 'package.json')), dependencies: { ...JSON.parse(read(root, 'package.json')).dependencies, '@youj/illustrations': '^0.1.0' } }))
    await add(root, ['illustration-kit', 'iso-shapes'], [], fakeRunner(root), noPrompts(), stubRegistry([...REGISTRY, ...KIT]))
    // One IsoScene, the package's: the copied stage and shapes share it with every scene drawn from the package.
    expect(read(root, `${graphics}/illustrations/kit.tsx`)).toBe(
      "import { IsoScene, project } from '@youj/illustrations'\nimport { DASH } from '@/components/youj/graphics/tones'\nexport const IllustrationStage = [IsoScene, project, DASH]\n",
    )
    expect(read(root, `${graphics}/iso-box.tsx`)).toBe("import { useIsoScene } from '@youj/illustrations'\nexport const IsoBox = useIsoScene\n")
    expect(read(root, `${graphics}/iso-cylinder.tsx`)).toBe("import { IsoBox } from './iso-box'\nexport const IsoCylinder = IsoBox\n")
    // What the package has but doesn't export is copied beside them; the scene isn't.
    expect(read(root, `${graphics}/tones.ts`)).toBe('export const DASH = 1\n')
    expect(existsSync(join(root, `${graphics}/iso-scene.tsx`))).toBe(false)
    // Copied on purpose, so doctor doesn't call them leftovers of what the package ships.
    expect(doctor(root, {}).filter((c) => c.message.includes('duplicate'))).toEqual([])
  })
})

describe('add, and the stylesheet a copied item needs', () => {
  it('imports @youj/illustrations/styles.css when an example brings a block that uses it, so doctor agrees', async () => {
    const root = onPackage()
    const items = [
      { ...blockItem('app-empty'), registryDependencies: ['illustrations'] },
      { name: 'example-demo', type: 'registry:example', files: [{ path: 'src/examples/demo/demo.tsx', target: 'examples/demo/demo.tsx', content: "import { Empty } from '@/blocks/app/empty'\nexport const Demo = Empty\n" }], registryDependencies: ['app-empty'] },
      { name: 'illustrations', files: [{ path: 'src/components/youj/graphics/scenes/coffee.tsx', target: 'components/youj/graphics/scenes/coffee.tsx', content: 'export const CoffeeScene = 1\n' }] },
    ]
    const registry = stubRegistry(items)
    const runner = fakeRunner(root)
    await add(root, ['example-demo'], [], runner, noPrompts(), registry)
    // The app lists @youj/react alone, so the install names @youj/core too: the peer it should own.
    expect(runner.commands).toEqual(['bun add @youj/illustrations@^0.1.0 @youj/core@^0.1.0'])
    expect(read(root, 'src/index.css')).toBe("@import 'tailwindcss';\n@import '@youj/react/styles.css';\n@import '@youj/illustrations/styles.css';\n")
    expect(doctor(root, {}).filter((c) => c.message.includes('styles.css'))).toEqual([expect.objectContaining({ level: 'ok' })])
  })

  it('warns when <html> has a right-to-left lang and no dir, and stays quiet with one', () => {
    const root = onPackage()
    const html = read(root, 'index.html')
    write(root, 'index.html', html.replace('lang="en"', 'lang="ar"'))
    expect(doctor(root, {}).find((c) => c.message.includes('right-to-left'))).toMatchObject({ level: 'warn' })
    write(root, 'index.html', html.replace('lang="en"', 'lang="ar" dir="rtl"'))
    expect(doctor(root, {}).find((c) => c.message.includes('right-to-left'))).toBeUndefined()
    write(root, 'index.html', html)
    expect(doctor(root, {}).find((c) => c.message.includes('right-to-left'))).toBeUndefined()
  })
})
