'use client'

import { useEffect, useState, type RefObject } from 'react'
import type { DocCommentsAnchor } from './data'
import { offsetIn } from './layout'

/** A selection in the document that can take a comment: its anchor, its words and where it ends on screen (from the document's top-start corner). */
export interface DocSelection {
  anchor: DocCommentsAnchor
  quote: string
  /** The selection's last line: its bottom, and where it ends along the line. */
  bottom: number
  end: number
}

const same = (a: DocSelection | null, b: DocSelection | null) =>
  a === b ||
  (!!a &&
    !!b &&
    a.anchor.block === b.anchor.block &&
    a.anchor.start === b.anchor.start &&
    a.anchor.end === b.anchor.end &&
    a.bottom === b.bottom &&
    a.end === b.end)

/** Reads the page's selection while it lies in the document's text. One that runs past its block ends at the block's end. */
export function readSelection(doc: HTMLElement): DocSelection | null {
  const selection = doc.ownerDocument.getSelection()
  if (!selection || selection.isCollapsed || !selection.rangeCount) return null
  const range = selection.getRangeAt(0)
  if (!doc.contains(range.commonAncestorContainer)) return null
  const element = (node: Node) => (node instanceof Element ? node : node.parentElement)
  const block = element(range.startContainer)?.closest<HTMLElement>('[data-yj-block]')
  if (!block || !doc.contains(block)) return null
  const text = block.textContent ?? ''
  let start = offsetIn(block, range.startContainer, range.startOffset)
  let end = block.contains(range.endContainer) ? offsetIn(block, range.endContainer, range.endOffset) : text.length
  while (start < end && /\s/.test(text[start]!)) start++
  while (end > start && /\s/.test(text[end - 1]!)) end--
  if (end <= start) return null
  const rects = range.getClientRects()
  const last = rects[rects.length - 1] ?? range.getBoundingClientRect()
  const box = doc.getBoundingClientRect()
  const rtl = getComputedStyle(doc).direction === 'rtl'
  return {
    anchor: { block: block.dataset.yjBlock!, start, end },
    quote: text.slice(start, end),
    bottom: last.bottom - box.top,
    end: rtl ? box.right - last.left : last.right - box.left,
  }
}

/** The current commentable selection in `doc`, or null. Off while `enabled` is false. */
export function useDocSelection(doc: RefObject<HTMLElement | null>, enabled: boolean) {
  const [selection, setSelection] = useState<DocSelection | null>(null)
  useEffect(() => {
    if (!enabled) return
    const read = () => {
      const el = doc.current
      const next = el ? readSelection(el) : null
      setSelection((current) => (same(current, next) ? current : next))
    }
    document.addEventListener('selectionchange', read)
    return () => {
      document.removeEventListener('selectionchange', read)
      setSelection(null)
    }
  }, [doc, enabled])
  return enabled ? selection : null
}
