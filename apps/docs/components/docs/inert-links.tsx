'use client'

import type { MouseEvent, ReactNode } from 'react'

/* Demos link to pages that only exist in the imagined app (/pricing, /acme/web…).
 * Inside a demo, a click on an in-site link does nothing instead of a 404.
 * Links to other sites, new tabs and in-page anchors still work. */
export function inertDemoLink(e: MouseEvent) {
  const a = (e.target as HTMLElement).closest?.('a[href]')
  const href = a?.getAttribute('href')
  // The full-page preview's own chrome (its Close, the island's way back) and an example's Expand are the page's, not a demo's.
  if (a?.closest('[data-full-preview], [data-expand]')) return
  if (href?.startsWith('/') && !href.startsWith('//') && a?.getAttribute('target') !== '_blank') e.preventDefault()
}

export function InertLinks({ children, ...props }: { children: ReactNode; id?: string; className?: string; 'data-frame-view'?: string }) {
  return (
    <div {...props} onClickCapture={inertDemoLink}>
      {children}
    </div>
  )
}
