'use client'

import { lazy, Suspense, type ReactNode } from 'react'
import { Reveal } from '@youj/motion'
import type { MainframeState } from './mainframe'

/* Each page's miniature is a chunk of its own, fetched when the page shows it:
 * `media={null}` fetches none. The stage keeps its size while the chunk
 * loads, so nothing moves, and the miniature fades in once it's there. */
const Mainframe = lazy(() => import('./mainframe').then((m) => ({ default: m.Mainframe })))
const RepairBench = lazy(() => import('./repair-bench').then((m) => ({ default: m.RepairBench })))
const DroneDock = lazy(() => import('./drone-dock').then((m) => ({ default: m.DroneDock })))

function Arrive({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <Reveal inView={false} variant="scale" duration="slow" className="size-full">
        {children}
      </Reveal>
    </Suspense>
  )
}

export const MainframeArt = ({ state }: { state: MainframeState }) => (
  <Arrive>
    <Mainframe state={state} />
  </Arrive>
)

export const RepairBenchArt = ({ progress, done }: { progress: number | null; done: boolean }) => (
  <Arrive>
    <RepairBench progress={progress} done={done} />
  </Arrive>
)

export const DroneDockArt = ({ live }: { live: boolean }) => (
  <Arrive>
    <DroneDock live={live} />
  </Arrive>
)

/**
 * The page beside its picture: the text on the inline start, the picture on
 * the end from lg up (above the text, smaller, below that). Without a picture
 * (`null`), just the text.
 */
export function Split({ art, children }: { art: ReactNode; children: ReactNode }) {
  if (art === null || art === false) return children
  return (
    <div className="grid w-full max-w-5xl items-center justify-items-center gap-8 lg:grid-cols-2 lg:justify-items-start lg:gap-12">
      <div aria-hidden className="size-60 sm:size-72 lg:order-last lg:size-104 lg:justify-self-center xl:size-120">
        {art}
      </div>
      {children}
    </div>
  )
}

/** Text centred, or from lg up at the inline start beside a picture. */
export const alignment = (rich: boolean) => (rich ? 'items-center text-center lg:items-start lg:text-start' : 'items-center text-center')
