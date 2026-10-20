/** A promise the director resolves at an exact frame: async work without the wall clock. */
export class Deferred {
  promise: Promise<void>
  resolve!: () => void
  constructor() {
    this.promise = new Promise<void>((resolve) => {
      this.resolve = resolve
    })
  }
}

/** Bars of a trend; the last one (today) in full accent. Deterministic from `seed`. */
export function Sparkline({ seed, bars = 16, className }: { seed: number; bars?: number; className?: string }) {
  return (
    <span aria-hidden className={`flex items-end gap-[3px] ${className ?? ''}`}>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className="flex-1 rounded-[2px]"
          style={{
            height: `${22 + Math.round(72 * Math.abs(Math.sin(i * 0.55 + seed)))}%`,
            background: i === bars - 1 ? 'var(--color-accent)' : 'color-mix(in oklab, var(--color-accent) 28%, transparent)',
          }}
        />
      ))}
    </span>
  )
}
