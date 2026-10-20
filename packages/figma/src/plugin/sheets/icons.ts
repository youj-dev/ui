import type { Kit } from '../../kit'
import { add, box, text } from '../draw'
import { buildIcon, ICON_INK, type IconBuild } from '../icons'
import type { Pages } from '../pages'
import { note, section, sheet } from '../sheet'
import { pause } from '../steps'
import { keyOf } from '../store'

/* The Icons page: every Youj icon as a component, by category, in the
 * gallery order the code declares. Components from an earlier run are lifted
 * out before the sheet is redrawn and updated in place, so instances in your
 * designs stay linked. */

const title = (s: string) => (s === 'ai' ? 'AI' : s.charAt(0).toUpperCase() + s.slice(1))
// Ten columns across the sheet, wide enough for a 16-character name in mono.
const TILE = 117

export async function iconsSheet(pages: Pages, kit: Kit): Promise<{ icons: Map<string, IconBuild>; summary: string[] }> {
  const page = pages.page('icons')
  await page.loadAsync()
  const rescued = new Map<string, ComponentNode | ComponentSetNode>()
  for (const n of page.findAll((n) => (n.type === 'COMPONENT' || n.type === 'COMPONENT_SET') && keyOf(n).startsWith('icon:') && n.parent?.type !== 'COMPONENT_SET')) {
    page.appendChild(n)
    rescued.set(keyOf(n), n as ComponentNode | ComponentSetNode)
  }

  const states = kit.icons.filter((i) => i.states).length
  const frame = await sheet(pages, 'icons', {
    title: 'Icons',
    lede: `${kit.icons.length} icons in ${kit.categories.length} categories, drawn on a 24-unit grid with a ${kit.scale.find((n) => n.name === 'stroke/icon')?.value ?? 1.5} stroke. Each is a component named Icon/<category>/<name>; the ${states} that switch between two states are component sets with a State property.`,
  })
  add(
    frame,
    await box(
      { name: 'Notes', dir: 'row', gap: 16, w: 'fill' },
      await note('Motion lives in code', 'These are the rest poses. In code every icon animates: on hover, focus or its own trigger, and state icons morph between their two states. See the icons explorer on the docs site.'),
      await note('Colour and size', `Strokes and fills are bound to Color/${ICON_INK}; recolour an instance with Selection colors. Resize with the Scale tool (K) so the stroke scales with the icon, as it does in code.`),
    ),
  )

  const icons = new Map<string, IconBuild>()
  let drawn = 0
  for (const category of kit.categories) {
    const list = kit.icons.filter((i) => i.category === category)
    if (!list.length) continue
    const grid = await box({ name: 'Grid', dir: 'row', gap: 8, wrap: 8, w: 'fill' })
    for (const icon of list) {
      // Hand control back to Figma now and then: a long unbroken stretch reads as a frozen app.
      if (++drawn % 24 === 0) await pause()
      // One column rhythm: state icons take two columns. A fixed stage keeps every glyph on the same line.
      const tile = await box({ name: icon.name, dir: 'col', gap: 10, align: 'center', pad: [14, 4, 12, 4], w: icon.states ? TILE * 2 + 8 : TILE, h: 120, radius: 'radius/lg', stroke: 'role/line' })
      const stage = await box({ name: 'Stage', dir: 'row', align: 'center', justify: 'center', w: 'fill', h: 48 })
      add(grid, tile)
      add(tile, stage)
      const built = buildIcon(icon, stage, rescued.get(`icon:${icon.name}`))
      rescued.delete(`icon:${icon.name}`)
      icons.set(icon.name, built)
      add(
        tile,
        await box(
          { name: 'Label', dir: 'col', gap: 2, align: 'center', w: 'fill' },
          await text(icon.name, 'Mono/xs', 'role/fg', { align: 'CENTER', w: 'fill', truncate: true }),
          icon.states ? await text(icon.states.join(' ↔ '), 'Mono/xs', 'role/fg-subtle', { align: 'CENTER', w: 'fill', truncate: true }) : null,
        ),
      )
    }
    add(frame, await section(`${title(category)}`, `${list.length} icon${list.length === 1 ? '' : 's'}`, {}, grid))
  }
  const removed = [...rescued.values()]
  for (const n of removed) n.remove()
  return {
    icons,
    summary: [`Icons: ${icons.size} (${states} with two states)${removed.length ? `, ${removed.length} removed that no longer exist in code` : ''}`],
  }
}
