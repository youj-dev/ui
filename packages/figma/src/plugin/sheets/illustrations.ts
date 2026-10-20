import type { Kit, Mode } from '../../kit'
import { add, box, text } from '../draw'
import type { Pages } from '../pages'
import { label, note, section, sheet, CONTENT_W } from '../sheet'
import { message, pause } from '../steps'

/* The Illustrations page: every isometric scene in the registry as static
 * vectors, grouped by category, each in Basalt light and dark (captured by
 * scripts/illustrations.ts through the docs explorer's own SVG export). They're
 * drawings, not components: a scene paints from the theme's custom properties,
 * and Figma has no such thing, so the colours are the ones the browser computed
 * for that preset and mode. The sheet is redrawn on every run. */

const COLUMNS = 3
const GAP = 16
const CARD_W = Math.floor((CONTENT_W - GAP * (COLUMNS - 1)) / COLUMNS)
const PAD = 12
const THUMB_W = Math.floor((CARD_W - 2 * PAD - 8) / 2)
const THUMB_H = 168
const MODES: Mode[] = ['light', 'dark']

/** The size an SVG declares, in px. */
function sizeOf(svg: string): { w: number; h: number } {
  const w = Number(/<svg[^>]*\swidth="([\d.]+)"/.exec(svg)?.[1])
  const h = Number(/<svg[^>]*\sheight="([\d.]+)"/.exec(svg)?.[1])
  if (!(w > 0) || !(h > 0)) throw new Error('the SVG declares no size')
  return { w, h }
}

export async function illustrationsSheet(pages: Pages, kit: Kit): Promise<string[]> {
  const { preset, categories, scenes } = kit.illustrations
  const frame = await sheet(pages, 'illustrations', {
    title: 'Illustrations',
    lede: scenes.length
      ? `${scenes.length} isometric scenes in ${categories.length} categories, from the illustrations registry in @youj/illustrations, drawn as static vectors: each in ${preset[0]!.toUpperCase()}${preset.slice(1)} light and dark, at its finished frame.`
      : 'The isometric scenes from the illustrations registry.',
  })
  if (!scenes.length) {
    add(frame, await note('No illustrations bundled', 'Run `pnpm -F @youj/figma illustrations` with Storybook running, then build the plugin again.'))
    return ['Illustrations: none bundled']
  }
  add(
    frame,
    await box(
      { name: 'Notes', dir: 'row', gap: 16, w: 'fill' },
      await note('Static, by design', 'A scene paints itself from the theme at run time (colour mixes of the palette). Figma can’t, so these carry the colours the docs’ own SVG export gives for one preset and mode. Recolour by hand, or re-capture for another preset.'),
      await note('Where the motion is', 'In code a scene assembles as it scrolls into view, its hero part floats and, on hover, it comes apart. The explorer on the docs site plays all of it and exports the same SVG.'),
    ),
  )

  // Surfaces the scenes were shaded against, as plain paints: the drawings don't follow the file's mode, so neither do their stages.
  const surface = kit.colors.find((c) => c.name === 'role/surface')
  const stage = (mode: Mode): SolidPaint => {
    const v = surface?.[mode]
    const c = v && 'values' in v ? v.values[preset] : undefined
    return { type: 'SOLID', color: c ? { r: c.r, g: c.g, b: c.b } : mode === 'dark' ? { r: 0.1, g: 0.1, b: 0.11 } : { r: 1, g: 1, b: 1 } }
  }

  let drawn = 0
  const failed: string[] = []
  for (const category of categories) {
    const list = scenes.filter((s) => s.category === category.id)
    if (!list.length) continue
    const grid = await box({ name: 'Grid', dir: 'row', gap: GAP, wrap: GAP, w: 'fill' })
    for (const scene of list) {
      // Each scene is a few hundred nodes; let Figma repaint the panel between them.
      if (++drawn % 4 === 0) await pause()
      const thumbs: FrameNode[] = []
      for (const mode of MODES) {
        const thumb = await box({ name: `${scene.name} · ${mode}`, dir: 'none', w: THUMB_W, h: THUMB_H, radius: 'radius/md', fill: stage(mode), clip: true })
        try {
          const svg = scene.svg[mode]
          const { w, h } = sizeOf(svg)
          const node = figma.createNodeFromSvg(svg)
          add(thumb, node)
          node.name = scene.name
          const k = Math.min((THUMB_W - 16) / w, (THUMB_H - 16) / h)
          node.rescale(k)
          node.x = Math.round((THUMB_W - node.width) / 2)
          node.y = Math.round((THUMB_H - node.height) / 2)
        } catch (error) {
          failed.push(`${scene.id} (${mode}): ${message(error)}`)
          for (const child of [...thumb.children]) child.remove()
          add(thumb, await text('Not drawn', 'Mono/xs', 'role/fg-subtle'))
        }
        thumbs.push(thumb)
      }
      add(
        grid,
        await box(
          { name: scene.name, dir: 'col', gap: 10, pad: PAD, w: CARD_W, radius: 'radius/lg', stroke: 'role/line' },
          await box({ name: 'Light and dark', dir: 'row', gap: 8, w: 'fill' }, ...thumbs),
          await box(
            { name: 'Label', dir: 'col', gap: 2, w: 'fill' },
            await text(scene.name, 'UI/base/Medium', 'role/fg', { w: 'fill', truncate: true }),
            await label(`${category.id} · ${scene.id}`),
          ),
        ),
      )
    }
    add(frame, await section(category.name, `${list.length} scene${list.length === 1 ? '' : 's'}`, {}, grid))
  }
  if (failed.length === scenes.length * MODES.length) throw new Error(`no scene could be drawn: ${failed[0]}`)
  if (failed.length) {
    console.error(`Youj kit: ${failed.length} illustration drawings failed`, failed)
    add(frame, await note(`${failed.length} drawing${failed.length === 1 ? '' : 's'} could not be drawn`, `${failed.slice(0, 3).join('; ')}${failed.length > 3 ? '…' : ''} The rest of the page is complete; run the plugin again after an update.`))
  }
  return [`Illustrations: ${scenes.length} scenes in ${categories.length} categories${failed.length ? `, ${failed.length} drawings failed` : ''}`]
}
