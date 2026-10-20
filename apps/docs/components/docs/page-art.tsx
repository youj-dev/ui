import { useId } from 'react'
import { PageArtScenes } from '@/components/mdx-lazy'
import type { PageArtId } from '@/lib/page-art'

/* The picture a Get started or Guides page opens with, straight under its
 * title: a short band of the page's own canvas in a hairline frame, an
 * isometric grid for the scenes to stand on, and the page's composition of
 * scenes, which arrive with the page's text after a navigation and then float.
 * A topic loop, quieter: it follows the site's theme and mode, it's a fixed
 * height (so nothing moves as it loads) and it's decorative.
 *
 * The frame is drawn here, on the server, with no JavaScript; only the
 * scenes hydrate, for their assemble and float, and those run only while
 * the band is on screen. Reduced motion: nothing moves. */

/** The grid's rhombus, one grid unit every GAP px: the same rhombi as a scene's floor. */
const GAP = 14
const [W, H] = [GAP * Math.sqrt(3), GAP]

export function PageArt({ art }: { art: PageArtId }) {
  const grid = `page-art-${useId().replace(/[^\w-]/g, '')}`
  return (
    <div
      aria-hidden
      inert
      data-page-art={art}
      className="not-prose @container pointer-events-none relative isolate mb-10 h-38 overflow-hidden rounded-2xl border border-line bg-canvas select-none sm:h-46"
    >
      <svg className="absolute inset-0 -z-10 size-full [mask-image:radial-gradient(ellipse_58%_80%_at_50%_62%,black_20%,transparent_80%)]">
        <defs>
          <pattern id={grid} width={W} height={H} patternUnits="userSpaceOnUse" x="50%" y="50%">
            <path d={`M0,${H / 2} L${W / 2},0 L${W},${H / 2} L${W / 2},${H} Z`} style={{ fill: 'none', stroke: 'color-mix(in oklab, var(--color-fg) 7%, transparent)', strokeWidth: 1 }} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${grid})`} />
      </svg>
      {/* A pool of light on the floor the scenes stand on. */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_34%_46%_at_50%_70%,color-mix(in_oklab,var(--color-fg)_5%,transparent),transparent)]" />
      <PageArtScenes art={art} />
    </div>
  )
}
