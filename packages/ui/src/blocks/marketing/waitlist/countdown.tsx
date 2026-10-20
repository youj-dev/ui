'use client'

import { useRef, useState } from 'react'
import { Countdown as KitCountdown } from '../../../components/ui/countdown'
import { useVisible } from '../../../hooks/use-visible'
import type { WaitlistCopy } from './data'

const DAY = 86_400_000

interface CountdownProps {
  /** The launch moment. Default: 23 days and some hours after the page opens. */
  launchAt?: Date | number
  copy: WaitlistCopy
  locale?: string
}

export function Countdown({ launchAt, copy, locale }: CountdownProps) {
  // The default target is read once; the kit Countdown draws held zeros until it has hydrated, so the server and browser agree on the first frame.
  const [opened] = useState(() => Date.now() + 23 * DAY + 7.4 * 3_600_000)
  const end = launchAt === undefined ? opened : +launchAt
  const root = useRef<HTMLDivElement>(null)
  const visible = useVisible(root)
  return (
    <div ref={root} className="flex w-full max-w-md justify-center">
      <KitCountdown
        to={end}
        locale={locale}
        paused={!visible}
        aria-label={copy.timerLabel}
        labels={{ days: copy.days, hours: copy.hours, minutes: copy.minutes, seconds: copy.seconds }}
        className="text-3xl sm:text-4xl"
      />
    </div>
  )
}
