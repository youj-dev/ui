import { exportedFonts, fontsImport, fontsSource } from '../../ui/src/docs/create/codegen'
import { fontOf, nextFontName } from '../../ui/src/docs/create/fonts'
import { themes } from '../../core/src/lib/youj/theme/themes'
import type { ThemeInput } from '../../core/src/lib/youj/theme/contract'
import { addHtmlClass, addNamedImports, addUrlImport, removeSideEffectImports } from './codemods'
import { detectStylesheet, type Entry, type Framework } from './detect'
import { importSpecifier } from './alias'
import type { Project } from './project'

/* A theme's web fonts (catalogue typefaces such as Geist and Geist Mono;
 * Inter and JetBrains Mono, the kit's defaults, an app loads through
 * @fontsource). Two ways to load them:
 * the Google Fonts stylesheet at the top of the global stylesheet, which
 * registers each family under its own name, so a preset's stock stacks
 * ('Geist', …) find it; and on the App Router, next/font, in lib/fonts.ts
 * with its variables on <html> (Create's lib/theme.ts reads them:
 * var(--font-geist, 'Geist'), …) or the root layout's own. Since Next.js 15
 * next/font registers each family under its own name too, so a stock preset
 * finds it; before 15 it hashed the name, and only the stylesheet works. */

export type Place = (path: string, content: string) => void

/**
 * A preset with only the web fonts the Google stylesheet serves under the
 * name its stack gives them: 'Geist', say, not the kit's defaults, whose
 * stacks name their @fontsource families ('Inter Variable', 'JetBrains Mono
 * Variable') for the app to load itself. What init loads for a preset.
 */
