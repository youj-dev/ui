'use client'

import { differenceInCalendarDays } from 'date-fns'
import { DownloadIcon } from '@youj/icons'
import { Button } from '@youj/react'
import { ExportDialog, type ExportRequest } from '@youj/react/date'

const COLUMNS = [
  { id: 'id', label: 'Payment ID' },
  { id: 'created', label: 'Created' },
  { id: 'customer', label: 'Customer' },
  { id: 'email', label: 'Email' },
  { id: 'description', label: 'Description' },
  { id: 'amount', label: 'Amount' },
  { id: 'fee', label: 'Fee' },
  { id: 'net', label: 'Net' },
  { id: 'currency', label: 'Currency' },
  { id: 'status', label: 'Status' },
  { id: 'method', label: 'Payment method' },
  { id: 'refunded', label: 'Refunded' },
]

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// Stands in for a count query on your API: about 59 payments a day, 44 euros each.
async function paymentsSummary({ from, to }: ExportRequest) {
  await wait(450)
  const count = Math.round((differenceInCalendarDays(to, from) + 1) * 58.9)
  return { count, total: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(count * 44.3) }
}

export default function ExportDialogDemo() {
  return (
    <ExportDialog
      title="Export payments"
      trigger={
        <Button variant="outline">
          <DownloadIcon />
          Export
        </Button>
      }
      columns={COLUMNS}
      summary={paymentsSummary}
      countLabel={(count) => `${count.toLocaleString('en-US')} payments`}
      // Stands in for the request that builds the file.
      onExport={() => wait(1200)}
    />
  )
}
