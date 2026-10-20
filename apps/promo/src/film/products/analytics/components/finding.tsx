'use client'

import type { RefObject } from 'react'
import { Reveal } from '@youj/motion'
import { CornerDownLeftIcon } from '@youj/icons'
import { Button } from '@youj/react/components/ui/button'
import { Kbd } from '@youj/react/components/ui/kbd'
import { Eyebrow } from '@youj/react/components/ui/typography'
import { cn } from '@youj/react/lib/utils'
import type { Driver, Week } from '../data'
import { change, driverInk, KICKER, signed, span, usd } from '../format'
import { FigureLedger } from './figure-ledger'
import { Num } from './num'

/* The memo's opening: a kicker (or, turned to a driver, a breadcrumb back to
 * the memo), the finding at display size, the standfirst with its amounts in
 * the ink of the text, and beside them the week in figures. The finding
 * rises in whenever the week or the driver changes. */

/** Dollar amounts in running prose, set in the ink of the text and in tabular figures. */
function Prose({ children }: { children: string }) {
  return children.split(/(\$[\d,]+(?:\.\d+)?)/).map((part, i) =>
    i % 2 ? (
      <span key={i} className="font-semibold text-fg tabular-nums">
        {part}
      </span>
    ) : (
      part
    ),
  )
}

export function Finding({ week, driver, headline, onBack }: { week: Week; driver: Driver | null; headline: RefObject<HTMLHeadingElement | null>; onBack: () => void }) {
  const closed = week.offset > 0
  const pace = change(week.revenue)
  const standfirst = driver
    ? driver.standfirst
    : closed
      ? week.standfirst
      : `The Ledger writes its memo when the week closes, on Monday at 7 a.m. So far Meadow has taken ${usd.format(week.revenue.value)}, ${
          Math.abs(pace) < 0.01 ? 'level with' : `${Math.round(Math.abs(pace) * 100)}% ${pace > 0 ? 'ahead of' : 'behind'}`
        } the same point last week.`

  return (
    <section className="grid gap-x-14 gap-y-8 pt-8 pb-10 md:pt-10 lg:grid-cols-12">
      <div className="flex flex-col gap-5 lg:col-span-8">
        <Eyebrow render={<p />} className={cn(KICKER, 'flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1')}>
          {driver ? (
            <>
              <button
                type="button"
                onClick={onBack}
                className="rounded-xs tracking-[0.14em] uppercase underline decoration-fg-subtle decoration-dotted underline-offset-4 transition-colors yj-duration-fast ease-standard focus-ring hover:text-fg"
              >
                Week {week.number}
              </button>
              <span aria-hidden>›</span>
              <span className="text-fg">{driver.kind}</span>
              <span aria-hidden>·</span>
              <span className={driverInk(driver)}>{signed(driver.amount)}</span>
            </>
          ) : (
            <>
              {closed ? 'Weekly revenue memo' : 'This week, so far'} · Week {week.number} · {span(week)}
            </>
          )}
        </Eyebrow>
        <Reveal key={`${week.offset}-${driver?.id ?? 'memo'}`} as="div" inView={false} variant="rise" distance={10} duration="slow" className="flex flex-col gap-5">
          <h1
            ref={headline}
            id="ledger-headline"
            tabIndex={-1}
            className="max-w-[22ch] text-[2.125rem] leading-[1.08] font-semibold tracking-tight text-balance text-fg outline-none md:text-5xl md:leading-[1.04]"
          >
            {driver ? driver.headline : week.headline}
          </h1>
          <p className="max-w-[62ch] text-lg leading-[1.6] text-pretty text-fg-muted md:text-xl md:leading-[1.55]">
            <Prose>{standfirst}</Prose>
          </p>
        </Reveal>
        {driver && (
          <p className="flex items-center gap-2 text-ui text-fg-muted">
            <Button variant="ghost" size="xs" className="-ms-2" onClick={onBack}>
              <CornerDownLeftIcon size={13} className="rtl:-scale-x-100" /> Back to the memo
            </Button>
            <Kbd>Esc</Kbd>
          </p>
        )}
      </div>
      <aside aria-label="The week in figures" className="flex flex-col gap-2 lg:col-span-4 lg:pt-7">
        <Eyebrow render={<p />} className={KICKER}>{closed ? 'The week in figures' : 'So far this week'}</Eyebrow>
        {closed ? (
          <FigureLedger week={week} />
        ) : (
          <div className="flex flex-col gap-1 border-y border-line py-4">
            <span className="text-4xl leading-none font-semibold tracking-tight text-fg">
              <Num value={week.revenue.value} />
            </span>
            <span className="text-ui-lg text-fg-muted">against {usd.format(week.revenue.previous)} at this point last week</span>
          </div>
        )}
      </aside>
    </section>
  )
}
