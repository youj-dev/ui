'use client'

import { lazy, Suspense } from 'react'
import { Reveal } from '@youj/motion'
import type { StatusScreenStatus } from './data'

/* Each status's miniature is a chunk of its own, fetched when the page shows
 * it: a page with `media={null}` fetches none, and a 503 only the cabinet.
 * The stage keeps its size while the chunk loads, so nothing moves, and the
 * miniature fades in once it's there. */
const ParcelLocker = lazy(() => import('./parcel-locker').then((m) => ({ default: m.ParcelLocker })))
const Firewall = lazy(() => import('./firewall').then((m) => ({ default: m.Firewall })))
const ServerCabinet = lazy(() => import('./server-cabinet').then((m) => ({ default: m.ServerCabinet })))
const Hourglass = lazy(() => import('./hourglass').then((m) => ({ default: m.Hourglass })))

interface StatusArtProps {
  status: StatusScreenStatus
  /** 503: the service is still down. */
  down: boolean
  /** Loading: how far along, 0 to 100. */
  progress?: number
}

/** The status's miniature, playing the page's state. */
export function StatusArt({ status, down, progress }: StatusArtProps) {
  return (
    <Suspense fallback={null}>
      <Reveal inView={false} variant="scale" duration="slow" className="size-full">
        {status === '401' ? (
          <ParcelLocker />
        ) : status === '403' ? (
          <Firewall />
        ) : status === '503' ? (
          <ServerCabinet down={down} />
        ) : (
          <Hourglass progress={progress} />
        )}
      </Reveal>
    </Suspense>
  )
}
