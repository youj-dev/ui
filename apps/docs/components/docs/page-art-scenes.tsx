'use client'

import { useEffect, useRef, useState, type ComponentType } from 'react'
import { useInView } from 'motion/react'
import { useYouj } from '@youj/core'
import {
  IllustrationChat,
  IllustrationCloud,
  IllustrationChecklist,
  IllustrationContract,
  IllustrationDelivery,
  IllustrationDesignTools,
  IllustrationDocuments,
  IllustrationGlobe,
  IllustrationLaptop,
  IllustrationMap,
  IllustrationMuseum,
  IllustrationPipeline,
  IllustrationPuzzle,
  IllustrationScales,
  IllustrationTarget,
  IllustrationTeam,
  IllustrationWarehouse,
  type IllustrationProps,
} from '@youj/illustrations'
import { cn } from '@/lib/cn'
import type { PageArtId } from '@/lib/page-art'

/* Each page's composition, for <PageArt>: a row of isometric scenes from the
 * registry, and between two that hand something on, a dashed route with a
 * particle running along it. The scenes all frame the same volume, so their
 * floors share one line whatever they show; their empty edges overlap, the
 * drawings don't. Every size is the one it has in the 48rem column, scaled
 * down with the band where it's narrower (--s), and a scene marked `wide`
 * steps out on a phone.
 *
 * The scenes are drawn finished, so the server's band is whole from the first
 * paint; after a navigation they arrive with the page's text (styles/site.css,
 * `.docs-page[data-arrive]`), a step after their band. Each floats its hero
 * part (the kit's own motion, one clock per scene). A route's particle runs
 * only while the band is on screen. Reduced motion: nothing moves and the
 * particle rests where it arrives. */

type Scene = ComponentType<IllustrationProps>

interface Slot {
  scene: Scene
  /** The scene's box width in px at full size; its height follows (every scene frames one volume). */
  size: number
  /** Down this far (px at full size), for a row that steps. */
  dy?: number
  /** Left out where the band is narrow. */
  wide?: true
  /** Its accent in light, one of the docs' aurora colours, stronger (styles/site.css, data-art-tone); dark keeps the site's. Unset, the band picks one in turn. */
  tone?: 'mint' | 'sky' | 'violet' | 'peach'
}

interface Route {
  /** Its length in px at full size. */
  route: number
}

type Part = Slot | Route

const ART: Record<PageArtId, readonly Part[]> = {
  installation: [{ scene: IllustrationDelivery, size: 276 }],
  cli: [{ scene: IllustrationLaptop, size: 212 }, { route: 72 }, { scene: IllustrationDocuments, size: 212 }],
  'shadcn-registry': [{ scene: IllustrationWarehouse, size: 212 }, { route: 72 }, { scene: IllustrationLaptop, size: 212 }],
  'choosing-a-level': [{ scene: IllustrationMuseum, size: 212 }, { route: 72 }, { scene: IllustrationLaptop, size: 212 }],
  ai: [{ scene: IllustrationChat, size: 212 }, { route: 72 }, { scene: IllustrationCloud, size: 212 }],
  figma: [{ scene: IllustrationDesignTools, size: 276 }],
  comparison: [{ scene: IllustrationScales, size: 276 }],
  versioning: [{ scene: IllustrationContract, size: 276 }],
  contributing: [{ scene: IllustrationTeam, size: 276 }],
  guides: [{ scene: IllustrationMap, size: 276 }],
  shadcn: [{ scene: IllustrationPipeline, size: 276 }],
  composing: [{ scene: IllustrationPuzzle, size: 276 }],
  i18n: [{ scene: IllustrationGlobe, size: 276 }],
  accessibility: [{ scene: IllustrationChecklist, size: 236 }, { scene: IllustrationTarget, size: 236 }],
}

const TONES = ['mint', 'sky', 'violet', 'peach'] as const

/** A band's first tone, from its name: varied across pages, the same on every visit (and on the server). */
const firstTone = (art: string) => [...art].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TONES.length

/** The particle's run along a route, in CSS so it's off the main thread: out, along, arrived, gone. */
const RUN = `@keyframes page-art-run {
  0% { translate: -100% 0; opacity: 0 }
  8% { opacity: 1 }
  55% { translate: 0 0; opacity: 1 }
  70%, 100% { translate: 0 0; opacity: 0 }
}`

export function PageArtScenes({ art }: { art: PageArtId }) {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const inView = useInView(root, { amount: 0.25 })
  // The float starts once the page has hydrated: its first frame is a fraction of a pixel the server and the
  // browser round differently.
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return (
    <div
      ref={root}
      className="absolute inset-0 flex -translate-y-[calc(var(--s)*8px)] items-center justify-center [--s:1] @max-[40rem]:[--s:0.84] @max-[30rem]:[--s:0.7]"
    >
      <style href="page-art-run" precedence="default">
        {RUN}
      </style>
      {ART[art].map((part, i) =>
        'route' in part ? (
          <RouteLine key={i} length={part.route} run={inView && !k.reduced} />
        ) : (
          <div
            key={i}
            // A scene's own tone, else the next of the aurora's four from where this band starts.
            data-art-tone={part.tone ?? TONES[(firstTone(art) + i) % TONES.length]}
            className={cn('shrink-0', part.wide && '@max-[30rem]:hidden')}
            style={{
              width: `calc(var(--s) * ${part.size}px)`,
              marginInline: `calc(var(--s) * ${-part.size * 0.09}px)`,
              translate: part.dy ? `0 calc(var(--s) * ${part.dy}px)` : undefined,
            }}
          >
            <part.scene unit={16} grow assemble={false} float={hydrated} />
          </div>
        ),
      )}
    </div>
  )
}

/** A dashed route between two scenes, at the height of their floors, and the particle that runs it. */
function RouteLine({ length, run }: { length: number; run: boolean }) {
  const k = useYouj()
  return (
    <div className="relative z-10 h-px shrink-0 rtl:-scale-x-100" style={{ width: `calc(var(--s) * ${length}px)`, translate: '0 calc(var(--s) * 14px)' }}>
      <span className="absolute inset-0 border-t border-dashed border-line-strong" />
      <span
        className="absolute inset-y-0 w-full"
        style={
          k.reduced
            ? undefined
            : {
                animation: 'page-art-run calc(var(--yj-duration-deliberate) * 6) var(--ease-standard) infinite',
                animationPlayState: run ? 'running' : 'paused',
              }
        }
      >
        <span className="particle absolute end-0 -top-[3px] size-[5px]" />
      </span>
    </div>
  )
}
