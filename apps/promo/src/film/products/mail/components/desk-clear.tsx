'use client'

import { Reveal } from '@youj/motion'
import { CheckCheckIcon, ClockIcon } from '@youj/icons'
import { Button } from '@youj/react/components/ui/button'
import { KICKER } from '../styles'
import { back } from '../time'
import type { Folio } from '../use-folio'

/** The inbox, dealt with: what you did this morning, and what comes back when. */
export function DeskClear({ folio }: { folio: Folio }) {
  const { tally, handled, now } = folio
  const aside = folio.letters.filter((m) => m.stack === 'later').sort((a, b) => a.until! - b.until!)
  const parts = [tally.done && `${tally.done} done`, tally.replied && `${tally.replied} answered`, tally.later && `${tally.later} set aside`, tally.deleted && `${tally.deleted} deleted`].filter(Boolean)
  return (
    <Reveal key="clear" inView={false} variant="rise" distance={12} duration="slow" className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 pt-[12vh] pb-16 text-center">
      <CheckCheckIcon size={28} trigger="mount" className="text-success" />
      <h2 className="text-[2.5rem] leading-none font-semibold tracking-tight text-fg italic">The desk is clear.</h2>
      <p className="text-lg leading-relaxed text-pretty text-fg-muted">
        {handled ? `You dealt with ${handled} ${handled === 1 ? 'letter' : 'letters'}: ${parts.join(', ')}.` : 'Nothing is waiting for you.'}
      </p>
      {aside.length > 0 && (
        <div className="mt-2 flex w-full flex-col gap-2 text-start">
          <p className={KICKER}>Coming back</p>
          <ul className="flex flex-col border-y border-line">
            {aside.map((m) => (
              <li key={m.id} className="flex items-baseline gap-4 border-b border-line py-2.5 last:border-b-0">
                <span className="min-w-0 flex-1 truncate text-ui-lg text-fg">{m.subject}</span>
                <span className="shrink-0 text-ui text-fg-muted">{back(m.until!, now)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Button variant="outline" size="sm" onClick={() => folio.pick('later')}>
        <ClockIcon size={14} /> See what’s set aside
      </Button>
    </Reveal>
  )
}
