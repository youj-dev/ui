'use client'

import type { ElementType } from 'react'
import { ArrowRightIcon, MapPinIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import type { CareersCopy, CareersRole } from './data'

/* One open role, as a row that is one link: the title (with New for the last fortnight's) and the search's words
 * marked in it, then where, what kind and the salary band in columns that line up down the list (one line under the
 * title on a phone), and an arrow that nudges forward under the pointer. */

const fold = (text: string) => text.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '')

/** `text` with every term (already folded) marked, matching the way the search does (any case, any accent). */
export function Marked({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return text
  let folded = ''
  const from: number[] = []
  for (let i = 0; i < text.length; i++) {
    const f = fold(text[i]!)
    for (let j = 0; j < f.length; j++) from.push(i)
    folded += f
  }
  const hits: [number, number][] = []
  for (const term of terms)
    for (let at = folded.indexOf(term); at !== -1; at = folded.indexOf(term, at + term.length))
      hits.push([from[at]!, from[at + term.length - 1]! + 1])
  hits.sort((a, b) => a[0] - b[0])
  const parts: React.ReactNode[] = []
  let at = 0
  for (const [start, end] of hits) {
    if (end <= at) continue
    if (start > at) parts.push(text.slice(at, start))
    parts.push(
      <mark key={start} className="rounded-xs bg-accent-line text-fg">
        {text.slice(Math.max(start, at), end)}
      </mark>,
    )
    at = end
  }
  if (at < text.length) parts.push(text.slice(at))
  return parts
}

export { fold }

interface RoleRowProps {
  role: CareersRole
  terms: string[]
  fresh: boolean
  copy: CareersCopy
  Link: ElementType
}

export function RoleRow({ role, terms, fresh, copy, Link }: RoleRowProps) {
  return (
    <Link
      href={role.href}
      onClick={role.onClick}
      className="group/role -mx-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-lg px-3 py-3.5 transition-colors yj-duration-fast ease-standard hover:bg-hover focus-ring md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_auto]"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-ui-lg font-medium text-fg">
          <Marked text={role.title} terms={terms} />
        </span>{' '}
        {fresh && (
          <Badge variant="outline" className="shrink-0">
            {copy.new}
          </Badge>
        )}
      </span>{' '}
      <ArrowRightIcon
        size={16}
        aria-hidden
        className="col-start-2 row-span-2 text-fg-muted transition-transform yj-duration-fast ease-standard group-hover/role:translate-x-0.5 group-hover/role:text-fg rtl:-scale-x-100 rtl:group-hover/role:-translate-x-0.5 md:col-start-5 md:row-span-1"
      />
      <span className="col-start-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-ui text-fg-muted md:contents">
        <span className="flex min-w-0 items-center gap-1.5 md:col-start-2 md:row-start-1">
          <MapPinIcon size={13} aria-hidden className="shrink-0" />
          <span className="truncate">
            <Marked text={role.location} terms={terms} />
          </span>
        </span>{' '}
        {role.type && <span className="md:col-start-3 md:row-start-1">{role.type}</span>}{' '}
        {role.salary && <span className="font-mono text-ui-sm tabular-nums md:col-start-4 md:row-start-1 md:text-end">{role.salary}</span>}
      </span>
    </Link>
  )
}
