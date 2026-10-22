'use client'

import { PresenceItem, PresenceList } from '@youj/motion'
import { DownloadIcon, RefreshIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { AsyncButton } from '../../../components/ui/async-button'
import { Table, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { cn } from '../../../lib/utils'
import { STATUS_TONE, demo, type BillingCopy, type BillingInvoice } from './data'

/**
 * Every invoice, newest first. Each downloads as a PDF (Button onAction holds
 * the row's button in its pending state while the file is prepared); a failed
 * one offers to retry the charge instead of hiding in the list.
 */
export function InvoicesTable({
  invoices,
  copy,
  money,
  onRetry,
  onDownloadInvoice,
  onDownload,
}: {
  invoices: BillingInvoice[]
  copy: BillingCopy
  money: (value: number) => string
  onRetry: (invoice: BillingInvoice) => Promise<void>
  /** Fetches the PDF; resolve when it's ready. Default: a demo wait. */
  onDownloadInvoice?: (invoice: BillingInvoice) => Promise<unknown> | unknown
  onDownload: (invoice: BillingInvoice) => void
}) {
  const cell = 'border-b border-line py-2.5 [tr:last-child>&]:border-b-0'
  // Date and Period share what the fixed columns leave, and table-fixed keeps every column still as a filter swaps the rows.
  // The table is never narrower than its visible columns need (the fixed ones, plus 6rem for each of those two), so a narrow card scrolls it sideways instead of letting the text run together.
  return (
    <Table className="table-fixed border-separate border-spacing-0 sm:min-w-140 md:min-w-164" aria-label={copy.invoicesLabel}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-32 ps-4">{copy.invoiceColumn}</TableHead>
          <TableHead className="max-sm:hidden">{copy.dateColumn}</TableHead>
          <TableHead className="max-md:hidden">{copy.periodColumn}</TableHead>
          <TableHead className="w-24">{copy.statusColumn}</TableHead>
          <TableHead className="w-24 text-end">{copy.amountColumn}</TableHead>
          <TableHead className="w-36 pe-4 text-end max-sm:w-24">
            <span className="sr-only">{copy.actionsColumn}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <PresenceList as="tbody">
        {invoices.map((invoice) => {
          return (
            <PresenceItem as="tr" key={invoice.id} className="bg-surface">
              <TableCell className={cn(cell, 'ps-4 font-mono text-ui-sm text-fg')}>{invoice.number}</TableCell>
              <TableCell className={cn(cell, 'text-fg-muted max-sm:hidden')}>{invoice.date}</TableCell>
              <TableCell className={cn(cell, 'text-fg-muted max-md:hidden')}>{invoice.period}</TableCell>
              <TableCell className={cell}>
                <Badge variant={STATUS_TONE[invoice.status]}>{copy.status[invoice.status]}</Badge>
              </TableCell>
              <TableCell className={cn(cell, 'text-end text-fg tabular-nums')}>{money(invoice.amount)}</TableCell>
              <TableCell className={cn(cell, 'pe-4')}>
                <div className="flex items-center justify-end gap-1">
                  {invoice.status === 'failed' && (
                    <AsyncButton
                      variant="outline"
                      size="sm"
                      aria-label={copy.retryFor(invoice.number)}
                      pendingLabel={copy.charging}
                      successLabel={copy.paid}
                      errorLabel={copy.declined}
                      onAction={() => onRetry(invoice)}
                      className="max-sm:hidden"
                    >
                      <RefreshIcon size={14} /> {copy.retryCharge}
                    </AsyncButton>
                  )}
                  <AsyncButton
                    variant="ghost"
                    size="icon-sm"
                    aria-label={copy.downloadAs(invoice.number)}
                    pendingLabel={copy.preparing(invoice.number)}
                    onAction={async () => {
                      await (onDownloadInvoice ? onDownloadInvoice(invoice) : demo('Billing: onDownloadInvoice', 900))
                      onDownload(invoice)
                    }}
                  >
                    <DownloadIcon size={16} />
                  </AsyncButton>
                </div>
              </TableCell>
            </PresenceItem>
          )
        })}
      </PresenceList>
    </Table>
  )
}
