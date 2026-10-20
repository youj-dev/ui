'use client'

import { useId } from 'react'
import { MoonIcon, SunIcon } from '@youj/icons'
import { cn, dateTimeFormat } from '../../../lib/utils'
import type { MarketingTeamCopy, TeamPerson } from './data'

/* One person: a portrait (their photo, or their initials set large and cropped by the frame's foot, on the band with a
 * soft light), the place they work from and their local time with day or night, and under it their name and role.
 * Their bio rises over the portrait on hover or keyboard focus as a preview; the name is a button that pins it open
 * (a tap on touch), with its links then in the tab order. Reduced motion: the bio appears without travelling. */

const clocks = new Map<string, Intl.DateTimeFormat>()
/** A cached formatter, per locale, zone and kind. */
function clock(locale: string, timeZone: string, hours: boolean) {
  const key = `${locale}|${timeZone}|${hours}`
  let format = clocks.get(key)
  if (!format) {
    format = hours
      ? dateTimeFormat('en', { hour: 'numeric', hourCycle: 'h23', timeZone })
      : dateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone })
    clocks.set(key, format)
  }
  return format
}

const initials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase()
}

interface PersonProps {
  person: TeamPerson
  copy: MarketingTeamCopy
  headingLevel: number
  /** The time now (null until the browser knows it). */
  now: number | null
  locale: string
  /** The bio is pinned open. */
  open: boolean
  onToggle: () => void
}

export function Person({ person, copy, headingLevel, now, locale, open, onToggle }: PersonProps) {
  const id = useId()
  const Name = `h${headingLevel}` as 'h3'
  const zone = person.timeZone
  const time = now !== null && zone ? clock(locale, zone, false).format(now) : null
  const hour = now !== null && zone ? Number(clock(locale, zone, true).format(now)) : 12
  const day = hour >= 7 && hour < 19
  const shown = 'translate-y-0 opacity-100'
  return (
    <article
      aria-labelledby={`${id}-name`}
      className="group/person flex flex-col gap-3"
      onKeyDown={(event) => event.key === 'Escape' && open && onToggle()}
    >
      <div className="@container relative isolate aspect-[4/5] overflow-hidden rounded-xl bg-band bg-radial-[at_28%_22%] from-surface to-band to-70%">
        {person.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- copy-in blocks run in Vite too
          <img src={person.photo} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span
            aria-hidden
            className={cn(
              // As wide as the frame allows: the initials keep their share of the portrait at every width.
              'absolute start-[6cqi] -bottom-[0.16em] select-none text-[clamp(--spacing(14),46cqi,--spacing(36))] leading-none font-semibold tracking-tighter text-fg',
              'transition-[translate,opacity] yj-duration-slow ease-emphasized reduced:transition-none',
              person.bio &&
                'group-hover/person:-translate-y-4 group-hover/person:opacity-25 group-has-[button:focus-visible]/person:-translate-y-4 group-has-[button:focus-visible]/person:opacity-25',
              person.bio && open && '-translate-y-4 opacity-25',
            )}
          >
            {initials(person.name)}
          </span>
        )}
        {(person.location || time) && (
          <p className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 font-mono text-ui-xs text-fg-muted">
            <span className="truncate uppercase">{person.location}</span>
            {time && (
              <span className="flex shrink-0 items-center gap-1 tabular-nums">
                <span className="sr-only">{copy.localTime(time, person.location ?? zone ?? '')}</span>
                <span aria-hidden>{time}</span>
                {day ? <SunIcon size={12} aria-label={copy.day} /> : <MoonIcon size={12} aria-label={copy.night} />}
              </span>
            )}
          </p>
        )}
        {person.bio && (
          <div
            id={`${id}-bio`}
            aria-hidden={!open}
            className={cn(
              'absolute inset-x-2 bottom-2 flex flex-col gap-3 rounded-lg border border-line-subtle bg-overlay p-3.5 text-fg shadow-md',
              'translate-y-3 opacity-0 transition-[translate,opacity] yj-duration-base ease-enter reduced:translate-y-0',
              'group-hover/person:translate-y-0 group-hover/person:opacity-100 group-has-[button:focus-visible]/person:translate-y-0 group-has-[button:focus-visible]/person:opacity-100',
              open && shown,
            )}
          >
            <p className="text-pretty text-ui leading-snug">{person.bio}</p>
            {person.links && person.links.length > 0 && (
              <ul className="flex flex-wrap gap-x-3 gap-y-1 text-ui-sm">
                {person.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      tabIndex={open ? undefined : -1}
                      aria-label={copy.personLink(person.name, link.label)}
                      className="inline-flex items-center gap-1.5 rounded-sm font-medium text-fg-muted underline-offset-4 hover:text-fg hover:underline focus-ring"
                    >
                      {link.icon}
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-0.5">
        <Name id={`${id}-name`} className="text-ui-lg font-semibold">
          {person.bio ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`${id}-bio`}
              onClick={onToggle}
              className="rounded-sm text-start outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {person.name}
            </button>
          ) : (
            person.name
          )}
        </Name>
        <p className="text-ui text-fg-muted">{person.role}</p>
      </div>
    </article>
  )
}
