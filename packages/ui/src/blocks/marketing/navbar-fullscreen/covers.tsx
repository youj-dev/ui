/* The menu's pictures: abstract covers drawn in the theme's roles, one per
 * destination, so they follow every preset and both modes. Decorative: the
 * link and its caption say the same in words. Swap them for your own media. */

const frame = 'size-full bg-well'

/** Concentric arcs from a corner: identity, brand. */
export function ArcsCover() {
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden className={frame}>
      {[340, 280, 220, 160, 100].map((r, i) => (
        <circle key={r} cx="0" cy="500" r={r} fill="none" strokeWidth={i === 2 ? 22 : 1.5} className={i === 2 ? 'stroke-accent' : 'stroke-line-strong'} />
      ))}
      <circle cx="300" cy="120" r="26" className="fill-fg" />
    </svg>
  )
}

/** A field of dots with a few lit: systems, products. */
export function GridCover() {
  const lit = new Set([14, 15, 22, 29, 30, 31, 38])
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden className={frame}>
      {Array.from({ length: 7 * 8 }, (_, i) => {
        const x = 50 + (i % 7) * 50
        const y = 75 + Math.floor(i / 7) * 50
        return lit.has(i) ? <rect key={i} x={x - 12} y={y - 12} width="24" height="24" rx="6" className="fill-accent" /> : <circle key={i} cx={x} cy={y} r="3" className="fill-fg-subtle" />
      })}
    </svg>
  )
}

/** Planes stacked in perspective: layers, platforms. */
export function StackCover() {
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden className={frame}>
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M200 ${150 + i * 70} L330 ${215 + i * 70} L200 ${280 + i * 70} L70 ${215 + i * 70} Z`}
          strokeWidth="1.5"
          className={i === 0 ? 'fill-accent stroke-accent' : 'fill-surface stroke-line-strong'}
          opacity={i === 0 ? 1 : 1 - i * 0.15}
        />
      ))}
    </svg>
  )
}

/** A body with its satellites: motion, orbit. */
export function OrbitCover() {
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden className={frame}>
      <ellipse cx="200" cy="250" rx="150" ry="60" fill="none" strokeWidth="1.5" className="stroke-line-strong" transform="rotate(-24 200 250)" />
      <ellipse cx="200" cy="250" rx="110" ry="150" fill="none" strokeWidth="1.5" className="stroke-line-strong" transform="rotate(32 200 250)" />
      <circle cx="200" cy="250" r="54" className="fill-fg" />
      <circle cx="318" cy="196" r="12" className="fill-accent" />
      <circle cx="132" cy="364" r="8" className="fill-fg-subtle" />
    </svg>
  )
}

/** Bars of varied height: sound, data, rhythm. */
export function BarsCover() {
  const heights = [120, 210, 160, 300, 240, 340, 190, 260, 140]
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden className={frame}>
      {heights.map((h, i) => (
        <rect key={i} x={38 + i * 38} y={420 - h} width="20" height={h} rx="10" className={i === 5 ? 'fill-accent' : 'fill-line-strong'} />
      ))}
    </svg>
  )
}

/** A large letter pair: type, editorial, words. */
export function TypeCover() {
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden className={frame}>
      <text x="200" y="320" textAnchor="middle" className="fill-fg font-semibold" style={{ fontSize: 210, letterSpacing: '-0.04em' }}>
        Aa
      </text>
      <rect x="70" y="360" width="260" height="10" rx="5" className="fill-accent" />
    </svg>
  )
}
