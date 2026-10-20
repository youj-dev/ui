import type { Driver, Week } from '../data'
import { Bridge, DriversPending } from './bridge'
import { FigureHead } from './figure-head'
import { RunningTotal } from './running-total'

/** The evidence, side by side: the running total (Fig. 1) and the bridge (Fig. 2), linked, so choosing a driver in one re-draws the other. */
export function Evidence({
  week,
  driver,
  compact,
  lastWeek,
  onSelect,
  onLastWeek,
}: {
  week: Week
  driver: Driver | null
  compact: boolean
  lastWeek: number
  onSelect: (id: string | null) => void
  onLastWeek: () => void
}) {
  const closed = week.offset > 0
  return (
    <section aria-label="What happened" className="grid gap-x-14 gap-y-12 border-t border-line pt-8 pb-12 lg:grid-cols-12">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
        <FigureHead
          number="Fig. 1"
          title={driver ? `What ${driver.short} did to the week` : week.chartTitle}
          note={
            driver
              ? `The dashed line is the week without it; the shaded gap is what it ${driver.amount >= 0 ? 'added' : 'took'}, hour by hour.`
              : 'Running total of revenue this week, against last week (dashed) and the range of the eight weeks before (shaded).'
          }
        />
        <RunningTotal week={week} driver={driver} compact={compact} />
      </div>
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-5">
        <FigureHead number="Fig. 2" title="What moved it" note={closed ? 'Last week’s total to this week’s, one driver at a time, largest first. Select one to see what’s behind it.' : undefined} />
        {closed ? <Bridge week={week} selected={driver?.id ?? null} onSelect={onSelect} /> : <DriversPending lastWeek={lastWeek} onBack={onLastWeek} />}
      </div>
    </section>
  )
}
