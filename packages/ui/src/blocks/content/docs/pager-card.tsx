'use client'

import { ArrowLeftIcon, ArrowRightIcon } from '@youj/icons'
import { cn } from '../../../lib/utils'
import type { Page } from './data'
import { DocLink } from './doc-link'

export function PagerCard({ page, direction, label, onNavigate }: { page: Page; direction: 'prev' | 'next'; label: string; onNavigate: (id: string) => void }) {
  const next = direction === 'next'
  return (
    <DocLink
      page={page}
      onNavigate={onNavigate}
      className={cn(
        'focus-ring group flex flex-col gap-1 rounded-lg border border-line p-4 transition-colors yj-duration-fast ease-standard hover:border-accent-line hover:bg-accent-subtle',
        next && 'col-start-2 items-end text-end',
      )}
    >
      <span className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
        {!next && <ArrowLeftIcon size={13} className="transition-transform yj-duration-fast ease-standard group-hover:-translate-x-0.5 rtl:-scale-x-100" />}
        {label}
        {next && <ArrowRightIcon size={13} className="transition-transform yj-duration-fast ease-standard group-hover:translate-x-0.5 rtl:-scale-x-100" />}
      </span>
      <span className="font-medium text-fg">{page.title}</span>
    </DocLink>
  )
}
