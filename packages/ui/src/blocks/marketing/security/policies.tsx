'use client'

import { useMemo, type ElementType } from 'react'
import { ArrowUpRightIcon, FileTextIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import type { MarketingSecurityCopy, SecurityPolicy } from './data'
import { dateTimeFormat } from '../../../lib/utils'

/* The documents: each row a link with its title, what is in it, when it was
 * last updated and its format. The whole row is the target. */

export function Policies({ policies, locale, copy, Link }: { policies: SecurityPolicy[]; locale: string; copy: MarketingSecurityCopy; Link: ElementType }) {
  const date = useMemo(() => dateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }), [locale])
  return (
    <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface">
      {policies.map((policy) => (
        <li key={policy.id}>
          <Link
            href={policy.href}
            aria-label={copy.open(policy.title, policy.kind)}
            className="group/policy flex items-center gap-4 p-4 transition-colors yj-duration-fast ease-standard first:rounded-t-2xl last:rounded-b-2xl hover:bg-hover focus-ring sm:px-5"
          >
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg bg-band text-fg-muted">
              <FileTextIcon size={18} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-ui font-medium text-fg">{policy.title}</span>
              <span className="text-pretty text-ui-sm text-fg-muted">{policy.description}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1.5 max-sm:hidden">
              <Badge variant="outline">{policy.kind}</Badge>
              <span className="text-ui-xs text-fg-muted">{copy.updated(date.format(policy.updated))}</span>
            </span>
            <ArrowUpRightIcon size={16} aria-hidden className="shrink-0 text-fg-muted transition-transform yj-duration-fast ease-standard group-hover/policy:translate-x-0.5 group-hover/policy:-translate-y-0.5 rtl:-scale-x-100" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
