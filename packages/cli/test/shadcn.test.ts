import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { add } from '../src/add'
import { dropShadcnLeftovers, isViteStarterCss } from '../src/codemods'
import { brokenImports, exportedNames, isStockUtils, mergeUtils } from '../src/collisions'
import { essence } from '../src/copy'
import { doctor, typecheck } from '../src/doctor'
import { init } from '../src/init'
import { Project } from '../src/project'
import { format, type Command, type Runner } from '../src/run'
import { CliError, silentUi } from '../src/ui'
import { fixture, read, write } from './helpers'

/** Youj's lib/utils.ts, as youj-ui-core copies it: an extended cn and the helpers its components import. */
const YOUJ_UTILS = `import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/* youj's cn, taught the utilities ui.css adds. */
const twMerge = extendTailwindMerge({ extend: { theme: { text: ['ui'] } } })

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number) {
  return \`\${bytes} B\`
}
`
/** Youj's dialog and an item built on it, for `add`: it imports what only Youj's dialog exports. */
const YOUJ_DIALOG = "'use client'\nimport { useYouj } from '@/lib/youj/provider'\nexport function Dialog() {}\nexport const dialogPopupClass = 'yj-dialog'\n"
const YOUJ_ALERT_DIALOG = "'use client'\nimport { useYouj } from '@/lib/youj/provider'\nimport { Dialog, dialogPopupClass } from '@/components/ui/dialog'\nimport { cn, formatBytes } from '@/lib/utils'\nexport function AlertDialog() {}\n"

/**
 * Stands in for `shadcn add`: like the real one, with --overwrite it writes over
 * what's there, and without it, it stops at the first file that differs (a run
 * without a terminal never gets an answer). `core` sets which of the core's
 * files it gets to write before it stops (a copy cut short).
 */
function shadcn(root: string, { core = 'all', files = {}, fail = false }: { core?: 'all' | 'half'; files?: Record<string, string>; fail?: boolean } = {}) {
  const commands: string[] = []
  const runner = (async (command: Command) => {
    commands.push(format(command))
    if (!command.args.some((a) => a.startsWith('shadcn@'))) return ''
    if (!command.args.includes('--overwrite')) throw new Error('The file utils.ts already exists. Would you like to overwrite?')
    const writes: Record<string, string> = { ...files }
    if (command.args.some((a) => /youj-core/.test(a))) {
      writes['styles/youj.css'] = '/* tokens */\n'
      if (core === 'all') {
        writes['styles/ui.css'] = '/* bridge */\n'
        writes['lib/youj/provider.tsx'] = "'use client'\nexport function YoujProvider() {}\n"
        writes['lib/youj/theme/index.ts'] = 'export {}\n'
        writes['lib/utils.ts'] = YOUJ_UTILS
      }
    }
    if (core === 'all' && command.args.some((a) => /youj-look-bezel/.test(a))) writes['styles/bezel.css'] = '@layer utilities {}\n'
    if (core === 'all' && command.args.some((a) => /youj-shadcn-compat/.test(a))) writes['styles/shadcn.css'] = '/* shadcn names on roles */\n'
    // Like shadcn, it leaves a file that's already the same untouched.
    for (const [path, content] of Object.entries(writes)) if (!existsSync(join(root, path)) || read(root, path) !== content) write(root, path, content)
    if (fail) throw new Error('shadcn exited with 1')
    return '✔ Checking registry.\n'
  }) as Runner
  return { runner, commands }
}

const LAYOUT = 'app/layout.tsx'

