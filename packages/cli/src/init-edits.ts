import { importSpecifier } from './alias'
import {
  addAfterImports,
  addAstroTailwind,
  addNamedImports,
  addSideEffectImport,
  addTagAttributes,
  addToHead,
  addVitePlugin,
  POSTCSS_CONFIG,
  styleOf,
  wrapElement,
  wrapTagContents,
} from './codemods'
import { PACKAGES, PRESET_MOTION, REGISTRY_NAMESPACE, REGISTRY_TOKEN_ENV, registryTemplate, type Mode, type Motion, type Quality, type ThemeId } from './constants'
import type { Entry, Framework } from './detect'
import { themeScriptCode } from '../../core/src/lib/youj/theme-script'
import type { RegistryFiles } from './init-files'
import type { YoujLook } from './look'
import { importPath, Project } from './project'
// The edits `init` makes to an app's files, one landmark each (codemods.ts).

export interface Choices {
  mode: Mode
  theme: ThemeId
  motion: Motion
  quality: Quality
  look: YoujLook
}

/** The kit's fonts a preset names (fonts.ts, fontsourcePackages), imported once where the app imports its global stylesheet. */
export function importFontsource(project: Project, entry: Entry, packages: string[], manual: string[]) {
  if (!packages.length) return
  const file = entry.styles
  const source = file && project.read(file)
  if (!file || !source) return void manual.push(`Import the preset's fonts in your app's root: ${packages.map((p) => `import '${p}'`).join('; ')}.`)
  project.write(file, packages.reduce((out, spec) => addSideEffectImport(out, spec, file.endsWith('.astro')), source))
}

/**
 * suppressHydrationWarning on a server-rendered, hydrated <html>: ThemeScript
 * (and next-themes) set the scheme on it before React hydrates, which is the
 * one difference React would otherwise report.
 */
export function hydrationSafeHtml(project: Project, framework: Framework, entry: Entry) {
  if (framework !== 'next-app' && framework !== 'react-router') return
  const source = entry.document && project.read(entry.document)
  if (!source) return
  const edited = addTagAttributes(source, 'html', 'suppressHydrationWarning', /suppressHydrationWarning/)
  if (edited && edited !== source) project.write(entry.document!, edited)
}

export function setupTailwind(project: Project, framework: Framework, manual: string[]): string[] {
  if (framework === 'next-app' || framework === 'next-pages') {
    const config = project.find('postcss.config.mjs', 'postcss.config.js', 'postcss.config.cjs', 'postcss.config.ts', '.postcssrc.json')
    if (!config) project.write('postcss.config.mjs', POSTCSS_CONFIG)
    else if (!project.read(config)!.includes('@tailwindcss/postcss')) manual.push(`Add '@tailwindcss/postcss': {} to the plugins in ${config}.`)
    return ['tailwindcss', '@tailwindcss/postcss']
  }
  const astro = framework === 'astro'
  const config = astro
    ? project.find('astro.config.mjs', 'astro.config.ts', 'astro.config.mts', 'astro.config.js')
    : project.find('vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs')
  const edited = config && (astro ? addAstroTailwind : addVitePlugin)(project.read(config)!)
  if (config && edited) project.write(config, edited)
  else manual.push(`Add the Tailwind plugin to ${config ?? (astro ? 'astro.config.mjs' : 'vite.config.ts')}: import tailwindcss from '@tailwindcss/vite', then ${astro ? 'vite: { plugins: [tailwindcss()] }' : 'plugins: [tailwindcss(), …]'}.`)
  return ['tailwindcss', '@tailwindcss/vite']
}

export function importStylesheet(project: Project, entry: Entry, sheet: string, manual: string[]) {
  const file = entry.styles
  const source = file && project.read(file)
  if (!file || source === null || source === undefined) {
    manual.push(`Import ${sheet} from your app's root.`)
    return
  }
  const spec = importPath(file, sheet)
  if (file.endsWith('.astro')) {
    const { quote } = styleOf(source)
    const line = `import ${quote}${spec}${quote}`
    project.write(file, source.startsWith('---') ? source.replace(/^---[^\n]*\n/, (m) => `${m}${line}\n`) : `---\n${line}\n---\n\n${source}`)
    return
  }
  const { quote, semi } = styleOf(source)
  const line = `import ${quote}${spec}${quote}${semi}`
  project.write(file, addAfterImports(source, line).replace(`\n${line}\n`, `${line}\n`))
}

