'use client'

import { HomeIcon, PlaneIcon } from '@youj/icons'
import { Eyebrow } from '../../../components/ui/typography'
import { CodeChip } from './code-chip'
import { localFormat, type ItineraryCopy, type ItineraryLeg, type ItineraryStop } from './data'
import { numberFormat } from '../../../lib/utils'

interface NextLegProps {
  leg?: ItineraryLeg
  stops: ItineraryStop[]
  now: number
  copy: ItineraryCopy
  onCopied: (code: string) => void
}

type Unit = 'day' | 'hour' | 'minute' | 'second'
const units = new Map<string, Intl.NumberFormat>()
const unitParts = (locale: string, unit: Unit, n: number, pad: boolean) => {
  const key = `${locale}|${unit}|${pad}`
  let f = units.get(key)
  if (!f) {
    f = numberFormat(locale, { style: 'unit', unit, unitDisplay: 'narrow', minimumIntegerDigits: pad ? 2 : 1 })
    units.set(key, f)
  }
  return f.formatToParts(n)
}

/* The two halves of the pass are cut where they meet: a notch on each side, as on a paper ticket. */
const NOTCH = 'calc(var(--spacing) * 2.5)'
const cut = (edge: '0' | '100%') =>
  [`0 ${edge}`, `100% ${edge}`]
    .map((at, i) => `radial-gradient(circle at ${at}, transparent ${NOTCH}, black calc(${NOTCH} + 0.5px)) ${i ? 'right' : 'left'} / 51% 100% no-repeat`)
    .join(', ')

/**
 * The next leg as a boarding pass: where from and to in big mono codes,
 * the local times, a route line the plane rides once it's under way, and a
 * countdown to departure (then to arrival). The stub under the perforation
 * holds the leg's code, its place and the booking reference to copy.
 */
