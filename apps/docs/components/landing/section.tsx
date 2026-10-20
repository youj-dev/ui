import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * A landing section on the construction frame: a rule with registration
 * marks, a display heading and a lede. No label or number over the heading:
 * the heading says it, and the frame's rules and spacing keep the rhythm.
 */
export function Section({
  id,
  title,
  lede,
  action,
  children,
  className,
}: {
  id: string
  title: ReactNode
  lede?: ReactNode
  /** Beside the heading on wide screens, e.g. a control. */
  action?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn('frame-section', className)}>
      <div className="gutter py-20 md:py-28">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[40rem]">
            <h2 id={`${id}-title`} className="type-display-l text-fg">
              {title}
            </h2>
            {lede && <p className="type-lede mt-5">{lede}</p>}
          </div>
          {action}
        </div>
        {children}
      </div>
    </section>
  )
}
