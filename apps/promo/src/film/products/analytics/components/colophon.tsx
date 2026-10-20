import type { ReactNode } from 'react'
import { Kbd } from '@youj/react/components/ui/kbd'
import type { Week } from '../data'

const DAY = 86_400_000
const longDay = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

function Hint({ keys, label }: { keys: ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-1.5 whitespace-nowrap">
      {keys}
      <span>{label}</span>
    </li>
  )
}

/** The memo's foot: where the numbers come from, when it was written, and the keys. */
export function Colophon({ week }: { week: Week }) {
  return (
    <footer className="mt-14 flex flex-col gap-4 border-t border-line pt-6 text-ui text-fg-muted md:flex-row md:items-start md:justify-between">
      <p className="max-w-[64ch] text-pretty">
        Revenue is orders net of refunds, from the Stall shop and Tillpoint payments, in local time. The typical range is the lowest and highest running total at each hour over the eight
        weeks before. {week.offset > 0 && <span className="italic">Written by The Ledger at 7 a.m. on {longDay.format(week.start + 7 * DAY)}.</span>}
      </p>
      <ul aria-label="Keyboard shortcuts" className="flex shrink-0 flex-wrap gap-x-4 gap-y-2 max-md:hidden">
        <Hint
          keys={
            <>
              <Kbd>[</Kbd>
              <Kbd>]</Kbd>
            </>
          }
          label="Weeks"
        />
        <Hint
          keys={
            <>
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
            </>
          }
          label="Drivers"
        />
        <Hint keys={<Kbd>Esc</Kbd>} label="Back to the memo" />
      </ul>
    </footer>
  )
}
