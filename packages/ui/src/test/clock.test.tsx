import type { ReactElement } from 'react'
import { renderToString } from 'react-dom/server'
import { Calendar } from '../components/ui/calendar'
import { DatePicker } from '../components/ui/date-picker'
import { DateRangePicker } from '../components/ui/date-range-picker'
import { ExportDialog } from '../components/ui/export-dialog'
import { TimePicker } from '../components/ui/time-picker'
import { useLocale } from '@youj/core'
import { InputOTPResend } from '../components/ui/input-otp'
import { MilestoneRuler } from '../components/ui/milestone-ruler'
import { PropertyAge } from '../components/ui/property-list'
import {
  DataTableColumnFilter,
  DataTableFilterChips,
  DataTableToolbar,
  createDataTableColumnHelper,
  dataTableFilterChips,
  useDataTable,
  type DataTableColumnDef,
} from '../components/ui/data-table'

interface Reading {
  date: string
  aqi: number
}
const col = createDataTableColumnHelper<Reading>()
const readingColumns = col.columns([
  col.accessor('date', { header: 'Date', meta: { filter: { type: 'date-range' } } }),
  col.accessor('aqi', { header: 'AQI', meta: { numeric: true, filter: { type: 'number-range' } } }),
]) as DataTableColumnDef<Reading>[]

/** A data table's toolbar and chips, with a date range already set (a saved view, a shared link). */
function ReadingsToolbar() {
  const locale = useLocale()
  const table = useDataTable({
    data: [{ date: '2026-09-03', aqi: 42 }],
    columns: readingColumns,
    initialState: { columnFilters: [{ id: 'date', value: { from: '2026-09-01', to: '2026-09-07' } }] },
  })
  return (
    <>
      <DataTableToolbar>
        <DataTableColumnFilter column={table.getColumn('date')!} />
        <DataTableColumnFilter column={table.getColumn('aqi')!} />
      </DataTableToolbar>
      <DataTableFilterChips chips={dataTableFilterChips(table, locale)} onClearAll={() => {}} />
    </>
  )
}

/* A prerender (create-next-app's cacheComponents) stops on a Client Component
 * that reads the clock while it renders, so the date components wait for the
 * browser for today. Each renders here on the server with a clock that throws. */

const cases: Record<string, () => ReactElement> = {
  Calendar: () => <Calendar mode="single" />,
  'Calendar range': () => <Calendar mode="range" numberOfMonths={2} />,
  DatePicker: () => <DatePicker />,
  DateRangePicker: () => <DateRangePicker />,
  'DateRangePicker with a value': () => <DateRangePicker defaultValue={{ from: new Date(2026, 8, 3), to: new Date(2026, 8, 6) }} />,
  TimePicker: () => <TimePicker aria-label="Start" />,
  ExportDialog: () => <ExportDialog columns={[{ id: 'amount', label: 'Amount' }]} onExport={() => {}} />,
  'Data table filters with a date range set': () => <ReadingsToolbar />,
  InputOTPResend: () => <InputOTPResend onResend={() => {}} />,
  'MilestoneRuler with no milestones': () => <MilestoneRuler milestones={[]} />,
  PropertyAge: () => <PropertyAge since="2026-01-01" />,
}

const RealDate = Date
class NoClock extends RealDate {
  constructor(...args: [] | [string | number | Date] | [number, number, ...number[]]) {
    if (args.length === 0) throw new Error('new Date() while rendering')
    super(...(args as [number]))
  }
  static override now(): number {
    throw new Error('Date.now() while rendering')
  }
}

afterEach(() => {
  globalThis.Date = RealDate
})

test.each(Object.keys(cases))('%s reads no clock while rendering on the server', (name) => {
  globalThis.Date = NoClock as DateConstructor
  expect(() => renderToString(cases[name]!())).not.toThrow()
})
