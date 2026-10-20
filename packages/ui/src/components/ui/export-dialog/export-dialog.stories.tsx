import type { Meta, StoryObj } from '@storybook/react-vite'
import { differenceInCalendarDays } from 'date-fns'
import { DownloadIcon } from '@youj/icons/components/youj/icons/download'
import { Button } from '../button'
import { ExportDialog, type ExportRequest } from './export-dialog'

const meta: Meta<typeof ExportDialog> = {
  title: 'UI/Overlays/Export Dialog',
  component: ExportDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Choose what leaves and in which shape, then export it. A summary says what the choice holds and updates as the range changes; the date ranges are one soft list that shows the days each stands for; Custom opens the Date Range Picker underneath and the dialog grows to fit. Format, time zone and columns sit under Options. Export is an Async Button (working, done, failed), or says the file will arrive by email. Focus starts on the chosen range; the summary is a polite status region.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ExportDialog>

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

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

/** Stands in for a count query: about 59 payments a day, 44 euros each. */
async function paymentsSummary({ from, to }: ExportRequest) {
  await wait(450)
  const count = Math.round((differenceInCalendarDays(to, from) + 1) * 58.9)
  return { count, total: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(count * 44.3) }
}

const countLabel = (count: number) => `${count.toLocaleString('en-US')} payments`

const trigger = (
  <Button variant="outline">
    <DownloadIcon />
    Export
  </Button>
)

/** A payments export: the summary follows the range, and a short one finishes in place. */
export const PaymentsExport: Story = {
  render: (args) => (
    <ExportDialog
      {...args}
      trigger={trigger}
      title="Export payments"
      columns={COLUMNS}
      summary={paymentsSummary}
      countLabel={countLabel}
      onExport={() => wait(1200)}
    />
  ),
}

/** A year of payments is too big to wait for: the export resolves as emailed and the dialog says so. */
export const LargeExportEmailed: Story = {
  name: 'Large export, emailed',
  render: (args) => (
    <ExportDialog
      {...args}
      trigger={trigger}
      title="Export payments"
      columns={COLUMNS}
      defaultValue={{ period: 'lastMonth' }}
      presets={['last30Days', 'lastMonth', 'yearToDate']}
      summary={paymentsSummary}
      countLabel={countLabel}
      formats={[
        { value: 'csv', label: 'CSV' },
        { value: 'xlsx', label: 'XLSX' },
      ]}
      onExport={async () => {
        await wait(900)
        return { emailed: true, email: 'finance@northwind.example' }
      }}
    />
  ),
}

/** Custom reveals the Date Range Picker under its row. The dialog grows rather than scrolling. */
export const CustomRange: Story = {
  render: (args) => (
    <ExportDialog
      {...args}
      trigger={trigger}
      title="Export payments"
      columns={COLUMNS}
      defaultValue={{ period: 'custom' }}
      summary={paymentsSummary}
      countLabel={countLabel}
      onExport={() => wait(1200)}
    />
  ),
}

/** The export can fail, and can be tried again. */
export const Failure: Story = {
  render: (args) => (
    <ExportDialog
      {...args}
      trigger={trigger}
      title="Export payments"
      columns={COLUMNS}
      summary={paymentsSummary}
      countLabel={countLabel}
      onExport={async () => {
        await wait(900)
        throw new Error('The payments service did not answer. Try again in a minute.')
      }}
    />
  ),
}
