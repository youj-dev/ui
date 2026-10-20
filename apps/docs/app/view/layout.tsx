import type { ReactNode } from 'react'
import { InlineScript } from '@/components/inline-script'

/* A framed demo keeps its scrollbars: styles/site.css reads this mark on <html>, so it needs no :root:has(), which
 * restyled the whole page on every DOM change. Set as the document is parsed, before the demo paints; /view pages are
 * only ever whole documents (frames, a new tab), never reached by a client navigation. */
export default function ViewLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <InlineScript code="document.documentElement.setAttribute('data-framed','')" />
      {children}
    </>
  )
}
