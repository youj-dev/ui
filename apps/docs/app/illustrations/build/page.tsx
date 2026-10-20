import type { Metadata } from 'next'
import { IllustrationBuilder } from '@/components/illustrations/builder/builder'

export const metadata: Metadata = {
  title: 'Illustration builder',
  description:
    'Build a new isometric illustration from the Youj kit: drag boxes, cylinders, prisms and turned solids onto the floor, preview it in any theme, and take it home as code, SVG, PNG or JSON. Experimental.',
}

/* The builder reads its scene from the link (or this browser's copy) before
 * its first paint, so it renders in the browser; the server sends it with the
 * first template in place. */
export default function IllustrationBuilderPage() {
  return (
    <main id="main" tabIndex={-1} aria-label="Illustration builder" className="min-h-0 flex-1 outline-none">
      <IllustrationBuilder />
    </main>
  )
}
