import type { PillarId } from '@/lib/nav'
import { BackdropLayer } from '@/components/docs/backdrop-layer'
import { TILE_MOODS } from '@/components/landing/tile-moods'

/* The home hero's card, without its elements' code: each element's natural size, where it sits in the card, and the
 * card's frame (Blocks), which is static. The hero lays the card out and measures it from these while the elements
 * themselves (hero-elements.tsx) arrive once the page is idle. */

/** Every element's natural size: what its tile shows at 1, and what the card scales down. */
export const ELEMENT_SIZE: Record<PillarId, { w: number; h: number }> = {
  ui: { w: 248, h: 170 },
  motion: { w: 240, h: 136 },
  loaders: { w: 236, h: 272 },
  icons: { w: 196, h: 36 },
  themes: { w: 224, h: 104 },
  illustrations: { w: 212, h: 150 },
  sound: { w: 248, h: 92 },
  blocks: { w: 720, h: 340 },
}

/* ── Blocks: the card's frame, the page its parts sit in ───────────────── */

/** Where each part sits in the card, card-local: the frame draws a panel there, a template's dashed slot once it has left. */
export const SLOTS: Record<Exclude<PillarId, 'blocks'>, { x: number; y: number; w: number; h: number }> = {
  ui: { x: 12, y: 56, w: 236, h: 150 },
  illustrations: { x: 12, y: 214, w: 236, h: 114 },
  loaders: { x: 260, y: 56, w: 224, h: 272 },
  motion: { x: 496, y: 56, w: 212, h: 124 },
  themes: { x: 496, y: 188, w: 212, h: 140 },
  icons: { x: 512, y: 4, w: 196, h: 36 },
  sound: { x: 212, y: 300, w: 240, h: 90 },
}
/** The parts whose place the frame draws a panel for: the toolbar sits in its bar and the notification hangs off its edge. */
const PANELS: Exclude<PillarId, 'blocks'>[] = ['ui', 'illustrations', 'loaders', 'motion', 'themes']

/** The release's window: its bar and the panels its parts sit in, each with a template's dashed slot over it that shows
 *  once the parts have left (the hero fades it in; a tile's frame always shows it). */
export function CardFrame() {
  return (
    <div className="hc-frame relative isolate size-full rounded-2xl border border-line bg-surface shadow-[0_1px_2px_color-mix(in_oklab,var(--color-shadow)_4%,transparent),0_12px_32px_-12px_color-mix(in_oklab,var(--color-shadow)_18%,transparent)]">
      {/* The card's ground in light: the docs previews' drifting aurora, clipped to the card (styles/site.css). */}
      <div aria-hidden className="hc-ground pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]" />
      <div className="hc-head absolute inset-x-0 top-0 flex h-11 items-center gap-2.5 rounded-t-[inherit] border-b border-line px-4">
        <span className="grid size-6 place-items-center rounded-md bg-fg text-[11px] font-bold text-canvas">C</span>
        <span className="text-ui font-semibold text-fg">Checkout</span>
        <span className="text-[12px] text-fg-muted">v2.4 → production</span>
      </div>
      {PANELS.map((id) => {
        const s = SLOTS[id]
        const box = { left: s.x, top: s.y, width: s.w, height: s.h }
        return (
          <div key={id}>
            {/* Each panel on its part's mood (tile-moods.ts), as its tile will be; Themes, which is Youj, on the aurora. */}
            <div className="hc-tile absolute isolate overflow-hidden rounded-lg border border-line" style={box}>
              {TILE_MOODS[id] ? (
                <BackdropLayer id={TILE_MOODS[id]!} live={false} className="-z-10" />
              ) : (
                <div aria-hidden className="hc-aurora pointer-events-none absolute inset-0 -z-10 overflow-hidden" />
              )}
            </div>
            <div className="ho-well absolute rounded-xl border-[5px] border-dashed border-line-strong bg-transparent opacity-0" style={box} />
          </div>
        )
      })}
    </div>
  )
}

