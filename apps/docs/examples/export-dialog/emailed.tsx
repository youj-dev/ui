'use client'

import { differenceInCalendarDays } from 'date-fns'
import { DownloadIcon } from '@youj/icons'
import { Button } from '@youj/react'
import { ExportDialog, type ExportRequest } from '@youj/react/date'

const COLUMNS = [
  { id: 'id', label: 'Payment ID' },
  { id: 'created', label: 'Created' },
  { id: 'customer', label: 'Customer' },
  { id: 'amount', label: 'Amount' },
  { id: 'status', label: 'Status' },
  { id: 'method', label: 'Payment method' },
]

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

async function paymentsSummary({ from, to }: ExportRequest) {
  await wait(450)
  const count = Math.round((differenceInCalendarDays(to, from) + 1) * 58.9)
  return { count, total: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(count * 44.3) }
}

export default function ExportDialogEmailed() {
  return (
    <ExportDialog
      title="Export payments"
      trigger={
        <Button variant="outline">
          <DownloadIcon />
          Export a year
        </Button>
      }
      columns={COLUMNS}
      presets={['last30Days', 'lastMonth', 'yearToDate']}
      defaultValue={{ period: 'yearToDate' }}
      formats={[
        { value: 'csv', label: 'CSV' },
        { value: 'xlsx', label: 'XLSX' },
      ]}
      summary={paymentsSummary}
      countLabel={(count) => `${count.toLocaleString('en-US')} payments`}
      // Too much to build while the dialog waits: answer with `emailed` and the dialog says it will arrive by email.
      onExport={async ({ from, to }) => {
        await wait(900)
        return differenceInCalendarDays(to, from) > 90 ? { emailed: true, email: 'finance@northwind.example' } : undefined
      }}
    />
  )
}