/** A components.json registry: its URL template, or that with the headers shadcn sends. */
type RegistryConfig = string | { url: string; headers?: Record<string, string> }

export function writeComponentsJson(project: Project, framework: Framework, sheet: string, entry: Entry, env: NodeJS.ProcessEnv, manual: string[]) {
  const url = registryTemplate(env)
  // With a registry token (a private registry), shadcn sends it as well: it fills ${VAR} in from the environment or .env.local.
  const youj: RegistryConfig = env[REGISTRY_TOKEN_ENV]?.trim() ? { url, headers: { Authorization: `Bearer \${${REGISTRY_TOKEN_ENV}}` } } : url
  const current = project.json<Record<string, unknown> & { registries?: Record<string, RegistryConfig> }>('components.json')
  if (current) {
    const registries = current.registries ?? {}
    const existing = registries[REGISTRY_NAMESPACE]
    const existingUrl = typeof existing === 'string' ? existing : existing?.url
    if (existingUrl === url && (typeof existing === 'object' || typeof youj === 'string')) return
    if (existingUrl && existingUrl !== url) manual.push(`components.json maps ${REGISTRY_NAMESPACE} to ${existingUrl}, not ${url}; left as is.`)
    else project.write('components.json', JSON.stringify({ ...current, registries: { ...registries, [REGISTRY_NAMESPACE]: youj } }, null, 2) + '\n')
  } else {
    const tsx = !entry.root || /\.tsx?$/.test(entry.root) || entry.root.endsWith('.astro')
    project.write(
      'components.json',
      JSON.stringify(
        {
          $schema: 'https://ui.shadcn.com/schema.json',
          style: 'base-nova',
          rsc: framework === 'next-app',
          tsx,
          tailwind: { config: '', css: sheet, baseColor: 'neutral', cssVariables: true, prefix: '' },
          iconLibrary: 'lucide',
          aliases: { components: '@/components', utils: '@/lib/utils', ui: '@/components/ui', lib: '@/lib', hooks: '@/hooks' },
          registries: { [REGISTRY_NAMESPACE]: youj },
        },
        null,
        2,
      ) + '\n',
    )
  }
}

/**
 * The visitor's light, dark or system choice on <html> before the page
 * paints, so nothing flashes and an uncontrolled ThemeToggle just works:
 * ThemeScript (from the package) in a server-rendered document's head, or
 * the same code inline in a static index.html or Astro layout. With no stored
 * choice it follows the operating system. An app on next-themes has its own
 * script, so it gets a note; a document on copied source, which has no
 * ThemeScript, stays dark by default.
 */
export function themeScript(project: Project, framework: Framework, entry: Entry, mode: Mode, deps: Record<string, string>, manual: string[]) {
  const document = entry.document
  const source = document && project.read(document)
  if (!document || !source) return
  if (deps['next-themes']) {
    manual.push('next-themes sets the colour scheme here: give its ThemeProvider attribute="data-theme" (Youj follows data-theme).')
    return
  }
  const present = /ThemeScript|localStorage\.getItem\(k\)|\sdata-theme=/
  const react = framework === 'next-app' || framework === 'next-pages' || framework === 'react-router'
  if (react && mode === 'registry') {
    const tag = framework === 'next-pages' ? 'Html' : 'html'
    const edited = addTagAttributes(source, tag, 'data-theme="dark"', /\sdata-theme=/)
    if (edited === null) manual.push(`Add data-theme="dark" to <${tag}> in ${document}: Youj is dark by default (leave it off for light).`)
    else if (edited !== source) project.write(document, edited)
    return
  }
  const inline = `<script${framework === 'astro' ? ' is:inline' : ''}>${themeScriptCode()}</script>`
  const edited = react ? addToHead(source, '<ThemeScript />', present, framework === 'next-pages' ? 'Head' : 'head') : addToHead(source, inline, present)
  if (edited === null) return void manual.push(`Add the early theme script to <head> in ${document}: ${react ? `<ThemeScript /> from ${PACKAGES.react}` : inline}.`)
  if (edited !== source) project.write(document, react ? addNamedImports(edited, PACKAGES.react, ['ThemeScript']) : edited)
}

