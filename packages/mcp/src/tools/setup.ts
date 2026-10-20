import { hasCssImport, shadcnColorsIn } from '../../../cli/src/codemods'
import { BASE_UI_INSTALL, MOTION_INSTALL, MOTION_RANGE, PACKAGES, THEMES } from '../../../cli/src/constants'
import { majorOf, TAILWIND_IMPORT, unsupportedReact } from '../../../cli/src/versions'
import { DEFAULT_LOOK, type YoujLook } from '@youj/core/lib/youj/look'
import { DEFAULT_PRESET } from '@youj/core/lib/youj/theme/themes/index'
import type { Catalog } from '../catalog'
import { code } from '../format'

/* Setup: `npx @youj/cli init` is the route; the manual steps are here for
 * when a tool can't run it. With a pasted package.json and stylesheet it runs
 * the doctor's checks that don't need the disk, with the CLI's own helpers. */

export const FRAMEWORKS = ['next-app', 'next-pages', 'vite', 'react-router', 'astro'] as const
export type Framework = (typeof FRAMEWORKS)[number]

const NAMES: Record<Framework, string> = {
  'next-app': 'Next.js (App Router)',
  'next-pages': 'Next.js (Pages Router)',
  vite: 'Vite + React',
  'react-router': 'React Router v7',
  astro: 'Astro + React',
}

const STYLESHEET: Record<Framework, string> = {
  'next-app': 'app/globals.css',
  'next-pages': 'styles/globals.css',
  vite: 'src/index.css',
  'react-router': 'app/app.css',
  astro: 'src/styles/global.css',
}

/**
 * The provider per framework, in the default preset: `html` is what follows
 * the theme on <html> (the scheme and the style), `prop` the provider's style
 * prop (none for classic, the default: a root provider writes it itself).
 */
const PROVIDER: Record<Framework, { file: string; code: (html: string, prop: string) => string }> = {
  'next-app': {
    file: 'app/layout.tsx',
    code: (html, prop) =>
      `import { YoujProvider, themeProps, basalt } from '@youj/core'\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en" {...themeProps(basalt)} ${html}>\n      <body>\n        <YoujProvider theme={basalt}${prop}>{children}</YoujProvider>\n      </body>\n    </html>\n  )\n}`,
  },
  'next-pages': {
    file: 'pages/_app.tsx',
    code: (html, prop) =>
      `import type { AppProps } from 'next/app'\nimport { YoujProvider, basalt } from '@youj/core'\nimport '../styles/globals.css'\n\nexport default function App({ Component, pageProps }: AppProps) {\n  return (\n    <YoujProvider theme={basalt}${prop}>\n      <Component {...pageProps} />\n    </YoujProvider>\n  )\n}\n\n// pages/_document.tsx: <Html lang="en" {...themeProps(basalt)} ${html}> so the theme is there before hydration.`,
  },
  vite: {
    file: 'src/main.tsx',
    code: (html, prop) =>
      `import { createRoot } from 'react-dom/client'\nimport { YoujProvider, basalt } from '@youj/core'\nimport App from './App'\nimport './index.css'\n\ncreateRoot(document.getElementById('root')!).render(\n  <YoujProvider theme={basalt}${prop}>\n    <App />\n  </YoujProvider>,\n)\n\n// index.html: <html lang="en" data-yj-theme="basalt" ${html}> for the preset's CSS before React runs.`,
  },
  'react-router': {
    file: 'app/root.tsx',
    code: (html, prop) =>
      `import { YoujProvider, themeProps, basalt } from '@youj/core'\n\nexport function Layout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en" {...themeProps(basalt)} ${html}>\n      <head>{/* Meta, Links */}</head>\n      <body>\n        <YoujProvider theme={basalt}${prop}>{children}</YoujProvider>\n        {/* ScrollRestoration, Scripts */}\n      </body>\n    </html>\n  )\n}`,
  },
  astro: {
    file: 'src/layouts/Layout.astro',
    code: (html) =>
      `<html lang="en" data-yj-theme="basalt" ${html}>\n  <!-- Astro renders no React root: the page is themed by attributes. An island that wants\n       speed or quality settings wraps itself in <YoujProvider>. -->\n</html>`,
  },
}

export interface SetupInput {
  framework?: Framework
  mode?: 'package' | 'registry'
  /** The look (how components are built): classic, the default, or bezel. */
  look?: YoujLook
  packageJson?: string
  css?: string
}

interface Check {
  level: 'ok' | 'warn' | 'error'
  message: string
  fix?: string
}

function detectFramework(deps: Record<string, string>): Framework | undefined {
  if (deps.astro) return 'astro'
  if (deps['@react-router/dev']) return 'react-router'
  if (deps.next) return 'next-app'
  if (deps.vite && deps.react) return 'vite'
  return undefined
}

