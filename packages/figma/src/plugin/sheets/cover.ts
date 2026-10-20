import type { Kit, KitLogo, Mode } from '../../kit'
import { add, box, context, rect, rule, solid, style, text, vector } from '../draw'
import type { Pages, SheetKey } from '../pages'
import type { Report } from '../run'
import { echoBar, PENDING, SHEET_GAP, SHEET_W } from '../sheet'
import { message } from '../steps'
import { clearChildren, keyOf, tag } from '../store'

/* The cover: the logo on its construction grid, what the kit holds, where
 * everything is, and what this build did (plan, collections, pages, anything
 * worth a look). */

const TITTLE = 'brand:tittle'

/** The tittle's paint in a mode. The logo's one colour is the brand's, not the theme's: Basalt's amber in dark, Graphite's blue in light. */
export function tittlePaint(logo: KitLogo, mode: Mode): SolidPaint {
  const { r, g, b, a } = logo.tittleColor[mode]
  return { type: 'SOLID', color: { r, g, b }, opacity: a }
}

/** Repaints the tittles on the current page for a mode, as the Theme command switches it (no variable holds a colour that ignores the theme). */
export function paintTittles(logo: KitLogo, mode: Mode) {
  for (const node of figma.currentPage.findAll((n) => keyOf(n) === TITTLE)) (node as VectorNode).fills = [tittlePaint(logo, mode)]
}

/** The logo (the word in the ink, each letter its own vector, and the tittle in the brand's colour) at `scale` × its grid, in the box it's set 1em tall in. */
export async function lockup(logo: KitLogo, scale: number): Promise<FrameNode> {
  const { vars } = context()
  const f = figma.createFrame()
  await style(f, { name: 'Youj logo', dir: 'none', w: logo.box.width, h: logo.box.height })
  // Drawn on the word's grid, then moved so the box's corner is the frame's origin.
  const place = (node: SceneNode) => {
    node.x -= logo.box.x
    node.y -= logo.box.y
  }
  for (const l of logo.letters) place(vector(f, l.d, { fill: solid('role/fg'), evenOdd: true }, l.letter))
  // A square path rather than a rectangle, so it scales with the letters, edge for edge.
  const { x, y, size } = logo.tittle
  place(tag(vector(f, `M${x} ${y}H${+(x + size).toFixed(3)}V${+(y + size).toFixed(3)}H${x}Z`, { fill: tittlePaint(logo, vars.applied.mode) }, 'Tittle'), TITTLE))
  f.rescale(scale)
  return f
}

/** The logo on its construction grid: the lines the letters stand on, labelled at the edge. */
async function construction(logo: KitLogo) {
  const scale = 9
  const width = SHEET_W - 192
  const height = 400
  const panel = await box({ name: 'Construction', dir: 'none', w: width, h: height, radius: 'radius/xl', fill: 'role/well', clip: true })
  const mark = await lockup(logo, scale)
  mark.x = Math.round((width - logo.box.width * scale) / 2)
  mark.y = Math.round((height - logo.box.height * scale) / 2)
  const lines: [string, number][] = [
    ['ascender', logo.grid.ascender],
    ['x-height', logo.grid.xHeight],
    ['baseline', logo.grid.baseline],
    ['descender', logo.grid.descender],
  ]
  for (const [name, unit] of lines) {
    const y = Math.round(mark.y + (unit - logo.box.y) * scale)
    const line = rect(`Guide: ${name}`, width, 1, 'role/line-strong')
    add(panel, line)
    line.y = y
    const tagText = await text(`${name} ${unit}`, 'Mono/xs', 'role/fg-subtle', { w: 120, align: 'RIGHT' })
    add(panel, tagText)
    tagText.x = width - 24 - 120
    tagText.y = y - 18
  }
  // The logo goes on top of its guides.
  add(panel, mark)
  const caption = await text(
    'The word in the ink, no badge; its one colour is the j’s square tittle. Every corner turns on the j’s bend. Under about 48px, the tittle grows 1.3× about its centre.',
    'Mono/xs',
    'role/fg-subtle',
  )
  add(panel, caption)
  caption.x = 24
  caption.y = height - 36
  return panel
}

const CONTENTS: [SheetKey, string, string][] = [
  ['colour', 'Colour', 'The palette and the ui names, per theme and mode, bound to variables.'],
  ['type', 'Type', 'Inter and JetBrains Mono (Basalt’s families) and the Youj Display brand face on the 4px grid, bound to the Scale variables.'],
  ['layout', 'Spacing & radius', 'Spacing, radius, control heights, density, elevation and focus.'],
  ['motion', 'Motion', 'Durations, curves, springs and staggers for each personality.'],
  ['icons', 'Icons', 'Every Youj icon as a component; state icons as sets.'],
  ['illustrations', 'Illustrations', 'The isometric scenes as static vectors, by category, in Basalt light and dark.'],
  ['components', 'Components', 'The ui components as sets, with the code’s props as variants.'],
  ['blocks', 'Blocks', 'Cards, sections and screens rendered from Storybook, for reference.'],
]

