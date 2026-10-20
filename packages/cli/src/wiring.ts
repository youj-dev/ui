import { resolve } from 'node:path'
import { importSpecifier } from './alias'
import { addCssImports, addNamedImports, addTagAttributes, removeNamedImport, styleOf } from './codemods'
import { detectEntry, detectFramework, detectStylesheet } from './detect'
import { findRegistryFiles, registryFiles, usesThemeAttributes } from './init-files'
import { DEFAULT_LOOK, lookStylesheetPath, type YoujLook } from './look'
import { importPath, Project, type Change } from './project'
import type { ThemeId } from './constants'

/** The item and package that play the components' sound cues. */
export const SOUND = { item: 'sound', package: '@youj/sound' } as const

/** How a look is switched on: the default by a root provider on its own, any other by the provider's prop. */
export const switchOn = (look: YoujLook) =>
  look === DEFAULT_LOOK ? `the default: a root YoujProvider writes data-yj-look="${look}" itself` : `set look="${look}" on YoujProvider`


/**
 * Adds the CSS imports `imports(sheetPath)` names to the app's global stylesheet,
 * after Tailwind's. Returns the edit, or `manual` when there's no framework or
 * stylesheet to find. Running it again changes nothing.
 */
function wireStylesheet(project: Project, imports: (sheetPath: string) => string[], manual: string): { changes: Change[]; manual?: string } {
  const framework = detectFramework(project)
  if (!framework) return { changes: [], manual }
  const sheet = detectStylesheet(project, framework, detectEntry(project, framework))
  const css = project.read(sheet.path)
  if (css === null) return { changes: [], manual }
  project.write(sheet.path, addCssImports(css, imports(sheet.path)))
  return { changes: project.commit() }
}

/**
 * Adds the packages' stylesheet lines an item needs (`@youj/illustrations/styles.css`
 * after `@youj/react/styles.css`), after Tailwind's, in order. Returns
 * the edit, or the step to do by hand. Running it again changes nothing.
 */
export function wirePackageStyles(cwd: string, specs: string[]): { changes: Change[]; manual?: string } {
  const manual = `Add ${specs.map((s) => `@import '${s}';`).join(' ')} right after @import 'tailwindcss'; in your global stylesheet.`
  return wireStylesheet(new Project(resolve(cwd)), () => specs, manual)
}

/**
 * Imports a copied look's stylesheet right after ui.css in the app's global
 * stylesheet. Returns the edit, or the step to do by hand. Running it again
 * changes nothing.
 */
export function wireLook(cwd: string, look: YoujLook): { changes: Change[]; manual?: string } {
  const project = new Project(resolve(cwd))
  const file = lookStylesheetPath(project, look)!
  const manual = `Import ${file} right after ui.css in your global stylesheet (${switchOn(look)}).`
  return wireStylesheet(project, (sheet) => [importPath(sheet, file)], manual)
}

/**
 * Imports a copied theme's stylesheet right after the core's, where the app themes with
 * <html> attributes (Vite, Astro). Elsewhere the preset applies through the provider
 * or themeProps and needs no stylesheet. Returns the edit, or the step to do by hand.
 */
export function wireThemeSheet(cwd: string, id: ThemeId): { changes: Change[]; manual?: string } {
  const project = new Project(resolve(cwd))
  const framework = detectFramework(project)
  if (!framework || !usesThemeAttributes(framework)) return { changes: [] }
  const file = registryFiles(project).preset(id)
  return wireStylesheet(project, (sheet) => [importPath(sheet, file)], `Import ${file} in your global stylesheet, then set data-yj-theme="${id}" on <html>.`)
}

/**
 * Gives the app's YoujProvider, where `init` put it, `sound={beacon}`,
 * importing the pack from the package or from the copied source beside the core.
 * Returns the edit, or the step to do by hand when there's no provider to
 * find (Astro, or a provider moved elsewhere). Running it again changes nothing.
 */
export function wireSound(cwd: string, fromPackage: boolean): { changes: Change[]; manual?: string } {
  const project = new Project(resolve(cwd))
  const framework = detectFramework(project)
  const file = framework ? detectEntry(project, framework).root : null
  const core = findRegistryFiles(project).provider
  const from = fromPackage ? SOUND.package : core && file ? importSpecifier(project, file, core.replace(/provider\.[jt]sx$/, 'sound')) : undefined
  const manual = `Give <YoujProvider> a pack: <YoujProvider sound={beacon}>${from ? `, with import { beacon } from '${from}'` : ''}.`
  const source = file && project.read(file)
  if (!file || !source || !from) return { changes: [], manual }
  // A pack is an object of functions: a server layout can't hand it to the provider, so a client Providers file does.
  if (framework === 'next-app' && !isClientFile(source)) return wireSoundThroughClientFile(project, file, source, from, manual)
  const edited = addTagAttributes(source, 'YoujProvider', 'sound={beacon}', /\bsound=/)
  if (edited === null) return { changes: [], manual: `${manual} (There's no <YoujProvider> in ${file}.)` }
  if (edited === source) return { changes: [] }
  project.write(file, addNamedImports(edited, from, ['beacon']))
  return { changes: project.commit() }
}

const isClientFile = (source: string) => /^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)*(['"])use client\1/.test(source)

/** App Router: `providers.tsx` ('use client') holds YoujProvider with the pack, and the layout uses it. */
function wireSoundThroughClientFile(project: Project, layout: string, source: string, from: string, manual: string): { changes: Change[]; manual?: string } {
  const providers = layout.replace(/[^/]*$/, 'providers.tsx')
  const own = project.read(providers)
  if (own !== null && !/<YoujProvider\b/.test(own)) return { changes: [], manual: `${manual} It needs a 'use client' file (a pack holds functions): put it in ${providers}.` }
  if (own !== null) {
    if (!isClientFile(own)) return { changes: [], manual: `${manual} ${providers} needs 'use client' at the top for that (a pack holds functions).` }
    const edited = addTagAttributes(own, 'YoujProvider', 'sound={beacon}', /\bsound=/)
    if (edited === null || edited === own) return { changes: [] }
    project.write(providers, addNamedImports(edited, from,['beacon']))
    return { changes: project.commit() }
  }
  if (!/<YoujProvider\b/.test(source)) return { changes: [], manual: `${manual} (There's no <YoujProvider> in ${layout}.)` }
  const { quote, semi } = styleOf(source)
  const provider = source.match(/^import\s*\{[^}]*\bYoujProvider\b[^}]*\}\s*from\s*(['"])([^'"]+)\1/m)?.[2]
  if (!provider) return { changes: [], manual }
  const q = (spec: string) => `${quote}${spec}${quote}`
  // The layout's own specifier is relative to the layout; providers.tsx sits beside it, so the same one works.
  project.write(
    providers,
    [
      `${q('use client')}${semi}`,
      '',
      `import type { ComponentProps } from ${q('react')}${semi}`,
      `import { YoujProvider } from ${q(provider)}${semi}`,
      `import { beacon } from ${q(from)}${semi}`,
      '',
      "// A sound pack is an object of functions, so it's given to the provider here, in a client file, not from the server layout.",
      'export function Providers(props: ComponentProps<typeof YoujProvider>) {',
      `  return <YoujProvider sound={beacon} {...props} />${semi}`,
      '}',
      '',
    ].join('\n'),
  )
  const swapped = removeNamedImport(source.replace(/<YoujProvider(?=[\s>])/g, '<Providers').replace(/<\/YoujProvider>/g, '</Providers>'), 'YoujProvider')
  project.write(layout, addNamedImports(swapped, './providers', ['Providers']))
  return { changes: project.commit() }
}
