import type { Kit, Mode, StyleId } from '../kit'
import { box, setContext } from './draw'
import { loadFonts } from './fonts'
import type { IconBuild } from './icons'
import { ensurePages, SHEETS, type Pages, type SheetKey } from './pages'
import { failedSheet, PENDING, placeholderSheet } from './sheet'
import { componentsSheet } from './sheets/components'
import { coverSheet, paintTittles } from './sheets/cover'
import { colourSheet } from './sheets/colour'
import { iconsSheet } from './sheets/icons'
import { illustrationsSheet } from './sheets/illustrations'
import { layoutSheet } from './sheets/layout'
import { motionSheet } from './sheets/motion'
import { blocksSheet } from './sheets/blocks'
import { typeSheet } from './sheets/type'
import { Steps, ToastSink, type ProgressSink } from './steps'
import { buildStyles } from './styles'
import { buildVariables, PERSONALITIES, probeModeLimit, type Applied } from './variables'

/* The plugin's two commands: build (or update) the kit, and point it at a
 * theme. Both are idempotent; neither needs the network. The build is a list
 * of steps that each run on their own, so one failing never leaves the pages
 * after it silently empty. */

const APPLIED = 'youj:applied'
const STYLE = 'youj:style'

/** The theme and mode the file points at: the one last applied, else the kit's default (Basalt, dark). */
export function readApplied(kit: Kit): Applied {
  const [theme, mode] = figma.root.getPluginData(APPLIED).split(':')
  const known = (id: string | undefined) => kit.themes.some((t) => t.id === id)
  return {
    theme: known(theme) ? theme! : known(kit.defaults.theme) ? kit.defaults.theme : kit.themes[0]!.id,
    mode: mode === 'dark' || mode === 'light' ? mode : kit.defaults.mode,
  }
}

/** The component style the file is built in: the one last chosen, else the kit's default (Classic). */
export function readLook(kit: Kit): StyleId {
  const id = figma.root.getPluginData(STYLE)
  return kit.styles.some((s) => s.id === id) ? (id as StyleId) : kit.defaults.style
}

/** Chooses the style the next builds draw. */
export function writeLook(style: StyleId) {
  figma.root.setPluginData(STYLE, style)
}

export const styleName = (kit: Kit, id: StyleId) => kit.styles.find((s) => s.id === id)?.name ?? id

export interface Report {
  lines: string[]
  warnings: string[]
  /** Steps that failed or were skipped, and pages that came out empty. */
  problems: string[]
  /** Nodes per kit page, e.g. "Icons: 4210 nodes". */
  census: string[]
  /** Component sets on the Components page. */
  components: number
}

const STEPS: [string, string][] = [
  ['fonts', 'Loading fonts'],
  ['plan', 'Checking the modes this file allows'],
  ['variables', 'Variables'],
  ['styles', 'Text and effect styles'],
  ['pages', 'Pages'],
  ['icons', 'Icons'],
  ['illustrations', 'Illustrations'],
  ['components', 'Components'],
  ['colour', 'Colour page'],
  ['type', 'Type page'],
  ['layout', 'Spacing & radius page'],
  ['motion', 'Motion page'],
  ['blocks', 'Blocks page'],
  ['cover', 'Cover and build report'],
  ['check', 'Checking every page'],
]

/** Counts what each kit page holds, and flags pages that are empty or only carry a notice. */
async function censusOf(pages: Pages): Promise<{ lines: string[]; empty: string[] }> {
  const lines: string[] = []
  const empty: string[] = []
  for (const page of [...new Set(SHEETS.map((s) => pages.page(s)))]) {
    await page.loadAsync()
    const nodes = page.findAll().length
    lines.push(`${page.name}: ${nodes} nodes`)
    if (nodes === 0) empty.push(`The page ${page.name} is empty.`)
    for (const frame of page.children) {
      // A failed step is already reported; a sheet still waiting means the build never reached it.
      const pending = frame.getPluginData(PENDING)
      if (pending.includes('isn’t built yet')) empty.push(`${pending} (page ${page.name}).`)
    }
  }
  return { lines, empty }
}