async function stat(value: string, caption: string) {
  return box(
    { name: caption, dir: 'col', gap: 4, w: 'fill', h: 'fill', pad: [20, 20], radius: 'radius/lg', stroke: 'role/line' },
    await text(value, 'Heading/4xl', 'role/fg'),
    await text(caption, 'UI/base/Regular', 'role/fg-muted', { w: 'fill' }),
  )
}

export async function coverSheet(pages: Pages, kit: Kit, report: Report): Promise<FrameNode> {
  const page = pages.page('cover')
  await page.loadAsync()
  let frame = page.children.find((n) => keyOf(n) === 'sheet:cover') as FrameNode | undefined
  if (!frame) {
    frame = figma.createFrame()
    // The cover is drawn last (it reports on the build) but leads the page.
    page.insertChild(0, frame)
    frame.x = pages.slot('cover') * (SHEET_W + SHEET_GAP)
    frame.y = 0
    tag(frame, 'sheet:cover')
  }
  clearChildren(frame)
  frame.setPluginData(PENDING, '')
  await style(frame, { name: 'Cover', dir: 'col', w: SHEET_W, h: 'hug', pad: [96, 96, 128, 96], gap: 64, fill: 'role/canvas', clip: true })
  const { vars } = context()

  const eyebrow = await box(
    { name: 'Eyebrow', dir: 'row', gap: 12, align: 'center', w: 'fill' },
    echoBar(),
    await text('Youj  ·  Figma kit', 'UI/xs/Caps', 'role/fg-subtle'),
    await box({ name: 'Spacer', w: 'fill', h: 1 }),
    await text(`kit ${kit.hash}`, 'Mono/xs', 'role/fg-subtle'),
  )
  const hero = await box(
    { name: 'Title', dir: 'col', gap: 20, w: 'fill' },
    await text('The Youj design system, drawn from its code.', 'Heading/6xl', 'role/fg', { w: 1000 }),
    await text(
      'Variables, styles, icons and components generated from packages/core, packages/motion and packages/ui by the Youj kit plugin. When the code changes, run the plugin again: everything on these pages updates in place, and your instances stay linked.',
      'Body/lg',
      'role/fg-muted',
      { w: 760 },
    ),
  )
  const variables = kit.colors.length + kit.theme.length + kit.fonts.length + kit.scale.length
  const stats = await box(
    { name: 'Stats', dir: 'row', gap: 16, w: 'fill' },
    await stat(String(kit.themes.length), `themes, light and dark: ${kit.themes.map((t) => t.name).join(', ')}`),
    await stat(String(variables), 'variables in Theme, Color and Scale, plus Motion'),
    await stat(String(kit.icons.length), `icons, ${kit.icons.filter((i) => i.states).length} of them with two states`),
    await stat(String(report.components), 'component sets, bound to the variables'),
  )

  const contents = await box({ name: 'Contents', dir: 'row', gap: 16, wrap: 16, w: 'fill' })
  for (const [key, name, blurb] of CONTENTS) {
    const where = pages.compact ? ` · on ${pages.page(key).name}` : ''
    add(
      contents,
      await box(
        { name, dir: 'col', gap: 4, w: 400, pad: [16, 0], stroke: 'role/line', sides: { top: 1 } },
        await text(`${name}${where}`, 'UI/base/Semibold', 'role/fg'),
        await text(blurb, 'UI/base/Regular', 'role/fg-muted', { w: 'fill' }),
      ),
    )
  }

  // The lockup is decoration; the build report is what the cover is for, so a failed drawing doesn't take the report with it.
  let lockupFrame: FrameNode | null = null
  try {
    lockupFrame = await construction(kit.logo)
  } catch (error) {
    report.warnings.push(`The cover's lockup couldn't be drawn (${message(error)}).`)
  }

  const build = await box({ name: 'This build', dir: 'col', gap: 6, w: 'fill', pad: [24, 24], radius: 'radius/lg', fill: 'role/well' })
  add(build, await text(`This build · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`, 'UI/base/Semibold', 'role/fg'))
  for (const line of report.lines) add(build, await text(line, 'Mono/xs', 'role/fg-muted', { w: 'fill' }))
  for (const w of report.warnings) add(build, await text(`Note: ${w}`, 'Mono/xs', 'role/warning-text', { w: 'fill' }))
  for (const p of report.problems) add(build, await text(`Problem: ${p}`, 'Mono/xs', 'role/danger-text', { w: 'fill' }))
  const applied = kit.themes.find((t) => t.id === vars.applied.theme)!
  add(
    build,
    await text(
      vars.layout.theme === 'modes'
        ? 'Themes are modes: select a frame and pick Theme and Color modes in the Appearance panel, or run Plugins → Youj kit → Theme.'
        : `Showing ${applied.name} · ${vars.applied.mode === 'dark' ? 'Dark' : 'Light'}. On this plan run Plugins → Youj kit → Theme to switch the whole file.`,
      'Mono/xs',
      'role/fg',
      { w: 'fill' },
    ),
  )

  add(
    frame,
    eyebrow,
    lockupFrame,
    hero,
    stats,
    rule(),
    contents,
    build,
    await text('Generated. Every run redraws these sheets: keep your own work on other pages or beside them.', 'Mono/xs', 'role/fg-subtle'),
  )
  return frame
}