describe('init in a stock shadcn app', () => {
  it('removes shadcn’s dark variant, accent mapping and variable blocks, keeps the rest, and names the app’s own components', async () => {
    const root = fixture('shadcn')
    const { runner } = shadcn(root)
    const ui = silentUi()
    const result = await init({ cwd: root, yes: true }, runner, ui, {})
    const css = read(root, 'app/globals.css')
    expect(css).toBe(
      '@import "tailwindcss";\n@import "tw-animate-css";\n@import "@youj/react/styles.css";\n@import "@youj/react/shadcn.css";\n\n@theme inline {\n  --font-sans: var(--font-geist-sans);\n  --font-mono: var(--font-geist-mono);\n}\n\n@layer base {\n  * {\n    @apply border-border outline-ring/50;\n  }\n  body {\n    @apply bg-background text-foreground;\n  }\n}\n',
    )
    expect(result.manual.join('\n')).not.toContain('--background')
    expect(ui.log.join('\n')).toContain("info: Removed shadcn's leftovers from app/globals.css: @custom-variant dark; the @theme inline block's shadcn mappings")
    expect(result.shadcn).toEqual(['button', 'dialog', 'input', 'label'])
    // Its own components stay as they are.
    expect(read(root, 'components/ui/button.tsx')).toContain('@radix-ui/react-slot')
  })

  it('asks before removing them in a terminal, after showing the diff, and leaves them on a no', async () => {
    const root = fixture('shadcn')
    const ui = { ...silentUi(), confirm: async (message: string) => !message.startsWith("Remove shadcn's leftovers") }
    const result = await init({ cwd: root, yes: false, mode: 'package', theme: 'basalt', motion: 'precise', look: 'bezel', quality: 'auto' }, shadcn(root).runner, ui, {})
    expect(read(root, 'app/globals.css')).toContain('@custom-variant dark (&:is(.dark *));')
    expect(result.manual).toContainEqual(expect.stringMatching(/^Remove shadcn's leftovers from app\/globals\.css: @custom-variant dark;/))
  })

  it('on the registry, with no terminal: never lets shadcn ask, replaces shadcn’s stock lib/utils.ts with Youj’s and copies the compat sheet in', async () => {
    const root = fixture('shadcn')
    const { runner, commands } = shadcn(root)
    const ui = silentUi()
    await init({ cwd: root, yes: true, mode: 'registry' }, runner, ui, {})
    expect(commands).toEqual([
      'npx --yes shadcn@4.21.0 add @youj/youj-core @youj/youj-ui-core @youj/youj-shadcn-compat --yes --overwrite',
      'npm install @fontsource-variable/inter@^5 @fontsource-variable/jetbrains-mono@^5',
    ])
    expect(read(root, 'lib/utils.ts')).toBe(YOUJ_UTILS)
    expect(existsSync(join(root, 'lib/utils.local.ts'))).toBe(false)
    expect(ui.log.join('\n')).toContain("lib/utils.ts: replaced shadcn's stock cn with Youj's")
    // shadcn's names on Youj's roles, copied in as the youj-shadcn-compat item, right after ui.css.
    expect(read(root, 'app/globals.css')).toContain('@import "../styles/youj.css";\n@import "../styles/ui.css";\n@import "../styles/shadcn.css";')
    expect(read(root, LAYOUT)).toContain('<YoujProvider')
  })

  it('keeps the app’s own helpers from lib/utils.ts: moved beside it, and re-exported from Youj’s', async () => {
    const root = fixture('shadcn')
    const own = `${read(root, 'lib/utils.ts')}\nexport function absoluteUrl(path: string) {\n  return \`https://acme.dev\${path}\`\n}\n\nexport function formatBytes(n: number) {\n  return String(n)\n}\n`
    write(root, 'lib/utils.ts', own)
    const ui = silentUi()
    await init({ cwd: root, yes: true, mode: 'registry' }, shadcn(root).runner, ui, {})
    expect(read(root, 'lib/utils.local.ts')).toBe(own)
    const utils = read(root, 'lib/utils.ts')
    expect(utils.startsWith(YOUJ_UTILS.trimEnd())).toBe(true)
    expect(utils.trimEnd().endsWith("export * from './utils.local'")).toBe(true)
    expect(ui.log.join('\n')).toContain("Youj's formatBytes takes the place of yours")
    // A later add that copies Youj's utils again leaves the merged file as it is.
    const merged = mergeUtils(new Project(root), 'lib/utils.ts', utils, YOUJ_UTILS, (a, b) => essence(a) === essence(b))
    expect(merged.kind).toBe('same')
  })

  it('stops with an error, before touching the stylesheet or layout, when the core arrives half copied', async () => {
    const root = fixture('shadcn')
    const css = read(root, 'app/globals.css')
    const layout = read(root, LAYOUT)
    const run = init({ cwd: root, yes: true, mode: 'registry' }, shadcn(root, { core: 'half' }).runner, silentUi(), {})
    await expect(run).rejects.toBeInstanceOf(CliError)
    await expect(run).rejects.toThrow(/The core didn't copy completely \(missing: styles\/ui\.css, lib\/youj\/provider\.tsx, styles\/shadcn\.css\)/)
    expect(read(root, 'app/globals.css')).toBe(css)
    expect(read(root, LAYOUT)).toBe(layout)
    // A run after that copies the core again rather than calling it set up.
    const again = shadcn(root)
    await init({ cwd: root, yes: true, mode: 'registry' }, again.runner, silentUi(), {})
    expect(again.commands.filter((c) => c.includes('shadcn'))).toEqual([expect.stringContaining('add @youj/youj-core')])
    expect(read(root, 'app/globals.css')).toContain('../styles/ui.css')
  })

  it('stops with an error when shadcn fails, and puts back the files it replaced', async () => {
    const root = fixture('shadcn')
    const utils = read(root, 'lib/utils.ts')
    const run = init({ cwd: root, yes: true, mode: 'registry' }, shadcn(root, { fail: true }).runner, silentUi(), {})
    await expect(run).rejects.toThrow(/Copying the core failed, so init stopped/)
    expect(read(root, 'lib/utils.ts')).toBe(utils)
    expect(read(root, 'app/globals.css')).not.toContain('styles/youj.css')
  })

  it('stops when a file of the app’s own is where the core goes', async () => {
    const root = fixture('shadcn')
    write(root, 'styles/ui.css', '.mine {}\n')
    await expect(init({ cwd: root, yes: true, mode: 'registry' }, shadcn(root).runner, silentUi(), {})).rejects.toThrow(/Files of your own are where Youj's core goes[\s\S]*styles\/ui\.css/)
    expect(read(root, 'styles/ui.css')).toBe('.mine {}\n')
  })
})

describe('add over a shadcn app’s components', () => {
  async function registryApp() {
    const root = fixture('shadcn')
    await init({ cwd: root, yes: true, mode: 'registry' }, shadcn(root).runner, silentUi(), {})
    return root
  }

  it('stops with exit code 1 when a Youj component needs Youj’s version of a file the app keeps', async () => {
    const root = await registryApp()
    const theirs = read(root, 'components/ui/dialog.tsx')
    const { runner } = shadcn(root, { files: { 'components/ui/dialog.tsx': YOUJ_DIALOG, 'components/ui/alert-dialog.tsx': YOUJ_ALERT_DIALOG } })
    const run = add(root, ['alert-dialog'], [], runner, silentUi(), {})
    await expect(run).rejects.toBeInstanceOf(CliError)
    await expect(run).rejects.toThrow(/components\/ui\/dialog\.tsx \(not Youj's: shadcn's, or your own\): alert-dialog\.tsx imports dialogPopupClass[\s\S]*npx youj add alert-dialog --overwrite/)
    expect(read(root, 'components/ui/dialog.tsx')).toBe(theirs)
    // Run again, with the item's own files already in place: it stops all the same.
    await expect(add(root, ['alert-dialog'], [], runner, silentUi(), {})).rejects.toThrow(/npx youj add alert-dialog --overwrite/)
  })

  it('replaces them when you say so in a terminal', async () => {
    const root = await registryApp()
    const { runner } = shadcn(root, { files: { 'components/ui/dialog.tsx': YOUJ_DIALOG, 'components/ui/alert-dialog.tsx': YOUJ_ALERT_DIALOG } })
    const ui = { ...silentUi(), confirm: async () => true }
    await add(root, ['alert-dialog'], [], runner, ui, {}, true)
    expect(read(root, 'components/ui/dialog.tsx')).toBe(YOUJ_DIALOG)
  })

  it('replaces them with --overwrite, and merges lib/utils.ts all the same', async () => {
    const root = fixture('shadcn')
    write(root, 'lib/utils.ts', `${read(root, 'lib/utils.ts')}\nexport const absoluteUrl = (p: string) => p\n`)
    await init({ cwd: root, yes: true, mode: 'registry' }, shadcn(root).runner, silentUi(), {})
    const { runner } = shadcn(root, { files: { 'components/ui/dialog.tsx': YOUJ_DIALOG, 'components/ui/alert-dialog.tsx': YOUJ_ALERT_DIALOG, 'lib/utils.ts': YOUJ_UTILS } })
    await add(root, ['alert-dialog'], ['--overwrite'], runner, silentUi(), {})
    expect(read(root, 'components/ui/dialog.tsx')).toBe(YOUJ_DIALOG)
    expect(read(root, 'lib/utils.ts')).toContain("export * from './utils.local'")
    expect(read(root, 'lib/utils.local.ts')).toContain('absoluteUrl')
  })

  it('keeps a Youj file you edited that still has what Youj’s code imports, with a note', async () => {
    const root = await registryApp()
    write(root, 'components/ui/dialog.tsx', `${YOUJ_DIALOG}// tuned\n`)
    const ui = silentUi()
    const { runner } = shadcn(root, { files: { 'components/ui/dialog.tsx': YOUJ_DIALOG, 'components/ui/alert-dialog.tsx': YOUJ_ALERT_DIALOG } })
    await add(root, ['alert-dialog'], [], runner, ui, {})
    expect(ui.log.join('\n')).toContain("warn: Kept your version of 1 file that differs from Youj's:\n  components/ui/dialog.tsx")
  })

  it('says the app isn’t wired yet when items land in an app init never set up', async () => {
    const root = fixture('shadcn')
    write(root, 'components.json', JSON.stringify({ ...JSON.parse(read(root, 'components.json')), registries: { '@youj': 'https://www.youj.dev/r/{name}.json' } }))
    const ui = silentUi()
    await add(root, ['button'], [], shadcn(root, { files: { 'styles/youj.css': '/* tokens */\n' } }).runner, ui, {})
    expect(ui.log.join('\n')).toContain("warn: Youj isn't wired into this app yet: app/globals.css doesn't import the copied youj.css and ui.css, so the items have none of Youj's tokens, and nothing renders YoujProvider. Run npx youj init --mode registry")
  })
})

describe('doctor in a shadcn app', () => {
  it('fails on shadcn’s leftovers in the stylesheet', () => {
    const root = fixture('shadcn')
    const pkg = JSON.parse(read(root, 'package.json'))
    write(root, 'package.json', JSON.stringify({ ...pkg, dependencies: { ...pkg.dependencies, '@youj/react': '^0.1.0' } }))
    write(root, 'app/globals.css', read(root, 'app/globals.css').replace('@import "tw-animate-css";', '@import "tw-animate-css";\n@import "@youj/react/styles.css";'))
    const errors = doctor(root, {}).filter((c) => c.level === 'error').map((c) => c.message)
    expect(errors).toContainEqual(expect.stringMatching(/redefines the dark variant/))
    expect(errors).toContainEqual(expect.stringMatching(/maps --color-sidebar-accent-foreground, --color-sidebar-accent, --color-accent-foreground, --color-accent to shadcn's --accent/))
    expect(errors).toContainEqual(expect.stringMatching(/sets --background, .* \(shadcn's :root and \.dark blocks\)/))
  })

  it('fails on a stylesheet import of a file that isn’t there', async () => {
    const root = fixture('shadcn')
    await init({ cwd: root, yes: true, mode: 'registry' }, shadcn(root).runner, silentUi(), {})
    expect(doctor(root, {}).filter((c) => c.level === 'error')).toEqual([])
    write(root, 'app/globals.css', read(root, 'app/globals.css').replace('../styles/ui.css', '../styles/missing.css'))
    expect(doctor(root, {}).filter((c) => c.level === 'error').map((c) => c.message)).toContainEqual("app/globals.css imports ../styles/missing.css, which isn't there")
  })

  it('fails when copied Youj source imports a shadcn component in place of Youj’s', async () => {
    const root = fixture('shadcn')
    await init({ cwd: root, yes: true, mode: 'registry' }, shadcn(root).runner, silentUi(), {})
    write(root, 'components/ui/alert-dialog.tsx', YOUJ_ALERT_DIALOG)
    const error = doctor(root, {}).find((c) => c.level === 'error')
    expect(error?.message).toMatch(/components\/ui\/dialog\.tsx \(not Youj's: shadcn's, or your own\): alert-dialog\.tsx imports dialogPopupClass, which it doesn't export/)
    expect(error?.fix).toBe("Replace it with Youj's: npx youj add dialog --overwrite")
  })

  it('warns on shadcn’s color names in a copied Youj file, and not on roles', async () => {
    const root = fixture('shadcn')
    await init({ cwd: root, yes: true, mode: 'registry' }, shadcn(root).runner, silentUi(), {})
    write(root, 'components/ui/badge.tsx', "// youj\nexport const badge = 'bg-canvas text-fg-muted border-line'\n")
    expect(doctor(root, {}).filter((c) => /shadcn's color names/.test(c.message))).toEqual([])
    write(root, 'components/ui/badge.tsx', "// youj\nexport const badge = 'bg-background text-muted-foreground border-border'\n")
    const warning = doctor(root, {}).find((c) => /shadcn's color names/.test(c.message))
    expect(warning).toMatchObject({ level: 'warn', message: expect.stringContaining('components/ui/badge.tsx: bg-background, text-muted-foreground, border-border') })
  })

  it('--strict typechecks the app with its own TypeScript, and fails on its errors', async () => {
    const root = fixture('shadcn')
    write(root, 'node_modules/typescript/bin/tsc', '')
    const failing = (async () => {
      throw new Error("tsc exited with 2\n\ncomponents/ui/alert-dialog.tsx(2,18): error TS2305: Module '\"@/components/ui/dialog\"' has no exported member 'dialogPopupClass'.")
    }) as Runner
    expect(await typecheck(root, failing)).toMatchObject({ level: 'error', message: expect.stringMatching(/^TypeScript: 1 error\n {2}components\/ui\/alert-dialog\.tsx\(2,18\): error TS2305/) })
    const commands: string[] = []
    const passing = (async (command: Command) => void commands.push(command.args.slice(1).join(' '))) as Runner
    expect(await typecheck(root, passing)).toMatchObject({ level: 'ok' })
    expect(commands).toEqual(['--noEmit -p tsconfig.json'])
  })

  it('finds YoujProvider in a file the layout imports', () => {
    const root = fixture('next-app')
    const pkg = JSON.parse(read(root, 'package.json'))
    write(root, 'package.json', JSON.stringify({ ...pkg, dependencies: { ...pkg.dependencies, '@youj/react': '^0.1.0' } }))
    write(root, 'app/providers.tsx', "'use client'\nimport { YoujProvider } from '@youj/core'\nexport function Providers({ children }) {\n  return <YoujProvider>{children}</YoujProvider>\n}\n")
    write(root, LAYOUT, read(root, LAYOUT).replace('import "./globals.css";', 'import "./globals.css";\nimport { Providers } from "./providers";').replace('{children}', '<Providers>{children}</Providers>'))
    expect(doctor(root, {}).map((c) => c.message)).toContain('YoujProvider in app/providers.tsx')
  })
})

describe('what a shadcn stylesheet keeps, and a Vite starter', () => {
  it('leaves create-next-app’s stylesheet and an app’s own variables alone', () => {
    const css = read(fixture('next-app'), 'app/globals.css')
    expect(dropShadcnLeftovers(css)).toEqual({ css, removed: [] })
    const own = ':root {\n  --brand: red;\n}\n'
    expect(dropShadcnLeftovers(own).removed).toEqual([])
  })

  it('keeps a variable of the app’s own in shadcn’s :root block', () => {
    const { css } = dropShadcnLeftovers('@custom-variant dark (&:is(.dark *));\n\n:root {\n  --radius: 0.625rem;\n  --brand: red;\n}\n\n.dark {\n  --background: black;\n}\n')
    expect(css).toBe('\n:root {\n  --brand: red;\n}\n\n')
  })

  it('recognises create-vite’s starter stylesheets, and nothing else', () => {
    const root = fixture('create-vite')
    expect(isViteStarterCss(read(root, 'src/index.css'))).toBe(true)
    expect(isViteStarterCss(read(root, 'src/App.css'))).toBe(true)
    expect(isViteStarterCss(read(fixture('vite'), 'src/index.css'))).toBe(false)
  })
})

describe('init in a fresh create-vite app', () => {
  it('clears the starter styles, so they stop restyling the components', async () => {
    const root = fixture('create-vite')
    const runner = shadcn(root).runner
    await init({ cwd: root, yes: true }, runner, silentUi(), {})
    // What's left is Youj's: Tailwind and the components' stylesheet (Basalt's faces come from @fontsource).
    expect(read(root, 'src/index.css').replace(/^@import url\([^)]*\);\n/, '')).toBe("@import 'tailwindcss';\n@import '@youj/react/styles.css';\n")
    expect(read(root, 'src/App.css')).not.toContain('#center')
    expect(read(root, 'src/main.tsx')).toContain("import './index.css'")
  })

  it('leaves them, with a note, when you say no in a terminal', async () => {
    const root = fixture('create-vite')
    const ui = { ...silentUi(), confirm: async (message: string) => !message.includes('starter styles') }
    const result = await init({ cwd: root, yes: false, mode: 'package', theme: 'basalt', motion: 'precise', look: 'bezel', quality: 'auto' }, shadcn(root).runner, ui, {})
    expect(read(root, 'src/index.css')).toContain('#root')
    expect(result.manual).toContainEqual(expect.stringContaining("Clear create-vite's starter styles from src/index.css and src/App.css"))
  })
})

describe('Tailwind installed, but not in the build', () => {
  /** create-vite after `npm install @youj/react`: npm installed Tailwind as a peer, and nothing compiles it. */
  function viteWithPeerTailwind() {
    const root = fixture('create-vite')
    write(root, 'node_modules/tailwindcss/package.json', JSON.stringify({ name: 'tailwindcss', version: '4.1.13' }))
    return root
  }

  it('init sets the Vite plugin up and installs it', async () => {
    const root = viteWithPeerTailwind()
    const { runner, commands } = shadcn(root)
    await init({ cwd: root, yes: true }, runner, silentUi(), {})
    expect(read(root, 'vite.config.ts')).toContain('plugins: [tailwindcss(), react()]')
    expect(commands).toContainEqual('npm install -D tailwindcss @tailwindcss/vite')
  })

  it("counts create-next-app 16.4's Turbopack loader in next.config as wired: no PostCSS config or plugin added", async () => {
    const root = fixture('next-app')
    rmSync(join(root, 'postcss.config.mjs'))
    const pkg = JSON.parse(read(root, 'package.json'))
    write(root, 'package.json', JSON.stringify({ ...pkg, devDependencies: { '@tailwindcss/turbopack': '^4', tailwindcss: '^4', typescript: '^5' } }))
    write(root, 'node_modules/tailwindcss/package.json', JSON.stringify({ name: 'tailwindcss', version: '4.3.3' }))
    write(root, 'next.config.ts', 'export default {\n  turbopack: { rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } } },\n}\n')
    const { runner, commands } = shadcn(root)
    await init({ cwd: root, yes: true }, runner, silentUi(), {})
    expect(existsSync(join(root, 'postcss.config.mjs'))).toBe(false)
    expect(commands.join('\n')).not.toContain('@tailwindcss/postcss')
    expect(doctor(root, {}).map((c) => c.message).join('\n')).not.toContain('not in the build')
  })

  it('doctor fails on it', () => {
    const root = viteWithPeerTailwind()
    const pkg = JSON.parse(read(root, 'package.json'))
    write(root, 'package.json', JSON.stringify({ ...pkg, dependencies: { ...pkg.dependencies, '@youj/react': '^0.1.0' } }))
    expect(doctor(root, {}).filter((c) => c.level === 'error').map((c) => c.message)).toContainEqual(
      "Tailwind CSS is installed but not in the build (vite.config.ts doesn't use its plugin), so nothing compiles Youj's classes",
    )
  })
})

describe('init, the preset’s own faces', () => {
  it('installs and imports @fontsource for Inter and JetBrains Mono, the faces Basalt, Graphite, Brutal and Terminal name', async () => {
    for (const [theme, fonts] of [
      ['basalt', ['@fontsource-variable/inter', '@fontsource-variable/jetbrains-mono']],
      ['graphite', ['@fontsource-variable/inter', '@fontsource-variable/jetbrains-mono']],
      ['terminal', ['@fontsource-variable/jetbrains-mono']],
    ] as const) {
      const root = fixture('create-vite')
      const { runner, commands } = shadcn(root)
      await init({ cwd: root, yes: true, theme }, runner, silentUi(), {})
      const main = read(root, 'src/main.tsx')
      for (const font of fonts) expect(main, theme).toContain(`import '${font}'`)
      expect(main.match(/@fontsource/g)?.length ?? 0, theme).toBe(fonts.length)
      expect(commands.filter((c) => c.includes('@fontsource')), theme).toEqual(fonts.length ? [`npm install ${fonts.map((f) => `${f}@^5`).join(' ')}`] : [])
    }
  })
})

describe('reading imports and exports', () => {
  it("counts a copy shadcn wrote without the directive and the comment under it (rsc: false) as Youj's", () => {
    const youj = "'use client'\n\n/* The React glue: the hook owns its canvas.\n * Two lines. */\n\nimport { useRef } from 'react'\nexport const x = useRef\n"
    expect(essence("import { useRef } from 'react'\nexport const x = useRef\n")).toBe(essence(youj))
    expect(essence("import { useRef } from 'react'\nexport const y = useRef\n")).not.toBe(essence(youj))
  })

  it('knows shadcn’s stock lib/utils.ts, the clsx one and shadcn 4’s re-export of the cn package', () => {
    expect(isStockUtils(read(fixture('shadcn'), 'lib/utils.ts'))).toBe(true)
    expect(isStockUtils('export { cn } from "cn"\n')).toBe(true)
    expect(isStockUtils('export { cn } from "cn"\nexport const absoluteUrl = (p: string) => p\n')).toBe(false)
  })

  it('reads named, default and re-exported names, and gives up on export *', () => {
    expect([...exportedNames('export function a() {}\nexport const b = 1\nexport { c, d as e }\nexport default f\nexport type G = 1')!].sort()).toEqual(['a', 'b', 'c', 'default', 'e', 'G'].sort())
    expect(exportedNames("export * from './x'")).toBeNull()
  })

  it('finds no broken import where the kept file exports everything', () => {
    const root = fixture('shadcn')
    write(root, 'components/ui/x.tsx', "import { Label } from '@/components/ui/label'\n// youj\n")
    expect(brokenImports(new Project(root), ['components/ui/label.tsx'], ['components/ui/x.tsx'])).toEqual([
      // shadcn's label is built on Radix: never Youj's, whatever it exports.
      { file: 'components/ui/label.tsx', foreign: true, importers: ['components/ui/x.tsx'], missing: [] },
    ])
    write(root, 'components/ui/label.tsx', 'export function Label() {}\n')
    expect(brokenImports(new Project(root), ['components/ui/label.tsx'], ['components/ui/x.tsx'])).toEqual([])
  })
})
