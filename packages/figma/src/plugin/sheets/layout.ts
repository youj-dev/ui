import type { Kit } from '../../kit'
import { add, box, context, fillOf, rect, scope, text, type Ink } from '../draw'
import type { Pages } from '../pages'
import { label, section, sheet } from '../sheet'
import { inkFor } from './colour'

/* Spacing, radius, control heights and density, elevation and focus. Every
 * bar and corner here is bound to its variable: the spacing bars' widths, the
 * radius samples' corners, the controls' heights. Radius and height change
 * with the theme, so each theme gets a column scoped to it. */

export async function layoutSheet(pages: Pages, kit: Kit) {
  const { vars } = context()
  const frame = await sheet(pages, 'layout', {
    title: 'Spacing & radius',
    lede: 'A 4px grid. Spacing is Tailwind’s scale; radius and control heights come from the theme contract (one radius and one density per theme, everything else derived), so they’re modes of Theme. Elevation is two shadow layers tinted with the theme’s neutral, and an inner highlight in the dark.',
  })

  // Spacing: bar widths bound to the Scale variables.
  const spacing = await box({ name: 'Spacing', dir: 'col', gap: 10, w: 'fill' })
  for (const n of kit.scale.filter((s) => s.name.startsWith('space/') && s.value > 0)) {
    const bar = rect(n.name, n.value, 12, 'role/accent', 2)
    bar.setBoundVariable('width', vars.get('scale', n.name))
    add(
      spacing,
      await box(
        { name: n.name, dir: 'row', gap: 16, align: 'center', w: 'fill' },
        await text(n.name, 'Mono/base/Medium', 'role/fg', { w: 120 }),
        await text(`${n.value}px`, 'Mono/xs', 'role/fg-muted', { w: 64 }),
        bar,
        await label(n.source.replace(/^Tailwind: /, '').replace(/….*$/, '…')),
      ),
    )
  }
  add(frame, await section('Spacing', 'space/<n> is Tailwind’s p-<n>, gap-<n>, m-<n>: n × 4px. The variables are scoped to gap, padding and size.', {}, spacing))

  // Radius and controls: a column per theme.
  const radii = kit.theme.filter((n) => n.name.startsWith('radius/') && n.name !== 'radius/full')
  const controls = kit.theme.filter((n) => n.name.startsWith('control/'))
  const columns = await box({ name: 'Themes', dir: 'row', gap: 16, w: 'fill', align: 'start' })
  for (const theme of kit.themes) {
    const col = await box({ name: theme.name, dir: 'col', gap: 16, pad: 20, w: 'fill', radius: 'radius/xl' })
    const scoped = scope(col, theme.id, 'light')
    const ink = (name: string) => inkFor(kit, theme.id, 'light', name, scoped) as Ink | Paint
    col.fills = [fillOf(ink('role/canvas'))]
    col.strokes = [fillOf(ink('role/line'))]
    col.strokeWeight = 1
    const bind = (node: RectangleNode, field: VariableBindableNodeField, name: string) => node.setBoundVariable(field, scoped ? vars.get('theme', name) : vars.source(theme.id, name))
    const shapes = await box({ name: 'Radius', dir: 'row', gap: 10, wrap: 12, w: 'fill' })
    for (const r of radii) {
      const sq = rect(r.name, 48, 48, ink('role/well'))
      sq.strokes = [fillOf(ink('role/line-strong'))]
      sq.strokeWeight = 1
      for (const corner of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'] as const) bind(sq, corner, r.name)
      add(shapes, await box({ name: r.name, dir: 'col', gap: 6, align: 'center' }, sq, await text(`${r.name.slice(7)} ${round(r.values[theme.id]!)}`, 'Mono/xs', ink('role/fg-muted'))))
    }
    const heights = await box({ name: 'Controls', dir: 'row', gap: 4, align: 'end', w: 'fill' })
    for (const c of controls) {
      const bar = rect(c.name, 32, 32, ink('role/well'))
      bar.strokes = [fillOf(ink('role/line-strong'))]
      bar.strokeWeight = 1
      bind(bar, 'height', c.name)
      for (const corner of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'] as const) bind(bar, corner, 'radius/md')
      add(
        heights,
        await box(
          { name: c.name, dir: 'col', gap: 6, align: 'center', w: 'fill' },
          bar,
          await box({ name: 'Label', dir: 'col', align: 'center' }, await text(c.name.slice(8), 'Mono/xs', ink('role/fg-muted')), await text(String(c.values[theme.id]), 'Mono/xs', ink('role/fg'))),
        ),
      )
    }
    add(
      col,
      await box(
        { name: 'Head', dir: 'col', gap: 2, w: 'fill' },
        await text(theme.name, 'UI/lg/Semibold', ink('role/fg')),
        await text(`${theme.radius} radius · ${theme.density}`, 'Mono/xs', ink('role/fg-muted'), { w: 'fill' }),
      ),
      shapes,
      heights,
    )
    add(columns, col)
  }
  add(
    frame,
    await section(
      'Radius and control heights',
      'Radius steps scale with the theme’s one radius and cap, so `full` turns 32px controls into pills while checkboxes stay square-ish and cards stay rectangles. Density moves every control 4px per step, never below the 24px target minimum; touch adds 8px in code.',
      {},
      columns,
    ),
  )

  // Elevation and focus.
  const cards = await box({ name: 'Elevation', dir: 'row', gap: 32, w: 'fill', pad: [8, 0, 24, 0] })
  for (const e of kit.effects.filter((x) => x.name.startsWith('Shadow/'))) {
    add(
      cards,
      await box(
        { name: e.name, dir: 'col', gap: 4, pad: 20, w: 'fill', h: 120, radius: 'radius/xl', fill: 'role/surface', effect: e.name, justify: 'end' },
        await text(e.name, 'UI/base/Semibold', 'role/fg'),
        await text(`${e.css.replace(/^--ui-/, '')} · ${e.layers.length} layer${e.layers.length > 1 ? 's' : ''}`, 'Mono/xs', 'role/fg-subtle', { w: 'fill' }),
      ),
    )
  }
  const ringSample = await box(
    { name: 'Focus/ring', dir: 'row', align: 'center', pad: [0, 12], h: 32, radius: 'radius/md', fill: 'role/accent', effect: 'Focus/ring' },
    await text('Focused button', 'UI/base/Medium', 'role/on-accent'),
  )
  const fieldSample = await box(
    { name: 'Focus/field', dir: 'row', align: 'center', pad: [0, 10], w: 240, h: 32, radius: 'radius/md', stroke: 'role/focus', effect: 'Focus/field' },
    await text('Focused field', 'UI/base/Regular', 'role/fg'),
  )
  const focus = await box(
    { name: 'Focus', dir: 'row', gap: 48, align: 'center', w: 'fill', pad: [8, 8] },
    await box({ name: 'Ring', dir: 'col', gap: 12 }, ringSample, await label('Focus/ring: 2px ring, 2px offset (focus-ring)')),
    await box({ name: 'Field', dir: 'col', gap: 12 }, fieldSample, await label('Focus/field: ring border, 3px halo (focus-field)')),
  )
  add(
    frame,
    await section('Elevation', 'The shadow styles bind each layer’s colour to a Color variable: tinted in light mode, black with more opacity plus a top highlight in dark mode.', {}, cards),
    await section('Focus', 'Discrete controls get a 2px ring outline offset 2px; text fields turn their border ring inside a soft halo. Both follow the theme’s ring colour.', {}, focus),
  )
}

const round = (v: number) => String(Math.round(v * 10) / 10)
