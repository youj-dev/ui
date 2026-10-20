import { add, box, context, rect, rule, style, text, type BoxProps } from './draw'
import type { Pages, SheetKey } from './pages'
import { clearChildren, keyOf, tag } from './store'

/* Sheets: one documentation frame per topic, in the docs site's language. A
 * construction frame (hairline rules, an accent echo bar marking the
 * current thing), display type for titles, mono for anything measured. Every
 * sheet is bound to the Color variables, so switching its Theme or Color mode
 * restyles the documentation along with the components on it. */

export const SHEET_W = 1440
export const SHEET_GAP = 240
export const CONTENT_W = SHEET_W - 2 * 96

const EYEBROW: Record<SheetKey, string> = {
  cover: 'Figma kit',
  colour: 'Foundations',
  type: 'Foundations',
  layout: 'Foundations',
  motion: 'Foundations',
  icons: 'Icons',
  illustrations: 'Illustrations',
  components: 'Components',
  blocks: 'Reference',
}

export interface SheetHead {
  title: string
  lede: string
}

/** One echo from the logo's trail, a bar in the accent at the mark's stem proportions (3.3 wide to 13 tall): marks what's current. */
export function echoBar(height = 10) {
  return rect('Echo', Math.round((height * 3.3) / 13), height, 'role/accent', 1)
}

/**
 * Finds or makes a sheet, empties it and draws its header. Its position on
 * the page is only set when it's new, so a sheet you've moved stays put.
 */
export async function sheet(pages: Pages, key: SheetKey, head: SheetHead): Promise<FrameNode> {
  const page = pages.page(key)
  await page.loadAsync()
  let frame = page.children.find((n) => keyOf(n) === `sheet:${key}`) as FrameNode | undefined
  if (!frame) {
    frame = figma.createFrame()
    page.appendChild(frame)
    frame.x = pages.slot(key) * (SHEET_W + SHEET_GAP)
    frame.y = 0
    tag(frame, `sheet:${key}`)
  }
  clearChildren(frame)
  frame.setPluginData(PENDING, '')
  await style(frame, { name: head.title, dir: 'col', w: SHEET_W, h: 'hug', pad: [96, 96, 128, 96], gap: 72, fill: 'role/canvas', clip: true })
  add(frame, await header(key, head))
  return frame
}

/** Set on a sheet that holds a notice instead of its content: not built yet, or its step failed. */
export const PENDING = 'youj:pending'

const PAGE_TITLES: Record<SheetKey, string> = {
  cover: 'Youj',
  colour: 'Colour',
  type: 'Type',
  layout: 'Spacing & radius',
  motion: 'Motion',
  icons: 'Icons',
  illustrations: 'Illustrations',
  components: 'Components',
  blocks: 'Blocks',
}

const RERUN = 'Run Plugins → Development → Youj kit → Build or update the kit again. It carries on in place; nothing is duplicated.'

async function noticeSheet(pages: Pages, key: SheetKey, title: string, body: string) {
  const page = pages.page(key)
  await page.loadAsync()
  let frame = page.children.find((n) => keyOf(n) === `sheet:${key}`) as FrameNode | undefined
  // Nothing of an earlier build to keep: a new sheet, or one that only holds a notice.
  const fresh = !frame || frame.getPluginData(PENDING) !== '' || frame.layoutMode === 'NONE'
  if (!frame) {
    frame = figma.createFrame()
    page.appendChild(frame)
    frame.x = pages.slot(key) * (SHEET_W + SHEET_GAP)
    frame.y = 0
    tag(frame, `sheet:${key}`)
  }
  frame.setPluginData(PENDING, title)
  const card = await note(title, body)
  if (fresh) {
    clearChildren(frame)
    await style(frame, { name: PAGE_TITLES[key], dir: 'col', w: SHEET_W, h: 'hug', pad: [96, 96, 128, 96], gap: 72, fill: 'role/canvas', clip: true })
    add(frame, await header(key, { title: PAGE_TITLES[key], lede: 'Drawn by the Youj kit plugin from the code.' }), card)
  } else {
    // An earlier build's sheet stays, with its components: the notice goes on top.
    frame.insertChild(Math.min(1, frame.children.length), card)
    card.layoutSizingHorizontal = 'FILL'
  }
}

/** Gives a page that hasn't been drawn yet a notice, so a build that stops early never leaves a page silently empty. */
export async function placeholderSheet(pages: Pages, key: SheetKey) {
  const page = pages.page(key)
  await page.loadAsync()
  if (page.children.some((n) => keyOf(n) === `sheet:${key}`)) return
  await noticeSheet(pages, key, `${PAGE_TITLES[key]} isn’t built yet`, `The build stopped before it reached this page. ${RERUN}`)
}

/** Says on the page itself that its step failed, and why. An earlier build's content is kept. */
export async function failedSheet(pages: Pages, key: SheetKey, problem: string) {
  await noticeSheet(pages, key, `${PAGE_TITLES[key]} didn’t build`, `${problem}\n\n${RERUN} The plugin console (Plugins → Development → Show/Hide console) has the details.`)
}

async function header(key: SheetKey, head: SheetHead) {
  const { kit } = context()
  const eyebrow = await box(
    { name: 'Eyebrow', dir: 'row', gap: 12, align: 'center', w: 'fill' },
    echoBar(),
    await text(`Youj  ·  ${EYEBROW[key]}`, 'UI/xs/Caps', 'role/fg-subtle'),
    await box({ name: 'Spacer', w: 'fill', h: 1 }),
    await text(`kit ${kit.hash}`, 'Mono/xs', 'role/fg-subtle'),
  )
  return box(
    { name: 'Header', dir: 'col', gap: 20, w: 'fill' },
    eyebrow,
    await text(head.title, 'Heading/5xl', 'role/fg'),
    await text(head.lede, 'Body/lg', 'role/fg-muted', { w: 760 }),
    rule(),
  )
}

/** A section: a title on a rule, an optional note, then the content. */
export async function section(title: string, note: string | null, props: BoxProps, ...children: (SceneNode | null | false)[]) {
  const titleRow = await box(
    { name: 'Section header', dir: 'col', gap: 6, w: 'fill' },
    await text(title, 'Heading/xl', 'role/fg'),
    note ? await text(note, 'UI/base/Regular', 'role/fg-muted', { w: 720 }) : null,
  )
  return box({ name: title, dir: 'col', gap: 24, w: 'fill', ...props }, titleRow, ...children)
}

/** A small mono label for anything measured: token names, values. */
export function label(chars: string, ink = 'role/fg-subtle') {
  return text(chars, 'Mono/xs', ink)
}

/** A callout in a well: notes about limits and where the motion lives. */
export async function note(title: string, body: string, w: number | 'fill' = 'fill') {
  return box(
    { name: 'Note', dir: 'row', gap: 12, pad: [14, 16], fill: 'role/well', radius: 'radius/lg', w, align: 'start' },
    await box({ name: 'Marker', dir: 'col', pad: [5, 0, 0, 0] }, echoBar(8)),
    await box(
      { name: 'Text', dir: 'col', gap: 2, w: 'fill' },
      await text(title, 'UI/base/Semibold', 'role/fg'),
      await text(body, 'UI/base/Regular', 'role/fg-muted', { w: 'fill' }),
    ),
  )
}
