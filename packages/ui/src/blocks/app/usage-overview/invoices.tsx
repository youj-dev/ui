'use client'

import type { ReactNode } from 'react'
import { DownloadIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { AsyncButton } from '../../../components/ui/async-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import type { UsageOverviewCopy } from './copy'
import { STATUS_TONE, type UsageInvoice } from './data'
import { numberFormat } from '../../../lib/utils'

interface InvoicesProps {
  copy: UsageOverviewCopy
  locale: string
  currency: string
  invoices: UsageInvoice[]
  onDownload: (invoice: UsageInvoice) => unknown
  loading?: boolean
  /** Replaces the list when there are no invoices. */
  empty?: ReactNode
}

function Invoices({ copy, locale, currency, invoices, onDownload, loading, empty }: InvoicesProps) {
  const money = numberFormat(locale, { style: 'currency', currency })
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.invoices}</CardTitle>
        <CardDescription>{copy.invoicesDescription}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {loading ? (
          <div aria-busy className="flex flex-col gap-2 px-(--card-spacing)">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          (empty ?? <p className="border-t border-line px-(--card-spacing) pt-4 text-ui text-fg-muted">{copy.emptyInvoices}</p>)
        ) : (
          <ul className="flex flex-col">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 border-t border-line px-(--card-spacing) py-2.5">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-fg">{inv.period}</span>
                  <span className="font-mono text-ui-xs text-fg-muted">{inv.id}</span>
                </div>
                <span className="text-ui tabular-nums">{money.format(inv.amount)}</span>
                <Badge variant={STATUS_TONE[inv.status]}>{copy.invoiceStatus[inv.status]}</Badge>
                <AsyncButton variant="ghost" size="icon-sm" aria-label={copy.download(inv.period)} successLabel={copy.downloaded} onAction={() => onDownload(inv)}>
                  <DownloadIcon size={15} />
                </AsyncButton>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export { Invoices }
