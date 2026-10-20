'use client'

import { useEffect, useState, type ComponentType } from 'react'
import { Countdown } from '@youj/react/components/ui/countdown'
import { PHRASES } from './stealth-phrases'
import type { StealthStageProps } from './stealth-stage'
import { afterFirstPaint } from './stealth-idle'

/* The tree's box: as tall as the screen allows (560px at most) and no taller than 82% of the screen's width, so the crown
 * (a little wider than tall) fits a phone. Reserved before the tree loads, so nothing shifts. */
// Its ::before is the pool of accent light the root stands in.
const BOX =
  "relative h-[clamp(220px,min(calc(100svh-16rem),82vw),560px)] w-full before:absolute before:start-1/2 before:w-[clamp(220px,min(calc(100svh-16rem),82vw),560px)] before:-translate-x-1/2 before:rtl:translate-x-1/2 before:top-[74%] before:-bottom-[18%] before:-z-10 before:bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-accent)_15%,transparent),transparent)] before:content-['']"

/**
 * The middle of the stealth intro. First paint has the tree's empty box, the
 * first phrase and the countdown; Banyan and the phrases' rotation (a chunk
 * of their own, stealth-stage.tsx) arrive once the page is idle.
 */
export function StealthIntro() {
  const [Stage, setStage] = useState<ComponentType<StealthStageProps> | null>(null)
  // The launch moment lives on the Worker (LAUNCH_AT, set in Cloudflare), so it moves without a deploy. No date, no countdown.
  const [launchAt, setLaunchAt] = useState<string | null>(null)
  useEffect(() => {
    fetch('/launch.json', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { launchAt?: string | null } | null) => setLaunchAt(data?.launchAt ?? null))
      .catch(() => setLaunchAt(null))
  }, [])
  useEffect(() => afterFirstPaint(() => void import('./stealth-stage').then((m) => setStage(() => m.StealthStage))), [])

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-5 pb-10 sm:gap-6">
      {Stage ? (
        <Stage boxClassName={BOX} />
      ) : (
        <div className="flex w-full flex-col items-center gap-6">
          <div className={BOX} />
          <Phrase>{PHRASES[0]!}</Phrase>
        </div>
      )}
      {launchAt && (<Countdown
        to={launchAt}
        className="gap-3 font-mono text-sm font-normal tracking-normal text-fg-muted sm:gap-4 sm:text-sm [&_[data-slot=countdown-unit]]:gap-1 [&_[data-slot=countdown-unit]>span:first-child]:border-0 [&_[data-slot=countdown-unit]>span:first-child]:bg-transparent [&_[data-slot=countdown-unit]>span:first-child]:p-0 [&_[data-slot=countdown-unit]>span:first-child]:text-fg-muted [&_[data-slot=countdown-unit]>span:first-child]:shadow-none [&_[data-slot=countdown-unit]>span:last-child]:text-[10px] [&_[data-slot=countdown-unit]>span:last-child]:text-fg-subtle"
      />)}
    </div>
  )
}

/** The phrase line's box: one line, fixed height, so turning phrases never move the countdown. */
export function Phrase({ children }: { children: React.ReactNode }) {
  return (
    <p aria-hidden className="h-6 font-mono text-sm leading-6 whitespace-nowrap text-fg sm:text-base">
      {children}
    </p>
  )
}
