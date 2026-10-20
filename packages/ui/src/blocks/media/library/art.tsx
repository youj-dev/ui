import { cn } from '../../../lib/utils'
import type { MediaLibraryKind } from './data'

/* A tile for a file that has no picture of its own, drawn in the theme's
 * neutral roles so it sits quietly in any preset beside real pictures: a
 * film's frame (a low sun over hills), a sound's waveform, a document's first page.
 * Seeded by the file's name, so the same file always draws the same. */

const seed = (name: string) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

export function Art({ kind, name, className }: { kind: MediaLibraryKind; name: string; className?: string }) {
  const s = seed(name)
  if (kind === 'audio') {
    const bars = Array.from({ length: 24 }, (_, i) => Math.max(4, 12 + ((s >>> (i % 16)) % 7) * 5 + Math.round(Math.sin(i * 0.7 + s) * 6)))
    return (
      <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className={cn('bg-band', className)}>
        {bars.map((h, i) => (
          <rect key={i} x={7 + i * 3.6} y={50 - h / 2} width="2" height={h} rx="1" className="fill-fg-subtle" />
        ))}
      </svg>
    )
  }
  if (kind === 'document') {
    return (
      <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className={cn('bg-band', className)}>
        <rect x="24" y="14" width="52" height="72" rx="3" className="fill-surface stroke-line" strokeWidth="1" />
        <rect x="31" y="23" width="26" height="4" rx="2" className="fill-fg-muted" />
        {[33, 39, 45, 51, 57].map((y, i) => (
          <rect key={y} x="31" y={y} width={i === 4 ? 22 : 38} height="2.4" rx="1.2" className="fill-line-strong" />
        ))}
        <rect x="31" y="66" width="18" height="9" rx="2" className="fill-fg-subtle" />
      </svg>
    )
  }
  // A film's frame: dusk, a sun low between two hills.
  const sun = 36 + (s % 30)
  return (
    <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className={cn('bg-band', className)}>
      <rect width="100" height="100" className="fill-well" />
      <circle cx={sun} cy="58" r="13" className="fill-fg-muted" />
      <path d="M0 70 Q 22 52 44 66 T 100 60 V100 H0 Z" className="fill-line-strong" />
      <path d="M0 82 Q 30 66 58 80 T 100 76 V100 H0 Z" className="fill-fg-subtle" />
    </svg>
  )
}
