import type { Kit, KitColor, Mode } from '../../kit'
import { add, box, context, fillOf, paintVar, rect, scope, text, type Ink } from '../draw'
import type { Pages } from '../pages'
import { note, section, sheet } from '../sheet'
import { rawColor } from '../variables'

/* The Colour page. Every theme in both modes, each panel scoped to its Theme
 * and Color modes so it resolves through the same variables a design does;
 * where the plan has no modes, a panel binds straight to its theme's source
 * collection instead. Then the roles as a table (aliases shown as aliases),
 * and the few colours that are not roles yet. */

const MODES: Mode[] = ['light', 'dark']

const CHIPS: [string, string][] = [
  ['role/canvas', 'canvas'],
  ['role/surface', 'surface'],
  ['role/well', 'well'],
  ['role/line', 'line'],
  ['role/line-strong', 'line-strong'],
  ['role/fg', 'fg'],
  ['role/fg-muted', 'fg-muted'],
  ['role/fg-subtle', 'fg-subtle'],
  ['role/accent', 'accent'],
  ['role/success', 'success'],
  ['role/warning', 'warning'],
  ['role/danger', 'danger'],
]

/**
 * A paint for a colour in one theme and mode: the Color variable when the
 * frame it sits in is scoped to that theme and mode, else the theme's own
 * source variable (following aliases down to the value).
 */
export function inkFor(kit: Kit, theme: string, mode: Mode, name: string, scoped: boolean, opacity = 1): Paint | Ink {
  if (scoped) return opacity === 1 ? name : [name, opacity]
  const raw = rawColor(kit, name, mode)
  return paintVar(context().vars.source(theme, `${mode}/${raw.name}`), opacity)
}

const CHIP_W = 87

async function chip(kit: Kit, theme: string, mode: Mode, name: string, caption: string, scoped: boolean) {
  const swatch = rect(caption, CHIP_W, 32, inkFor(kit, theme, mode, name, scoped), 'radius/md')
  swatch.strokes = [fillOf(inkFor(kit, theme, mode, 'role/line', scoped))]
  swatch.strokeWeight = 1
  swatch.strokeAlign = 'INSIDE'
  return box({ name: caption, dir: 'col', gap: 6, w: CHIP_W }, swatch, await text(caption, 'Mono/xs', inkFor(kit, theme, mode, 'role/fg-muted', scoped)))
}

async function themePanel(kit: Kit, themeId: string, mode: Mode, samples: () => Promise<FrameNode>) {
  const theme = kit.themes.find((t) => t.id === themeId)!
  const panel = await box({ name: `${theme.name} · ${mode}`, dir: 'col', gap: 20, pad: 24, w: 'fill', radius: 'radius/xl' })
  const scoped = scope(panel, themeId, mode)
  const ink = (name: string) => inkFor(kit, themeId, mode, name, scoped)
  panel.fills = [fillOf(ink('role/canvas'))]
  panel.strokes = [fillOf(ink('role/line'))]
  panel.strokeWeight = 1
  panel.strokeAlign = 'INSIDE'
  const fonts = kit.fonts.find((f) => f.name === 'font/sans')!.values[themeId]
  add(
    panel,
    await box(
      { name: 'Head', dir: 'col', gap: 4, w: 'fill' },
      await box(
        { name: 'Title', dir: 'row', gap: 10, align: 'baseline', w: 'fill' },
        await text(theme.name, 'UI/lg/Semibold', ink('role/fg')),
        await text(mode === 'dark' ? 'Dark' : 'Light', 'Mono/xs', ink('role/fg-muted')),
        await box({ name: 'Spacer', w: 'fill', h: 1 }),
        await text(`${fonts} · ${theme.radius} radius · ${theme.density} · ${theme.motion}`, 'Mono/xs', ink('role/fg-muted')),
      ),
      mode === 'light' ? await text(theme.description, 'UI/base/Regular', ink('role/fg-muted'), { w: 'fill' }) : null,
    ),
  )
  const chips = await box({ name: 'Palette', dir: 'row', gap: 8, wrap: 12, w: 'fill' })
  for (const [name, caption] of CHIPS) add(chips, await chip(kit, themeId, mode, name, caption, scoped))
  add(panel, chips)
  // Real components, where this panel resolves through the Color variables.
  if (scoped) add(panel, await samples())
  return panel
}