export function addProvider(project: Project, framework: Framework, entry: Entry, choices: Choices, files: RegistryFiles | null, manual: string[]) {
  const { theme: preset, motion, quality } = choices
  const custom = motion !== PRESET_MOTION[preset]
  const expr = custom ? 'theme' : preset
  // No size props: the provider's own, standard size. A dense pro tool opts into density="compact" scaling="90%".
  const open = `<YoujProvider theme={${expr}}${quality === 'auto' ? '' : ` quality="${quality}"`}>`
  const close = '</YoujProvider>'
  const themeNames = [...(custom ? ['defineTheme'] : []), preset]

  /** Imports `names` (and declares the custom theme) in `file`. */
  const withImports = (file: string, source: string, names: string[]) => {
    let out = source
    if (files) {
      const provider = names.filter((n) => n === 'YoujProvider')
      const theme = names.filter((n) => n !== 'YoujProvider')
      if (provider.length) out = addNamedImports(out, importSpecifier(project, file, files.provider).replace(/\.[jt]sx$/, ''), provider)
      if (theme.length) out = addNamedImports(out, importSpecifier(project, file, files.theme), theme)
    } else out = addNamedImports(out, PACKAGES.core, names)
    if (custom) out = addAfterImports(out, `const theme = defineTheme({ ...${preset}, motionPersonality: '${motion}' })${styleOf(source).semi}`)
    return out
  }

  /** Wraps the React root and spreads themeProps on the server-rendered <html>. */
  const wrap = (file: string | null, edit: (source: string) => string | null, what: string) => {
    const source = file && project.read(file)
    if (!file || !source) return void manual.push(`Wrap your app in ${open}…${close} (couldn’t find ${what}).`)
    if (source.includes('YoujProvider')) return
    const edited = edit(source)
    if (edited === null) return void manual.push(`Wrap your app in ${open}…${close} in ${file} (couldn’t find ${what} in it).`)
    project.write(file, withImports(file, edited, ['YoujProvider', ...themeNames]))
  }
  const themeHtml = (file: string | null, tag: string) => {
    const source = file && project.read(file)
    if (!file || !source) return
    const edited = addTagAttributes(source, tag, `{...themeProps(${expr})}`, /themeProps\(/)
    if (edited === null) return void manual.push(`Spread {...themeProps(${expr})} on <${tag}> in ${file}, so the theme is in the server HTML.`)
    if (edited !== source) project.write(file, withImports(file, edited, ['themeProps', ...themeNames]))
  }
  const themeAttributes = (file: string | null) => {
    const source = file && project.read(file)
    if (!file || !source) return
    const edited = addTagAttributes(source, 'html', `data-yj-theme="${preset}" data-yj-motion="${motion}"`, /data-yj-theme/)
    if (edited === null) manual.push(`Add data-yj-theme="${preset}" data-yj-motion="${motion}" to <html> in ${file}.`)
    else project.write(file, edited)
  }

  switch (framework) {
    case 'next-app':
    case 'react-router':
      wrap(entry.root, (s) => wrapTagContents(s, 'body', open, close), '<body>')
      themeHtml(entry.document, 'html')
      break
    case 'next-pages':
      wrap(entry.root, (s) => wrapElement(s, /<Component\s+\{\.\.\.pageProps\}\s*\/>/, open, close), '<Component {...pageProps} />')
      themeHtml(entry.document, 'Html')
      break
    case 'vite':
      wrap(entry.root, (s) => wrapElement(s, /<App\s*\/>/, open, close), '<App />')
      themeAttributes(entry.document)
      break
    case 'astro':
      // Astro renders no React root: the page is themed by attributes, and an
      // island that wants Speed or quality settings wraps itself.
      themeAttributes(entry.document)
      break
  }
}