/** The doctor's checks that work on text: versions from package.json, and the stylesheet's imports and order. */
export function checkSetup(packageJson: string | undefined, css: string | undefined): { checks: Check[]; framework?: Framework } {
  const checks: Check[] = []
  let framework: Framework | undefined
  if (packageJson !== undefined) {
    let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
    try {
      pkg = JSON.parse(packageJson)
    } catch {
      return { checks: [{ level: 'error', message: 'package.json isn’t valid JSON' }] }
    }
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    framework = detectFramework(deps)
    const reactProblem = deps.react && unsupportedReact(deps.react)
    if (!deps.react) checks.push({ level: 'error', message: 'React isn’t a dependency', fix: 'npm install react@^19 react-dom@^19' })
    else if (reactProblem) checks.push({ level: 'error', message: reactProblem, fix: 'npm install react@^19 react-dom@^19' })
    else checks.push({ level: 'ok', message: `React ${majorOf(deps.react) ?? deps.react}` })
    const tw = majorOf(deps.tailwindcss)
    if (tw === null) checks.push({ level: 'error', message: 'Tailwind CSS isn’t a dependency', fix: 'npx @youj/cli init installs Tailwind v4' })
    else if (tw < 4) checks.push({ level: 'error', message: `Tailwind CSS ${tw}: Youj needs v4`, fix: 'npx @tailwindcss/upgrade@latest (commit first)' })
    else checks.push({ level: 'ok', message: `Tailwind CSS v${tw}` })
    const kit = Object.values(PACKAGES).filter((name) => deps[name])
    if (!kit.length) checks.push({ level: 'error', message: 'No Youj package in package.json (the registry route needs none)', fix: 'npx @youj/cli init' })
    else {
      const ranges = new Set(kit.map((name) => deps[name]))
      if (ranges.size > 1) checks.push({ level: 'error', message: `The Youj packages are on different versions (${kit.map((n) => `${n}@${deps[n]}`).join(', ')}); they release together`, fix: 'Put them on one version.' })
      else checks.push({ level: 'ok', message: kit.map((n) => `${n}@${deps[n]}`).join(', ') })
      if (deps[PACKAGES.react] && deps[PACKAGES.motion]) checks.push({ level: 'ok', message: `${PACKAGES.react} already brings ${PACKAGES.motion}; keeping both is fine (blocks import it)` })
    }
    if (deps.motion && !MOTION_RANGE.split('||').map(majorOf).includes(majorOf(deps.motion))) checks.push({ level: 'error', message: `motion ${deps.motion}: Youj needs ${MOTION_RANGE}`, fix: `npm install motion@${MOTION_INSTALL}` })
  }
  if (css !== undefined) {
    const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
    const tw = text.search(TAILWIND_IMPORT)
    const at = (spec: string) => (hasCssImport(text, spec) ? text.search(new RegExp(`@import\\s+['"]${spec.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}['"]`)) : -1)
    const sheets = [`${PACKAGES.react}/styles.css`, '@youj/core/styles.css', `${PACKAGES.motion}/styles.css`, `${PACKAGES.icons}/styles.css`].map((s) => [s, at(s)] as const)
    const copied = /@import\s+['"][^'"]*styles\/youj\.css['"]/.test(text)
    if (tw < 0) checks.push({ level: 'error', message: 'The stylesheet doesn’t import Tailwind', fix: "Start it with @import 'tailwindcss';" })
    const present = sheets.filter(([, i]) => i >= 0)
    if (!present.length && !copied) checks.push({ level: 'error', message: 'The stylesheet doesn’t import Youj’s styles', fix: `Add @import '${PACKAGES.react}/styles.css'; right after @import 'tailwindcss';` })
    else if (tw >= 0 && present.some(([, i]) => i < tw)) checks.push({ level: 'error', message: 'Youj’s styles come before Tailwind', fix: "Move them after @import 'tailwindcss'; (same file)." })
    else if (tw >= 0) checks.push({ level: 'ok', message: 'Tailwind, then Youj, in one stylesheet' })
    if (at(`${PACKAGES.react}/styles.css`) >= 0 && at(`${PACKAGES.motion}/styles.css`) >= 0) checks.push({ level: 'warn', message: `Both ${PACKAGES.motion}/styles.css and ${PACKAGES.react}/styles.css are imported`, fix: `Remove the ${PACKAGES.motion} line: the react stylesheet imports it.` })
    const overrides = shadcnColorsIn(text)
    if (overrides.length) checks.push({ level: 'warn', message: `It sets ${overrides.join(', ')}: @youj/react/shadcn.css maps these shadcn names onto Youj's roles, and these override it in every theme`, fix: 'Rename or remove them (see the "Coming from shadcn/ui" guide).' })
  }
  return { checks, framework }
}