export function presetFonts(preset: ThemeInput): ThemeInput {
  const served = Object.entries(preset.fonts ?? {}).filter(([, stack]) => {
    const font = fontOf(stack)
    return font?.web && stack.split(',')[0]!.trim().replace(/^['"]|['"]$/g, '') === font.family
  })
  return { ...preset, fonts: Object.fromEntries(served) }
}

/** The kit's own faces, as their stacks name them, and the @fontsource package that registers each under that name. */
const FONTSOURCE: Record<string, string> = {
  'Inter Variable': '@fontsource-variable/inter',
  'JetBrains Mono Variable': '@fontsource-variable/jetbrains-mono',
}

/** The @fontsource range init installs. */
export const FONTSOURCE_RANGE = '^5'

/**
 * The @fontsource packages for the kit's own faces a preset names (Basalt,
 * Graphite, Brutal and the Wada presets: Inter and JetBrains Mono; Terminal:
 * JetBrains Mono). Their
 * stacks ask for 'Inter Variable' and 'JetBrains Mono Variable', the names
 * @fontsource-variable registers; Google's stylesheet and next/font register
 * 'Inter' and 'JetBrains Mono', which those stacks never match.
 */
export function fontsourcePackages(preset: ThemeInput): string[] {
  const families = Object.values(preset.fonts ?? {}).map((stack) => stack.split(',')[0]!.trim().replace(/^['"]|['"]$/g, ''))
  return [...new Set(families.map((family) => FONTSOURCE[family]).filter((p): p is string => Boolean(p)))]
}

/**
 * The Google Fonts stylesheet for `theme`'s web fonts, at the top of the
 * global stylesheet, replacing a preset's import (init's) whose faces it
 * loads too. Nothing for a theme in the kit's own faces; a manual step when
 * there's no stylesheet to edit. Running it again changes nothing.
 */
export function importFonts(project: Project, framework: Framework | null, entry: Entry | null, theme: ThemeInput, manual: string[]): void {
  const load = fontsImport(theme)
  if (!load) return
  const sheet = framework && entry ? detectStylesheet(project, framework, entry) : null
  const css = sheet && project.read(sheet.path)
  if (sheet && css !== null && css !== undefined) project.write(sheet.path, addUrlImport(dropCovered(css, theme, load), load))
  else manual.push(`Load the theme's typefaces at the top of your global stylesheet: ${load}`)
}

/**
 * The web fonts for a theme Create wrote (lib/theme.ts at `themeFile`): on
 * the App Router, next/font in lib/fonts.ts and its variables on <html> in
 * the root layout, dropping a preset's stylesheet import that next/font now
 * covers; anywhere else, the Google Fonts stylesheet (importFonts). What
 * can't be done safely is a manual step.
 */
export function loadFonts(project: Project, framework: Framework | null, entry: Entry | null, themeFile: string, theme: ThemeInput, place: Place, manual: string[]): void {
  if (!fontsImport(theme)) return
  if (framework !== 'next-app') { importFonts(project, framework, entry, theme, manual); return }
  const fontsFile = themeFile.replace(/theme\.ts$/, 'fonts.ts')
  place(fontsFile, fontsSource(theme)!)
  const layout = entry?.document
  const source = layout && project.read(layout)
  const from = layout ? importSpecifier(project, layout, fontsFile).replace(/\.ts$/, '') : ''
  const edited = source ? addHtmlClass(source, 'fontVariables') : null
  // The Inter and JetBrains Mono imports an earlier `init --theme graphite` added: the theme's own fonts replace those it no longer names.
  const kept = fontsourcePackages(theme)
  if (layout && source && edited !== null) project.write(layout, removeSideEffectImports(edited === source ? source : addNamedImports(edited, from, ['fontVariables']), Object.values(FONTSOURCE).filter((name) => !kept.includes(name))))
  else manual.push(`Put the theme's typefaces on <html> in ${layout ?? 'app/layout.tsx'}: import { fontVariables } from '${from || '@/lib/fonts'}', then className={fontVariables}.`)
  const sheet = entry && detectStylesheet(project, framework, entry)
  const css = sheet && project.read(sheet.path)
  if (sheet && css) project.write(sheet.path, dropCovered(css, theme))
}

/**
 * init's web fonts for a preset, loaded once. On the App Router (Next.js 15
 * or later, or a version it can't read), next/font: the root layout's own
 * when it already loads every family (create-next-app's Geist and Geist
 * Mono), else lib/fonts.ts (loadFonts); either way a preset stylesheet import
 * an earlier init added goes. Anywhere else, the Google Fonts stylesheet.
 */
export function presetWebFonts(
  project: Project,
  framework: Framework | null,
  entry: Entry | null,
  preset: ThemeInput,
  nextRange: string | undefined,
  manual: string[],
): void {
  if (!fontsImport(preset)) return
  const major = Number(nextRange?.match(/\d+/)?.[0])
  if (framework !== 'next-app' || major < 15) { importFonts(project, framework, entry, preset, manual); return }
  const layout = entry?.document ? project.read(entry.document) : null
  const loaded = layout ? nextFontImports(layout) : []
  if (!exportedFonts(preset).every((f) => loaded.includes(nextFontName(f)))) {
    const base = project.exists('src') ? 'src/' : ''
    const place: Place = (path, content) => {
      const current = project.read(path)
      if (current === null) project.write(path, content)
      else if (current !== content) manual.push(`${path} is already there, so it's unchanged. Load the theme's typefaces with next/font in it and export fontVariables.`)
    }
    loadFonts(project, framework, entry, `${base}lib/theme.ts`, preset, place, manual)
    return
  }
  const sheet = entry && detectStylesheet(project, framework, entry)
  const css = sheet && project.read(sheet.path)
  if (sheet && css) project.write(sheet.path, dropCovered(css, preset))
}

/** The names a module imports from next/font/google (`Geist`, `Geist_Mono`). */
function nextFontImports(source: string): string[] {
  const names = [...source.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]next\/font\/google['"]/g)].flatMap((m) => m[1]!.split(','))
  return names.map((n) => n.trim().split(/\s+as\s+/)[0]!).filter(Boolean)
}

/**
 * `css` without the preset imports init writes (a preset's fontsImport line,
 * exactly) whose faces `theme` loads too: all of them but `keep`, the line
 * about to be added.
 */
function dropCovered(css: string, theme: ThemeInput, keep?: string): string {
  const loaded = exportedFonts(theme)
  let out = css
  for (const preset of themes.map(presetFonts)) {
    const line = fontsImport(preset)
    if (line && line !== keep && exportedFonts(preset).every((f) => loaded.includes(f))) out = out.replace(`${line}\n`, '')
  }
  return out
}
