import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

/* Story scaffolding only: captions and frames for specimen grids. */

export function Specimen({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="font-mono text-[11px] tracking-wide text-fg-muted">{label}</span>
      {children}
    </div>
  )
}

export function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-xl border border-line bg-surface shadow-sm', className)}>{children}</div>
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="max-w-prose text-ui-sm text-fg-muted">{children}</p>
}
