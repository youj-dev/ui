'use client'

import type { ReactNode } from 'react'
import { cn } from '../../../lib/utils'

/** Slides in from the bottom edge while `show`; inert and out of the way while hidden. */
export function Rising({ show, className, children, label }: { show: boolean; className?: string; children: ReactNode; label: string }) {
  return (
    <div
      role="region"
      aria-label={label}
      inert={!show}
      className={cn(
        'transition-[translate,opacity] yj-duration-base ease-emphasized',
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
