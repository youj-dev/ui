/* Where a section or a card sits on its stage (components/showcase/kind-stage.tsx):
 * what the frame sizes itself to. Self-contained (no imports, no closures). */

export interface KindBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * The box the content takes inside a stage's `[data-kind-root]` (the
 * document's first, when no root is given), in client pixels. A section is
 * the root itself, as tall as it is. A card is what's inside its wrappers:
 * going down through single children that fill their parent (a story's or a
 * block's own page around the card), it's the first child narrower than its
 * parent (the card at its own width), or the union of the children where
 * there are several (a row of product cards). Elements placed out of the
 * flow (fixed or absolute) and slivers (a visually hidden live region) don't
 * count.
 */
export function kindBox(framing: 'section' | 'card', root?: Element | null): KindBox | null {
  const stage = root ?? document.querySelector('[data-kind-root]')
  if (!stage) return null
  const toBox = (r: DOMRect): KindBox => ({ x: r.left, y: r.top, width: r.width, height: r.height })
  if (framing === 'section') return toBox(stage.getBoundingClientRect())
  // What lays the card out: not a visually hidden live region, a toast region or a glow placed over it.
  const visible = (el: Element) => {
    const r = el.getBoundingClientRect()
    const position = getComputedStyle(el).position
    return r.width >= 8 && r.height >= 8 && position !== 'fixed' && position !== 'absolute'
  }
  // A wrapper that draws no box of its own (a ThemeScope's `display: contents`) hands its children up.
  const children = (el: Element): Element[] => [...el.children].flatMap((k) => (getComputedStyle(k).display === 'contents' ? children(k) : [k]))
  let el: Element = stage
  for (let depth = 0; depth < 12; depth++) {
    const kids = children(el).filter(visible)
    if (kids.length === 0) break
    if (kids.length > 1) {
      const rects = kids.map((k) => k.getBoundingClientRect())
      const left = Math.min(...rects.map((r) => r.left))
      const top = Math.min(...rects.map((r) => r.top))
      const right = Math.max(...rects.map((r) => r.right))
      const bottom = Math.max(...rects.map((r) => r.bottom))
      return { x: left, y: top, width: right - left, height: bottom - top }
    }
    const child = kids[0]!
    if (child.getBoundingClientRect().width < el.getBoundingClientRect().width - 1) return toBox(child.getBoundingClientRect())
    el = child
  }
  return toBox(el.getBoundingClientRect())
}