export async function drawKit(kit: Kit, sink: ProgressSink = new ToastSink()): Promise<Report> {
  const steps = new Steps(STEPS, sink)
  const report: Report = { lines: [], warnings: [], problems: steps.problems, census: [], components: 0 }
  const skipFrom = (id: string, reason: string) => {
    for (const [s] of STEPS.slice(STEPS.findIndex(([x]) => x === id))) steps.skip(s, reason)
    return report
  }
  try {
    const fontTheme = kit.themes.find((t) => t.id === kit.defaults.theme) ?? kit.themes[0]!
    const fonts = await steps.run('fonts', () => loadFonts(fontTheme), (f) => `${f.families.sans} and ${f.families.mono}`)
    if (!fonts) return skipFrom('plan', 'no font could be loaded, so no text can be written')
    report.warnings.push(...fonts.warnings)

    // Without a reading, assume the tightest plan: one mode per collection works on every plan.
    const probed = await steps.run('plan', () => probeModeLimit(Math.max(kit.themes.length, PERSONALITIES.length)), (n) => `${n}${n > 1 ? '+' : ''} per collection`)
    const limit = probed ?? 1
    const vars = await steps.run('variables', () => buildVariables(kit, readApplied(kit), limit), (v) => (v.layout.theme === 'modes' ? 'themes as modes' : 'a collection per theme'))
    if (!vars) return skipFrom('styles', 'the variables didn’t build, and everything binds to them')
    report.warnings.push(...vars.warnings)
    report.lines.push(
      vars.layout.theme === 'modes'
        ? `Plan: ${limit}+ modes per collection, so themes are modes of one collection.`
        : `Plan: ${limit} mode${limit === 1 ? '' : 's'} per collection (Starter), so each theme is its own collection. Use Plugins → Youj kit → Theme to switch.`,
      ...vars.summary,
    )

    const styles = await steps.run('styles', () => buildStyles(kit, fonts, vars))
    if (!styles) return skipFrom('pages', 'the text styles didn’t build, and every page sets its type in them')
    report.lines.push(...styles.summary)
    report.warnings.push(...styles.warnings)
    const style = readLook(kit)
    setContext({ kit, vars, styles, fonts, style })
    report.lines.push(
      `Look: ${styleName(kit, style)}${style === kit.defaults.style ? ' (the default)' : ''}. Components are drawn in its anatomy; Plugins → Youj kit → Look switches it and rebuilds.`,
    )

    const pages = await steps.run(
      'pages',
      async () => {
        const p = await ensurePages()
        // Every page says what it's waiting for until its sheet is drawn.
        for (const key of SHEETS) await placeholderSheet(p, key)
        // Where themes are modes, the kit's pages open in the theme in use (Basalt, dark, unless another was applied).
        for (const page of new Set(SHEETS.map((s) => p.page(s)))) {
          if (vars.themeModes) page.setExplicitVariableModeForCollection(vars.theme, vars.themeModes[vars.applied.theme]!)
          if (vars.colorModes) page.setExplicitVariableModeForCollection(vars.color, vars.colorModes[vars.applied.mode])
        }
        return p
      },
      (p) => p.summary[0],
    )
    if (!pages) return skipFrom('icons', 'the pages couldn’t be made')
    report.lines.push(...pages.summary)

    /** A sheet's step: when it fails, its page says so. */
    const sheet = async <T>(key: SheetKey, fn: () => Promise<T>, detail?: (r: T) => string | undefined): Promise<T | undefined> => {
      const result = await steps.run(key, fn, detail)
      if (result === undefined) {
        try {
          await failedSheet(pages, key, steps.states.find((s) => s.id === key)!.detail ?? 'unknown error')
        } catch (error) {
          console.error('Youj kit: could not mark the page', error)
        }
      }
      return result
    }

    const icons = await sheet('icons', () => iconsSheet(pages, kit), (r) => `${r.icons.size} components`)
    if (icons) report.lines.push(...icons.summary)

    const illustrations = await sheet('illustrations', () => illustrationsSheet(pages, kit))
    if (illustrations) report.lines.push(...illustrations)

    const components = await sheet('components', () => componentsSheet(pages, icons?.icons ?? new Map<string, IconBuild>()), (r) => `${r.sets.size} sets`)
    if (components) {
      report.lines.push(...components.summary)
      report.components = components.sets.size
      for (const p of (components as { problems?: string[] }).problems ?? []) steps.problem(`Components: ${p}`)
    }
    const samples = components?.samples ?? (() => box({ name: 'Sample (the components didn’t build)', dir: 'col' }))

    await sheet('colour', async () => (await colourSheet(pages, kit, samples), true))
    await sheet('type', async () => (await typeSheet(pages, kit), true))
    await sheet('layout', async () => (await layoutSheet(pages, kit), true))
    await sheet('motion', async () => (await motionSheet(pages, kit), true))
    const blocks = await sheet('blocks', () => blocksSheet(pages, kit))
    if (blocks) report.lines.push(...blocks)

    // Checked before the cover, so the cover reports pages that came out empty; the cover itself is checked after.
    const coverPage = pages.page('cover')
    for (const e of (await censusOf(pages)).empty) if (!e.includes('Youj isn’t built yet') && !e.startsWith(`The page ${coverPage.name} `)) steps.problem(e)
    const cover = await sheet('cover', () => coverSheet(pages, kit, report))
    figma.root.setRelaunchData({ build: 'Rebuild the Youj kit from the tokens bundled in the plugin' })

    await steps.run(
      'check',
      async () => {
        const after = await censusOf(pages)
        report.census = after.lines
        for (const e of after.empty) if (!steps.problems.includes(e)) steps.problem(e)
        // Finish on the cover, which reports what this run did.
        await figma.setCurrentPageAsync(coverPage)
        if (cover) figma.viewport.scrollAndZoomIntoView([cover])
        return after
      },
      (r) => r.lines.join(' · '),
    )
    return report
  } finally {
    if (sink instanceof ToastSink) sink.close()
  }
}

