import { memo } from 'react'
import { icons, type YoujIconComponent } from '@youj/icons'
import { BRAND, splitAfterComma } from '../brand'
import { Backdrop } from '../film/backdrop'
import { Lockup } from '../film/brand'
import { useFrame } from '../sim/simulation'
import { Specimen } from './og'

const [LEAD, KICKER] = splitAfterComma(BRAND.tagline)

/* A square post (1080 × 1080, laid out at 810 × 810 and rendered at 4/3):
 * the lockup and tagline over the tokens specimen, the whole contract on one
 * sheet. Taken where the specimen is built (STILLS_AT.specimen). */
export function SocialTokens() {
  return (
    <>
      <Backdrop glow={0.55} glowAt={{ x: 50, y: 60 }} />
      <Specimen x={-12} y={286} scale={0.58} />
      <div className="absolute inset-x-0 top-16 flex flex-col items-center">
        <div style={{ fontSize: 34 }}>
          <Lockup />
        </div>
        <p className="mt-7 max-w-[34rem] text-center text-[26px] leading-snug font-semibold tracking-[-0.03em] text-balance">
          <span className="text-fg-muted">{LEAD}</span> <span className="text-fg">{KICKER}</span>
        </p>
      </div>
    </>
  )
}

/* ── The icon wall ─────────────────────────────────────────────────────── */

/** A stable, well-mixed order: neighbours come from different categories. */
const ORDER = icons
  .map((icon, i) => ({ icon, key: (i * 7919) % icons.length }))
  .sort((a, b) => a.key - b.key)
  .map(({ icon }) => icon)
const PITCH = 54
const COLS = 15
const ROWS = 10

/* A square post of the set: the icons on a wall, a diagonal wave of their
 * choreographies caught part-way (its front lit in the accent), under the
 * lockup and a line in words (no counts: the post never goes stale as the set
 * grows). Taken at STILLS_AT.icons. */
export function SocialIcons() {
  const frame = useFrame()
  const ox = (810 - (COLS - 1) * PITCH) / 2
  return (
    <>
      <Backdrop />
      <div className="absolute inset-0" style={{ maskImage: 'radial-gradient(ellipse 70% 66% at 50% 60%, black 45%, transparent 92%)' }}>
        {Array.from({ length: ROWS * COLS }, (_, i) => {
          const r = Math.floor(i / COLS)
          const c = i % COLS
          // The wave runs from the top-start corner: behind its front the icons have played.
          const at = 10 + c * 2.4 + r * 3.6
          return (
            <Cell
              key={i}
              Icon={ORDER[i % ORDER.length]!}
              x={ox + c * PITCH}
              y={262 + r * PITCH}
              active={frame >= at}
              front={Math.max(0, 1 - Math.abs(frame - at - 6) / 10)}
            />
          )
        })}
      </div>
      <div className="absolute inset-x-0 top-14 flex flex-col items-center gap-5">
        <div style={{ fontSize: 26 }}>
          <Lockup />
        </div>
        <p className="mt-2 flex items-baseline gap-4 text-[40px] leading-none font-semibold tracking-[-0.035em]">
          <span className="text-fg">Icons that move</span>
          <span aria-hidden className="size-2 self-center rounded-[1.5px] bg-accent" />
          <span className="text-fg-muted">with intent</span>
        </p>
        <p className="font-mono text-[13px] tracking-[0.04em] text-fg-subtle">each with its own choreography</p>
      </div>
    </>
  )
}

const Cell = memo(function Cell({ Icon, x, y, active, front }: { Icon: YoujIconComponent; x: number; y: number; active: boolean; front: number }) {
  return (
    <span
      className="absolute grid size-11 place-items-center"
      style={{
        left: x - 22,
        top: y - 22,
        color: `color-mix(in oklab, var(--color-accent) ${Math.round(front * 100)}%, color-mix(in oklab, var(--color-fg-subtle) 85%, transparent))`,
      }}
    >
      <Icon size={22} strokeWidth={1.5} active={active} trigger="none" />
    </span>
  )
})
