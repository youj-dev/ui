import { StealthAurora } from './stealth-aurora'

export type StealthBackdropKind = 'aurora' | 'field' | 'both'

/* Layers behind the stealth intro, all still CSS but the aurora's shader (which
 * loads after first paint). Both keep the middle clear for the tree and let the
 * edges fall away; the pool of light under its root is the tree's box's own
 * (stealth-intro.tsx), so it stays under the root at any size. */
const VIGNETTE = 'radial-gradient(ellipse 75% 70% at 50% 46%, transparent 40%, color-mix(in oklab, var(--color-canvas), black calc(8% + 52% * var(--yj-dark, 1))) 130%)'
const dots = (ink: number) => `radial-gradient(circle, color-mix(in oklab, var(--color-fg) ${ink}%, transparent) 1px, transparent 1.4px)`
// A ring: no dots behind the canopy, none at the edges.
const RING = 'radial-gradient(ellipse 58% 62% at 50% 48%, transparent 34%, black 58%, transparent 92%)'
// Over the aurora, the dots thin out toward the glow at the bottom.
const ABOVE_GLOW = 'linear-gradient(to bottom, black 50%, rgb(0 0 0 / 0.35) 88%)'

export function StealthBackdrop({ kind }: { kind: StealthBackdropKind }) {
  return (
    <div aria-hidden data-backdrop={kind} className="pointer-events-none absolute inset-0 -z-10">
      {kind !== 'field' && <StealthAurora intensity={kind === 'both' ? 0.65 : 0.8} />}
      {kind !== 'aurora' && <DotRing both={kind === 'both'} />}
      <div className="absolute inset-0" style={{ backgroundImage: VIGNETTE }} />
    </div>
  )
}

function DotRing({ both }: { both: boolean }) {
  const mask = both ? `${RING}, ${ABOVE_GLOW}` : RING
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: dots(both ? 13 : 16),
        backgroundSize: '22px 22px',
        backgroundPosition: 'center',
        maskImage: mask,
        WebkitMaskImage: mask,
        maskComposite: both ? 'intersect' : undefined,
        WebkitMaskComposite: both ? 'source-in' : undefined,
      }}
    />
  )
}