export function NextLeg({ leg, stops, now, copy, onCopied }: NextLegProps) {
  if (!leg) {
    return (
      <p data-slot="itinerary-pass" data-state="done" className="flex items-center gap-3 text-ui-lg text-fg">
        <span aria-hidden className="grid size-9 place-items-center rounded-full bg-band text-fg-muted">
          <HomeIcon size={16} />
        </span>
        {copy.finished}
      </p>
    )
  }
  const from = stops.find((s) => s.id === leg.from)
  const to = stops.find((s) => s.id === leg.to)
  const depart = +leg.depart
  const arrive = +leg.arrive
  const flying = now >= depart
  const progress = flying ? Math.min(1, (now - depart) / Math.max(1, arrive - depart)) : 0
  const left = Math.max(0, (flying ? arrive : depart) - now)
  const clock = [
    ...(left >= 86_400_000 ? [unitParts(copy.locale, 'day', Math.floor(left / 86_400_000), false)] : []),
    unitParts(copy.locale, 'hour', Math.floor(left / 3_600_000) % 24, true),
    unitParts(copy.locale, 'minute', Math.floor(left / 60_000) % 60, true),
    unitParts(copy.locale, 'second', Math.floor(left / 1000) % 60, true),
  ]
  const length = arrive - depart
  const duration = [
    ...(length >= 3_600_000 ? [unitParts(copy.locale, 'hour', Math.floor(length / 3_600_000), false)] : []),
    unitParts(copy.locale, 'minute', Math.floor(length / 60_000) % 60, false),
  ]
    .map((parts) => parts.map((p) => p.value).join(''))
    .join(' ')
  const time = localFormat(copy.locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const date = localFormat(copy.locale, { weekday: 'long', day: 'numeric', month: 'long' })
  const fields = [
    { label: copy.legCode, value: leg.code },
    { label: copy.legPlace, value: leg.place },
  ].filter((f) => f.value)

  return (
    <div data-slot="itinerary-pass" data-state={flying ? 'in-flight' : 'scheduled'} className="flex flex-col">
      <div className="flex flex-col gap-6 rounded-t-xl bg-well px-4 pt-4 pb-5 sm:px-5" style={{ mask: cut('100%') }}>
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Eyebrow className="flex items-center gap-1.5">
              {flying && <span aria-hidden className="size-1.5 rounded-full bg-accent" />}
              {flying ? copy.underway : copy.next}
            </Eyebrow>
            <p className="text-ui-lg text-fg">{from ? date.format(depart, from.utcOffset) : null}</p>
          </div>
          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <Eyebrow>{flying ? copy.arrivesIn : copy.departsIn}</Eyebrow>
            <p role="timer" aria-live="off" dir="ltr" className="font-mono text-2xl leading-none font-medium tracking-tight text-fg tabular-nums">
              {clock.map((parts, i) => (
                <span key={i} className={i ? 'ms-2' : undefined}>
                  {parts.map((p, j) =>
                    p.type === 'unit' ? (
                      <span key={j} className="ms-px text-[0.55em] text-fg-muted">
                        {p.value}
                      </span>
                    ) : (
                      p.value
                    ),
                  )}
                </span>
              ))}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 sm:gap-x-5">
          <span className="font-mono text-4xl leading-none font-medium tracking-tight text-fg">{from?.code}</span>
          <div role="img" aria-label={copy.route(from?.name ?? leg.from, to?.name ?? leg.to)} className="relative h-6 [--plane:calc(var(--spacing)*5)]">
            <span aria-hidden className="absolute inset-x-0 top-1/2 border-t border-dashed border-line-strong" />
            <span aria-hidden className="absolute start-0 top-1/2 h-px bg-fg transition-[width] yj-duration-slow ease-standard reduced:transition-none" style={{ width: `${progress * 100}%` }} />
            <span aria-hidden className="absolute start-0 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-fg" />
            <span aria-hidden className="absolute end-0 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-well ring-1 ring-fg" />
            <span
              aria-hidden
              data-slot="itinerary-plane"
              className="absolute top-1/2 grid size-(--plane) -translate-y-1/2 place-items-center bg-well text-fg transition-[inset-inline-start] yj-duration-slow ease-standard reduced:transition-none"
              style={{ insetInlineStart: `calc(var(--spacing) * 3 + (100% - var(--spacing) * 6 - var(--plane)) * ${progress})` }}
            >
              <PlaneIcon size={16} className="rotate-45 rtl:-rotate-135" />
            </span>
          </div>
          <span className="font-mono text-4xl leading-none font-medium tracking-tight text-fg">{to?.code}</span>

          <span className="flex flex-col gap-0.5">
            <span className="font-mono text-ui-lg text-fg tabular-nums">{from ? time.format(depart, from.utcOffset) : null}</span>
            <span className="text-ui-sm text-fg-muted">{from?.name}</span>
          </span>
          <span className="self-start text-center font-mono text-ui-sm text-fg-muted tabular-nums">{duration}</span>
          <span className="flex flex-col items-end gap-0.5 text-end">
            <span className="font-mono text-ui-lg text-fg tabular-nums">{to ? time.format(arrive, to.utcOffset) : null}</span>
            <span className="text-ui-sm text-fg-muted">{to?.name}</span>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 rounded-b-xl border-t border-dashed border-line-strong bg-well px-4 pt-3.5 pb-4 sm:px-5" style={{ mask: cut('0') }}>
        <dl className="flex gap-x-8">
          {fields.map((f) => (
            <div key={f.label} className="flex flex-col gap-1">
              <dt className="text-ui-xs text-fg-muted">{f.label}</dt>
              <dd className="font-mono text-ui text-fg tabular-nums">{f.value}</dd>
            </div>
          ))}
        </dl>
        {leg.reference && (
          <div className="flex items-center gap-2.5">
            <span className="text-ui-xs text-fg-muted">{copy.legReference}</span>
            <CodeChip code={leg.reference} copy={copy} onCopied={onCopied} className="bg-surface" />
          </div>
        )}
      </div>
    </div>
  )
}
