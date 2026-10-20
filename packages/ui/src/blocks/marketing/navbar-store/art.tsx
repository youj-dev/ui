/* The store's pictures, drawn in the theme's roles so they hold in every
 * preset and mode: collection covers and product thumbnails. Decorative; swap
 * them for your photography through each item's `media`. */

const frame = 'size-full bg-well'

/** A low sun over the horizon: a new season. */
export function SunArt() {
  return (
    <svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" aria-hidden className={frame}>
      <circle cx="160" cy="150" r="62" className="fill-accent" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x="0" y={150 + i * 18} width="320" height={9 - i} className="fill-well" />
      ))}
      <rect x="0" y="196" width="320" height="44" className="fill-surface" />
    </svg>
  )
}

/** A loose weave: linen, cotton, wool. */
export function WeaveArt() {
  return (
    <svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" aria-hidden className={frame}>
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={`w${i}`} x="0" y={10 + i * 20} width="320" height="8" rx="4" className="fill-line-strong" />
      ))}
      {Array.from({ length: 16 }, (_, i) => {
        const lit = i % 3 === 1
        return <rect key={`h${i}`} x={10 + i * 20} y="0" width="8" height="240" rx="4" className={lit ? 'fill-accent' : 'fill-surface'} opacity={0.9} />
      })}
    </svg>
  )
}

/** Three vessels on a shelf: ceramics, the table. */
export function VesselsArt() {
  return (
    <svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" aria-hidden className={frame}>
      <rect x="40" y="186" width="240" height="6" rx="3" className="fill-line-strong" />
      <path d="M78 186 C70 150 70 120 92 104 L92 84 L108 84 L108 104 C130 120 130 150 122 186 Z" className="fill-fg" />
      <path d="M146 186 C140 160 142 136 160 128 C178 136 180 160 174 186 Z" className="fill-accent" />
      <rect x="196" y="140" width="52" height="46" rx="10" className="fill-surface stroke-line-strong" strokeWidth="2" />
      <path d="M248 152 C262 152 262 174 248 174" fill="none" strokeWidth="5" className="stroke-line-strong" />
    </svg>
  )
}

/** A wrapped box: gifts. */
export function GiftArt() {
  return (
    <svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" aria-hidden className={frame}>
      <rect x="104" y="104" width="112" height="92" rx="8" className="fill-surface stroke-line-strong" strokeWidth="2" />
      <rect x="96" y="86" width="128" height="26" rx="6" className="fill-fg" />
      <rect x="152" y="86" width="16" height="110" className="fill-accent" />
      <path d="M160 86 C140 58 116 70 132 86 M160 86 C180 58 204 70 188 86" fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-accent" />
    </svg>
  )
}
