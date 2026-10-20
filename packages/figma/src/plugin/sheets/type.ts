import type { Kit, KitTextStyle } from '../../kit'
import { add, box, context, text } from '../draw'
import type { Pages } from '../pages'
import { label, section, sheet } from '../sheet'

/* The Type page: every text style as a specimen, with the classes that make
 * it in code and its numbers. Sizes and line heights are bound to the Scale
 * variables, so the scale is one set of numbers. */

const SAMPLE: Record<string, string> = {
  UI: 'Deploy succeeded in 12s on youj-docs',
  Body: 'Motion is the ornament: fast, confident and precise, landing exactly where it means to.',
  Display: 'Motion, drawn precisely',
  Heading: 'Precise and kinetic',
  Mono: 'k.spring(\'snappy\') · 220ms · --color-accent',
}

/** The name column, shared by every row so the samples line up down the page. */
const META_W = 300

async function specimen(style: KitTextStyle) {
  const group = style.name.split('/')[0]!
  const weight = { 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold' }[style.weight]
  const { fonts } = context()
  return box(
    { name: style.name, dir: 'row', gap: 32, align: 'center', pad: [18, 0], w: 'fill', stroke: 'role/line', sides: { bottom: 1 } },
    await box(
      { name: 'Meta', dir: 'col', gap: 4, w: META_W },
      await text(style.name, 'Mono/base/Medium', 'role/fg'),
      await label(style.classes),
      await label(`${fonts.families[style.family]} ${weight} · ${style.size}/${style.lineHeight}${style.tracking ? ` · ${style.tracking > 0 ? '+' : ''}${style.tracking}%` : ''}`),
    ),
    await text(SAMPLE[group] ?? SAMPLE.UI!, style.name, 'role/fg', { w: 'fill' }),
  )
}

/** The UI scale as a matrix: a row per size, a column per weight, each cell set in its style. */
async function uiMatrix(kit: Kit) {
  const weights = ['Regular', 'Medium', 'Semibold'] as const
  const sizes = ['xs', 'sm', 'base', 'lg'] as const
  const grid = await box(
    { name: 'UI scale', dir: 'col', w: 'fill' },
    await box(
      { name: 'Header', dir: 'row', gap: 32, pad: [0, 0, 10, 0], w: 'fill', stroke: 'role/line', sides: { bottom: 1 } },
      await box({ name: 'Size', w: META_W, h: 1 }),
      ...(await Promise.all(weights.map((w) => text(w, 'UI/xs/Caps', 'role/fg-subtle', { w: 'fill' })))),
    ),
  )
  for (const size of sizes) {
    const first = kit.text.find((t) => t.name.startsWith(`UI/${size}/`))!
    const row = await box(
      { name: size, dir: 'row', gap: 32, align: 'center', pad: [18, 0], w: 'fill', stroke: 'role/line', sides: { bottom: 1 } },
      await box({ name: 'Meta', dir: 'col', gap: 4, w: META_W }, await text(`text-${first.token}`, 'Mono/base/Medium', 'role/fg'), await label(`${first.size}/${first.lineHeight}`)),
    )
    for (const weight of weights) {
      const style = kit.text.find((t) => t.name === `UI/${size}/${weight}`)
      add(
        row,
        style
          ? await box({ name: style.name, dir: 'col', gap: 6, w: 'fill' }, await text(SAMPLE.UI!, style.name, 'role/fg', { w: 'fill' }), await label(style.name))
          : await box({ name: 'None', dir: 'col', w: 'fill' }, await label('—')),
      )
    }
    add(grid, row)
  }
  const caps = kit.text.find((t) => t.name === 'UI/xs/Caps')
  if (caps) add(grid, await specimen(caps))
  return grid
}

export async function typeSheet(pages: Pages, kit: Kit) {
  const { fonts } = context()
  const frame = await sheet(pages, 'type', {
    title: 'Type',
    lede: `${fonts.families.sans} for everything you read, ${fonts.families.mono} for anything measured: labels, tokens, code. The UI runs 11 to 14px on a 4px line grid; 13px is the working size, the density of Linear and Vercel. Headings tighten their tracking; nothing else does. ${fonts.families.display} sets the display steps.`,
  })
  add(frame, await section('UI', 'The component scale, text-ui-xs to text-ui-lg. 13px (text-ui) is the default; 12px for dense labels and badges; 11px only for keycaps, captions and caps labels.', {}, await uiMatrix(kit)))
  const groups: [string, string][] = [
    ['Display', 'Youj Display, the brand face the docs site sets its titles and big figures in (apps/docs/styles/site.css): one weight, a hair of open tracking, never bolder or slanted. Not a theme font, so it is the same in every theme; without it installed these set in Geist.'],
    ['Heading', 'Display sizes for pages and marketing blocks: Tailwind’s scale, semibold, tracking-tight.'],
    ['Body', 'Long-form and marketing copy.'],
    ['Mono', 'Measured things: values, tokens, code, shortcuts.'],
    ['Bezel', 'The Bezel style’s two voices, from bezel.css: the mono capital eyebrow over figures, fields, table heads and sections, and the title of a card head or dialog.'],
  ]
  for (const [group, blurb] of groups) {
    const list = kit.text.filter((t) => t.name.startsWith(`${group}/`))
    const rows = await box({ name: 'Specimens', dir: 'col', w: 'fill' })
    for (const style of list) add(rows, await specimen(style))
    add(frame, await section(group, blurb, {}, rows))
  }
  add(frame, await text(`Themes can set their own families in code (Terminal uses JetBrains Mono throughout, the Classic style IBM Plex). The kit’s styles are set in the default theme’s families, Basalt’s Inter and JetBrains Mono (here ${fonts.families.sans} and ${fonts.families.mono}; a missing family falls back to Roboto and Roboto Mono, with a note on the cover); every theme’s families are recorded as the font/sans and font/mono variables in Theme.`, 'UI/sm/Regular', 'role/fg-muted', { w: 760 }))
}
