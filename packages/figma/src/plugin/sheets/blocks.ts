import type { Kit, KitBlock } from '../../kit'
import { add, box, text } from '../draw'
import type { Pages } from '../pages'
import { label, note, section, sheet, CONTENT_W } from '../sheet'

/* The Blocks page: cards, sections, screens and frames rendered from
 * Storybook at 1440px in Basalt dark (Bezel), placed as images for reference. They're
 * pictures; the editable parts are the components. */

export async function blocksSheet(pages: Pages, kit: Kit): Promise<string[]> {
  const frame = await sheet(pages, 'blocks', {
    title: 'Blocks',
    lede: 'Reference renders of cards, sections and screens, captured from Storybook at 1440px in Basalt dark and the Bezel style. Use them for layout and density; the editable parts are on the Components page, and the rest is in code.',
  })
  if (!kit.blocks.length) {
    add(frame, await note('No blocks bundled', 'Run `pnpm -F @youj/figma blocks` with Storybook running, then build the plugin again.'))
    return ['Blocks: none bundled']
  }
  const groups: [KitBlock['kind'], string][] = [
    ['Card', 'Cards are small, self-contained compositions of components (packages/ui/src/blocks).'],
    ['Section', 'Sections are one band of a page: a hero, a pricing table (packages/ui/src/blocks).'],
    ['Screen', 'Screens are full-page compositions of public components (packages/ui/src/blocks).'],
    ['Frame', 'Frames are the app chrome around a screen: shell, sidebar, header (packages/ui/src/blocks/frame).'],
  ]
  for (const [kind, blurb] of groups) {
    const list = kit.blocks.filter((s) => s.kind === kind)
    if (!list.length) continue
    const grid = await box({ name: 'Blocks', dir: 'col', gap: 48, w: 'fill' })
    for (const s of list) {
      const image = figma.createImage(figma.base64Decode(s.data))
      const w = CONTENT_W
      const h = Math.round((s.height / s.width) * w)
      const shot = await box({ name: s.title, dir: 'none', w, h, radius: 'radius/lg', stroke: 'role/line', clip: true })
      shot.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' }]
      add(
        grid,
        await box(
          { name: s.title, dir: 'col', gap: 12, w: 'fill' },
          await box({ name: 'Caption', dir: 'row', gap: 12, align: 'baseline', w: 'fill' }, await text(s.title, 'UI/lg/Semibold', 'role/fg'), await label(`${kind} · Storybook: ${s.story}`)),
          shot,
        ),
      )
    }
    add(frame, await section(`${kind}s`, blurb, {}, grid))
  }
  return [`Blocks: ${kit.blocks.length} images`]
}
