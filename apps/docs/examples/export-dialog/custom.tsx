'use client'

import { useState } from 'react'
import { differenceInCalendarDays, startOfDay, subDays } from 'date-fns'
import { DownloadIcon } from '@youj/icons'
import { Button } from '@youj/react'
import { ExportDialog, type ExportDialogValue, type ExportRequest } from '@youj/react/date'

const COLUMNS = [
  { id: 'id', label: 'Payment ID' },
  { id: 'created', label: 'Created' },
  { id: 'customer', label: 'Customer' },
  { id: 'amount', label: 'Amount' },
  { id: 'status', label: 'Status' },
]

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

async function paymentsSummary({ from, to }: ExportRequest) {
  await wait(450)
  const count = Math.round((differenceInCalendarDays(to, from) + 1) * 58.9)
  return { count, total: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(count * 44.3) }
}

export default function ExportDialogCustom() {
  const today = startOfDay(new Date())
  // The app owns the choice, so the dialog opens on the range it was left on.
  const [value, setValue] = useState<ExportDialogValue>({
    period: 'custom',
    customRange: { from: subDays(today, 20), to: subDays(today, 6) },
    format: 'csv',
    timeZone: 'local',
    columns: COLUMNS.map((column) => column.id),
  })
  return (
    <ExportDialog
      title="Export payments"
      trigger={
        <Button variant="outline">
          <DownloadIcon />
          Export a custom range
        </Button>
      }
      columns={COLUMNS}
      value={value}
      onValueChange={setValue}
      summary={paymentsSummary}
      countLabel={(count) => `${count.toLocaleString('en-US')} payments`}
      onExport={() => wait(1200)}
    />
  )
}
