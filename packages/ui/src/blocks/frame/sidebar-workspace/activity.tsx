'use client'

import { m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { Kbd } from '../../../components/ui/kbd'
import { cn } from '../../../lib/utils'
import type { FrameNavItem } from '../shell'
import type { FrameNavListOptions } from '../shell/nav-list'
import type { FramePageActivity, FramePulseCopy } from './pulse-data'

/* A page's live state in Workspace's rows, after its name: the faces of who's
 * there now, a beating dot where something is running, a dot for news you
 * haven't seen, and, while G waits for a key, the page's go-to key. Each is
 * read after the name; the marks themselves are hidden from assistive tech. */

/** A dot that beats: something is running here. Still under reduced motion. */
function Beat() {
  const k = useYouj()
  return (
    <span aria-hidden className="relative grid size-1.5 shrink-0 place-items-center">
      {!k.reduced && (
        <MotionFeatures>
          <m.span
            className="absolute inset-0 rounded-full bg-success"
            animate={{ scale: [1, 2.6], opacity: [0.55, 0] }}
            transition={{ duration: k.duration('deliberate') * 2, ease: k.ease('exit'), repeat: Infinity }}
          />
        </MotionFeatures>
      )}
      <span className="size-1.5 rounded-full bg-success" />
    </span>
  )
}

const initial = (name: string) => name.trim()[0]?.toUpperCase() ?? '?'

/** Who's on the page: up to two faces, overlapping, then how many more. */
function Faces({ people }: { people: NonNullable<FramePageActivity['people']> }) {
  return (
    <span className="flex items-center">
      {people.slice(0, 2).map((p, i) => (
        <span
          key={p.id}
          className={cn(
            'grid size-4.5 place-items-center rounded-full bg-band text-[length:--spacing(2.25)] leading-none font-semibold text-fg-muted ring-2 ring-chrome',
            i > 0 && '-ms-1.5',
          )}
        >
          {initial(p.name)}
        </span>
      ))}
      {people.length > 2 && <span className="ps-1 text-[length:--spacing(2.5)] text-fg-subtle tabular-nums">+{people.length - 2}</span>}
    </span>
  )
}

/** The list's options for live state and go-to keys. */
export function liveOptions({
  activity,
  copy,
  keys,
  armed,
}: {
  activity?: Record<string, FramePageActivity>
  copy: FramePulseCopy
  keys: Map<string, string>
  armed: boolean
}): Pick<FrameNavListOptions, 'extra' | 'said' | 'shortcut'> {
  return {
    shortcut: (item: FrameNavItem) => {
      const key = keys.get(item.id)
      return key ? `G ${key.toUpperCase()}` : undefined
    },
    extra: (item: FrameNavItem) => {
      const a = activity?.[item.id]
      const key = armed ? keys.get(item.id) : undefined
      if (!a && !key) return null
      return (
        <>
          {a?.people?.length ? <Faces people={a.people} /> : null}
          {a?.live && <Beat />}
          {a?.unread && <span className="size-1.5 shrink-0 rounded-full bg-accent" />}
          {key && <Kbd className="uppercase">{key}</Kbd>}
        </>
      )
    },
    said: (item: FrameNavItem) => {
      const a = activity?.[item.id]
      if (!a) return undefined
      const parts = [a.unread && copy.unread, a.live && copy.live, a.people?.length && copy.people(a.people.map((p) => p.name))]
      return parts.filter(Boolean).join(', ') || undefined
    },
  }
}
