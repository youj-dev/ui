import type { CSSProperties } from 'react'

/* A shot's label: one mono line, led by the brand's accent particle, in the
 * bottom-start corner (or wherever `style` puts it), sized to read at 1080p
 * and on a phone (14px on the stage, about 19px in the frame). It rises in
 * and sinks away with `show` (0 → 1). The component's name first, then what
 * moves. */

export function ShotLabel({ name, detail, show, style }: { name: string; detail?: string; show: number; style?: CSSProperties }) {
  if (show <= 0) return null
  return (
    <p
      className="absolute flex items-center gap-3 font-mono leading-none whitespace-nowrap"
      style={{ left: 36, bottom: 34, opacity: show, transform: `translateY(${(1 - show) * 6}px)`, ...style }}
    >
      <span aria-hidden className="size-2 rounded-[1.5px] bg-accent" />
      <span className="text-[14px] tracking-[0.1em] text-fg uppercase">{name}</span>
      {detail && (
        <>
          <span aria-hidden className="h-3.5 w-px bg-line-strong" />
          <span className="text-[13.5px] tracking-[0.02em] text-fg-muted">{detail}</span>
        </>
      )}
    </p>
  )
}
