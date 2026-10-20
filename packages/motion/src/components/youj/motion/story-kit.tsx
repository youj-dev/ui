import { useState, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@youj/core/lib/youj/cn'

/* Storybook-only helpers shared by the primitives stories. Not a registry item. */

export function ReplayButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none',
        className,
      )}
    >
      <RotateCcw aria-hidden className="size-3.5" strokeWidth={2} />
      Replay
    </button>
  )
}

/** Remounts its children on Replay so entrance motion can be watched again. */
export function Replayable({
  children,
  className,
  buttonClassName = 'top-3 end-3',
}: {
  children: ReactNode
  className?: string
  buttonClassName?: string
}) {
  const [run, setRun] = useState(0)
  return (
    <div className={cn('relative', className)}>
      <ReplayButton onClick={() => setRun((r) => r + 1)} className={cn('absolute z-10', buttonClassName)} />
      <div key={run}>{children}</div>
    </div>
  )
}

/** Faint square grid, drawn with the line token. */
export function GridBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,var(--color-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-line)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)] opacity-60',
        className,
      )}
    />
  )
}