async function tokenRow(kit: Kit, c: KitColor) {
  const { vars } = context()
  const applied = vars.applied.theme
  const cell = async (mode: Mode) => {
    const frame = await box({ name: mode, dir: 'row', w: 64, h: 32, radius: 'radius/md' })
    const scoped = scope(frame, applied, mode)
    frame.fills = [fillOf(inkFor(kit, applied, mode, 'role/canvas', scoped))]
    const swatch = rect(c.name, 64, 32, inkFor(kit, applied, mode, c.name, scoped), 'radius/md')
    swatch.strokes = [fillOf(inkFor(kit, applied, mode, 'role/line', scoped))]
    swatch.strokeWeight = 1
    swatch.strokeAlign = 'INSIDE'
    return add(frame, swatch)
  }
  // What it is: an alias (the same graph as ui.css) or its own mix, per theme.
  const value = (mode: Mode) => {
    const v = c[mode]
    return 'alias' in v ? `→ ${v.alias}` : c.source.replace(/^ui\.css: |^youj\.css: /, '').replace(/ \((light|dark)\).*$/, '')
  }
  const light = value('light')
  const dark = value('dark')
  return box(
    { name: c.name, dir: 'row', gap: 16, align: 'center', pad: [10, 0], w: 'fill', stroke: 'role/line', sides: { bottom: 1 } },
    await cell('light'),
    await cell('dark'),
    await text(c.name, 'Mono/base/Medium', 'role/fg', { w: 300 }),
    await text(c.css ? `var(${c.css})` : '—', 'Mono/xs', 'role/fg-muted', { w: 260 }),
    await text(light === dark ? light : `${light} in light, ${dark} in dark`, 'UI/base/Regular', 'role/fg-muted', { w: 'fill' }),
  )
}

export async function colourSheet(pages: Pages, kit: Kit, samples: () => Promise<FrameNode>) {
  const { vars } = context()
  const frame = await sheet(pages, 'colour', {
    title: 'Colour',
    lede: 'One vocabulary. The roles are derived from each theme’s contract: a neutral hue and chroma, an accent, three status colours. Components paint with a role and never with a value. Every swatch here is bound to a variable, so it is the token, not a picture of it.',
  })

  const modes = vars.themeModes && vars.colorModes
  add(
    frame,
    await note(
      modes ? 'Themes are modes' : 'This plan has one mode per collection',
      modes
        ? 'Each panel below sets its Theme and Color modes on the frame. Do the same on any frame of yours (Appearance → the variable modes), or run Plugins → Youj kit → Theme for the whole page.'
        : `So each theme is its own collection (Theme · Terminal, …) and every panel binds straight to it. Components follow the theme in use, ${kit.themes.find((t) => t.id === vars.applied.theme)!.name} · ${vars.applied.mode}: switch it with Plugins → Youj kit → Theme.`,
    ),
  )

  const grid = await box({ name: 'Themes', dir: 'col', gap: 24, w: 'fill' })
  for (const theme of kit.themes) {
    const row = await box({ name: theme.name, dir: 'row', gap: 24, w: 'fill', align: 'start' })
    for (const mode of MODES) add(row, await themePanel(kit, theme.id, mode, samples))
    add(grid, row)
  }
  add(frame, await section('Themes', 'Four presets, each in light and dark. A theme sets a handful of inputs (a neutral hue and chroma, an accent, status colours, radius, density, fonts, a motion personality); everything else is derived.', {}, grid))

  const roles = kit.colors.filter((c) => c.name.startsWith('role/'))
  const rest = kit.colors.filter((c) => c.name.startsWith('palette/') || c.name.startsWith('ui/'))
  const table = async (list: KitColor[]) => {
    const head = async (chars: string, w: number | 'fill') => text(chars, 'UI/xs/Caps', 'role/fg-subtle', { w })
    const t = await box(
      { name: 'Table', dir: 'col', w: 'fill' },
      await box(
        { name: 'Header', dir: 'row', gap: 16, pad: [0, 0, 10, 0], w: 'fill', stroke: 'role/line', sides: { bottom: 1 } },
        await head('Light', 64),
        await head('Dark', 64),
        await head('Variable', 300),
        await head('CSS', 260),
        await head('Value', 'fill'),
      ),
    )
    for (const c of list) add(t, await tokenRow(kit, c))
    return t
  }
  const appliedName = kit.themes.find((t) => t.id === vars.applied.theme)!.name
  add(
    frame,
    await section(
      'Roles',
      `Every colour a component paints is one of these roles: surfaces, lines, text, actions and states, and each ink in its text, subtle and line forms. Shown in ${appliedName}, light and dark.`,
      {},
      await table(roles),
    ),
    await section(
      'Also in the kit',
      'Colours that are not roles: the key edge Classic’s tracks draw.',
      {},
      await table(rest),
    ),
  )
}
