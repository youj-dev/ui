/* The rail's geometry, as plain functions (they're the hard part, so
 * they're tested on their own).
 *
 * layoutRail is Google Docs' rule: each card wants to sit level with its
 * anchor. Cards never overlap, so in document order each one sits at its
 * anchor or just under the card before it. The active card wins: it sits on
 * its anchor exactly, the cards after it are pushed down from it, and the
 * cards before it are pushed up from it. If that pushes the first card above
 * the top, everything is laid out downwards from the top instead. */

export interface RailItem {
  id: string
  /** Where its anchor is, from the top of the document. */
  anchor: number
  height: number
}

export function layoutRail(items: readonly RailItem[], active: string | null, gap = 8): Map<string, number> {
  const tops = items.map((item) => item.anchor)
  const at = active ? items.findIndex((item) => item.id === active) : -1
  const down = (from: number) => {
    for (let i = Math.max(from, 1); i < items.length; i++) tops[i] = Math.max(tops[i]!, tops[i - 1]! + items[i - 1]!.height + gap)
  }
  if (at === -1) down(1)
  else {
    down(at + 1)
    for (let i = at - 1; i >= 0; i--) tops[i] = Math.min(tops[i]!, tops[i + 1]! - items[i]!.height - gap)
  }
  if (items.length && tops[0]! < 0) {
    tops[0] = 0
    down(1)
  }
  return new Map(items.map((item, i) => [item.id, tops[i]!]))
}

export interface Segment {
  text: string
  start: number
  /** The threads anchored on this run, in the order they were given. */
  ids: string[]
}

/** A block's text cut at every anchor's edges: each run knows which threads cover it. */
export function segments(text: string, anchors: readonly { id: string; start: number; end: number }[]): Segment[] {
  const valid = anchors.filter((a) => a.start >= 0 && a.end > a.start && a.start < text.length)
  const cuts = [...new Set([0, text.length, ...valid.flatMap((a) => [a.start, Math.min(a.end, text.length)])])].sort((a, b) => a - b)
  const out: Segment[] = []
  for (let i = 0; i < cuts.length - 1; i++) {
    const start = cuts[i]!
    const end = cuts[i + 1]!
    if (end <= start) continue
    out.push({ text: text.slice(start, end), start, ids: valid.filter((a) => a.start <= start && a.end >= end).map((a) => a.id) })
  }
  return out
}

/** The character offset of a DOM position (a node and an offset in it) within a block's text. */
export function offsetIn(block: Element, node: Node, offset: number): number {
  if (node.nodeType !== Node.TEXT_NODE) {
    // A position between children: count the text before that child.
    const range = block.ownerDocument.createRange()
    range.setStart(block, 0)
    range.setEnd(node, offset)
    return range.toString().length
  }
  const walker = block.ownerDocument.createTreeWalker(block, NodeFilter.SHOW_TEXT)
  let total = 0
  for (let current = walker.nextNode(); current; current = walker.nextNode()) {
    if (current === node) return total + offset
    total += current.textContent?.length ?? 0
  }
  return total
}
