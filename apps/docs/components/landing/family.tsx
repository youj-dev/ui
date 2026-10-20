import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRightIcon } from '@/components/client'
import type { Pillar, PillarId } from '@/lib/nav'
import { Stage } from '@/components/site/stage'
import { ThemeScope } from '@youj/core'
import { paletteById } from '@youj/core/lib/youj/theme'
import { BackdropLayer } from '@/components/docs/backdrop-layer'
import { TILE_MOODS } from '@/components/landing/tile-moods'

/**
 * The parts, each a picture, a name and what it holds in words. The whole tile goes to that part's
 * docs (Blocks to its list of screens). Not eight equal tiles: UI, what most come for, leads
 * at twice the size with its blurb, Motion, which moves all the rest, runs wide beside it, and the
 * other six follow as smaller tiles. One to a row on a phone; from `sm` two columns, UI and Motion
 * each across both; from `xl` four, UI two by two, Motion two wide over Loaders and Icons, then
 * the last four in a row. Each repeated part wears one class (`family-*`, styles/site.css), so the
 * tiles don't spell their utilities out eight times in the page and its payload.
 *
 * It's the home hero's end state (components/landing/hero-stage.tsx), and each tile's picture is the
 * hero card's own piece, `element`: pinned, the grid fills the stage over the card, its rows sharing
 * the height, and each tile (`data-tile`) fades in round the piece that travels into it. Elsewhere it
 * follows the card as a section of its own, each tile drawing its piece itself.
 */
export function Family({ pillars, element }: { pillars: Pillar[]; element: (id: PillarId) => ReactNode }) {
  return (
    <section
      id="family"
      aria-labelledby="family-title"
      className="ho-family frame-section max-md:border-t-0 hero-pin:absolute hero-pin:inset-0 hero-pin:border-t-0 hero-pin:before:hidden hero-pin:after:hidden"
    >
      <div className="gutter py-20 md:py-28 hero-pin:flex hero-pin:h-full hero-pin:flex-col hero-pin:justify-end hero-pin:pt-6 hero-pin:pb-4">
        <h2 id="family-title" className="ho-heading type-display-l max-w-[40rem] text-fg">
          Multiple parts. One system.
        </h2>
        <ul className="family-grid mt-12 md:mt-14 hero-pin:mt-[clamp(1.25rem,3vh,2rem)] hero-pin:min-h-0 hero-pin:flex-1 hero-pin:grid-rows-3 hero-pin:max-h-[calc(3*13.5rem+1.5rem)]">
          {pillars.map((pillar) => {
            const size = SIZE[pillar.id]
            return (
              <li key={pillar.id} data-size={size} data-tile={pillar.id} className="family-item">
                <Link prefetch={false} href={pillar.url} data-yj-trigger className="group/tile site-card family-tile focus-ring">
                  {/* The tile's mood runs behind its picture and its words: one ground for the whole card. */}
                  {TILE_MOODS[pillar.id] ? (
                    <BackdropLayer id={TILE_MOODS[pillar.id]!} live={false} className="family-ground" />
                  ) : (
                    <div aria-hidden className="family-ground hc-aurora pointer-events-none absolute overflow-hidden" />
                  )}
                  <Stage aria-hidden inert className="family-stage hero-pin:min-h-0">
                    {TILE_MOODS[pillar.id] ? <ThemeScope palette={paletteById(TILE_MOODS[pillar.id])}>{element(pillar.id)}</ThemeScope> : element(pillar.id)}
                  </Stage>
                  <div className="family-foot">
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="family-name">{pillar.label}</span>
                        {pillar.status && (
                          <span data-status={pillar.status} className="sidebar-badge ms-0! shrink-0">
                            {pillar.status}
                          </span>
                        )}
                      </span>
                      <span className="family-stat">{size ? pillar.blurb : pillar.stat}</span>
                    </span>
                    <ArrowRightIcon size={15} strokeWidth={1.75} className="family-arrow" />
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/** The parts that lead: UI at twice a tile's size, Motion two tiles wide. The rest are single tiles. */
const SIZE: Partial<Record<PillarId, 'lead' | 'wide'>> = { ui: 'lead', motion: 'wide' }