export function setup(catalog: Catalog, input: SetupInput): string {
  const { checks, framework: detected } = checkSetup(input.packageJson, input.css)
  const framework = input.framework ?? detected
  const mode = input.mode ?? 'package'
  const style = input.look ?? DEFAULT_LOOK
  const site = catalog.index.meta.site
  const flags = `${mode === 'registry' ? ' --mode registry' : ''}${style === DEFAULT_LOOK ? '' : ` --look ${style}`}`
  // Classic has no stylesheet; every other style is one, imported right after ui.css.
  const sheet = style === 'classic' ? null : `styles/${style}.css`
  const out = [`# Set up Youj${framework ? ` in ${NAMES[framework]}` : ''}`, '', `Needs React 19 and Tailwind CSS v4. Youj ${catalog.index.meta.version}.`, '', '## One command (recommended)', '', code('bash', `npx @youj/cli init${flags}`), '', `It detects the framework (${Object.values(NAMES).join(', ')}), the package manager and Tailwind, installs Tailwind v4 if missing, asks for the mode, a theme preset (${THEMES.join(', ')}; ${DEFAULT_PRESET} by default), the component style (${DEFAULT_LOOK} by default), the motion personality and quality, then installs, adds the stylesheet after Tailwind, wraps the app in YoujProvider and starts it dark. It shows each change as a diff; re-running changes nothing. \`--yes\` takes the defaults; \`--dry-run\` changes nothing. Then \`npx @youj/cli doctor\` checks the setup any time.`]

  out.push('', '## By hand')
  if (mode === 'registry') {
    const lookItem = sheet ? ` youj-look-${style}` : ''
    const styleImport = sheet ? `\n@import '../${sheet}';` : ''
    out.push('', 'Copy the source in with the Youj CLI (it registers the `@youj` namespace in components.json itself):', code('bash', `npx @youj/cli add youj-core youj-ui-core${lookItem}`), code('css', `/* ${framework ? STYLESHEET[framework] : 'your global stylesheet'} */\n@import 'tailwindcss';\n@import '../styles/youj.css';\n@import '../styles/ui.css';${styleImport}`), 'Then add items by name: `npx @youj/cli add button dialog`.')
  } else {
    out.push('', code('bash', `npm install @youj/react @youj/core @youj/motion @youj/icons motion@${MOTION_INSTALL} @base-ui/react@${BASE_UI_INSTALL}`), code('css', `/* ${framework ? STYLESHEET[framework] : 'your global stylesheet'}: right after Tailwind, same file */\n@import 'tailwindcss';\n@import '@youj/react/styles.css';`), "That's it: `import { Button } from '@youj/react'`.")
  }
  const html = `data-theme="dark" data-yj-look="${style}"`
  const prop = style === DEFAULT_LOOK ? '' : ` look="${style}"`
  if (framework) {
    const p = PROVIDER[framework]
    out.push('', `Optional provider (a theme in JS, speed, quality, sound, motion={false}${prop ? ', the style' : ''}), in \`${p.file}\`:`, code('tsx', p.code(html, prop)))
  } else
    out.push('', `The provider is optional: without it, components follow the OS reduced-motion setting and take the theme, scheme and style from <html> (\`data-yj-theme="${DEFAULT_PRESET}" ${html}\`). Its options: \`sound={beacon}\` (a pack from @youj/sound, opt-in; in the Next.js App Router it must be given from a 'use client' file) and \`motion={false}\` (no animation, no sound). Pass \`framework\` for where it goes.`)
  out.push(
    '',
    style === DEFAULT_LOOK
      ? `Components are built in ${style}, the default style (how components are built, independent of the theme's colours and type): a root YoujProvider writes \`data-yj-look="${style}"\` itself, and <html> carries it for anything rendered outside the provider. It needs no stylesheet of its own. For instrument panels (mono capital labels, pill actions), pass look: 'bezel'.`
      : `The ${style} style: \`look="${style}"\` on YoujProvider and \`data-yj-look="${style}"\` on <html>. ${mode === 'registry' ? `Its recipes are ${sheet}, imported right after ui.css.` : 'Its recipes are in @youj/react/styles.css already.'}`,
  )
  out.push('', "Built-in text (close buttons, announcements, placeholders) is English by default. For another language: `import { de } from '@youj/core/locales/de'`, then `<YoujProvider locale=\"de-DE\" labels={de}>`. Packs: ar, de, es, fr, he, it, ja, ko, nl, pl, pt-BR, sv, tr, zh-CN (set dir=\"rtl\" for ar and he). Spread one to change a key: `{ ...de, close: 'Zu' }`.")
  out.push('', `Youj starts dark: \`data-theme="dark"\` on <html>, which the tokens follow. Leave it off for light, or let next-themes switch it (\`attribute="data-theme"\`, \`defaultTheme="dark"\`). Full guide: ${site}/docs/installation`)

  if (checks.length) {
    const icon = { ok: '✓', warn: '!', error: '✗' } as const
    out.push('', '## Checks', '', ...checks.map((c) => `- ${icon[c.level]} ${c.message}${c.fix ? ` → ${c.fix}` : ''}`))
    const errors = checks.filter((c) => c.level === 'error').length
    out.push('', errors ? `${errors} to fix. \`npx @youj/cli doctor\` also checks installed versions, duplicate copies and the provider on disk.` : 'Nothing to fix in what was pasted.')
  }
  return out.join('\n')
}