/** Points the kit at a theme and mode: modes on the current page where the plan has them, the interface collections where it doesn't. */
export async function applyTheme(kit: Kit, theme: string, mode: Mode): Promise<string> {
  const found = kit.themes.find((t) => t.id === theme)
  if (!found) throw new Error(`Unknown theme ${theme}`)
  figma.root.setPluginData(APPLIED, `${theme}:${mode}`)
  const limit = await probeModeLimit(Math.max(kit.themes.length, PERSONALITIES.length))
  const vars = await buildVariables(kit, { theme, mode }, limit)
  const label = `${found.name} · ${mode === 'dark' ? 'Dark' : 'Light'}`
  paintTittles(kit.logo, mode)
  if (vars.themeModes && vars.colorModes) {
    const page = figma.currentPage
    page.setExplicitVariableModeForCollection(vars.theme, vars.themeModes[theme]!)
    page.setExplicitVariableModeForCollection(vars.color, vars.colorModes[mode])
    return `${label} on this page. Each frame can pick its own Theme and Color modes too.`
  }
  if (vars.colorModes) {
    figma.currentPage.setExplicitVariableModeForCollection(vars.color, vars.colorModes[mode])
    return `${label}: Theme points at ${found.name}; this page is in ${mode} mode.`
  }
  return `${label} everywhere: Theme and Color now point at it.`
}

export async function run(kit: Kit, command: string, sink?: ProgressSink): Promise<string> {
  const theme = /^theme:([a-z]+):(light|dark)$/.exec(command)
  if (theme) return applyTheme(kit, theme[1]!, theme[2] as Mode)
  const style = styleCommand(kit, command)
  if (style) writeLook(style)
  return summarise(kit, await drawKit(kit, sink))
}

/** `look:bezel` → 'bezel': the Look menu's commands, which choose the look and then build. */
export function styleCommand(kit: Kit, command: string): StyleId | undefined {
  const m = /^look:([a-z]+)$/.exec(command)
  if (!m) return undefined
  if (!kit.styles.some((s) => s.id === m[1])) throw new Error(`Unknown look ${m[1]}`)
  return m[1] as StyleId
}

/** The closing line, with the full report in the plugin console (Plugins → Development → Show/Hide console). */
export function summarise(kit: Kit, report: Report): string {
  console.log(
    [
      `Youj kit ${kit.hash}`,
      ...report.lines,
      ...report.warnings.map((w) => `Note: ${w}`),
      ...report.problems.map((p) => `Problem: ${p}`),
      `Pages: ${report.census.join(' · ')}`,
    ].join('\n'),
  )
  const n = report.problems.length
  if (n) return `Youj kit ${kit.hash} built with ${n} problem${n > 1 ? 's' : ''}: ${report.problems[0]}${n > 1 ? ' (all of them on the cover)' : ''}`
  const warn = report.warnings.length ? ` ${report.warnings.length} note${report.warnings.length > 1 ? 's' : ''} on the cover.` : ''
  return `Youj kit ${kit.hash} is ready.${warn}`
}
