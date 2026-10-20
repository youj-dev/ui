'use client'

/** Runs `update` now, on the node's scroll and when the node (and, with `children`, each child) resizes: what an edge fade or a "more below" flag measures. Returns the cleanup. */
export function observeScroll(node: HTMLElement, update: () => void, children = false) {
  update()
  node.addEventListener('scroll', update, { passive: true })
  const observer = new ResizeObserver(update)
  observer.observe(node)
  if (children) for (const child of Array.from(node.children)) observer.observe(child)
  return () => {
    node.removeEventListener('scroll', update)
    observer.disconnect()
  }
}
