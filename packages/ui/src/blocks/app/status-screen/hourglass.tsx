'use client'

import { MiniatureHourglass } from '@youj/miniatures/hourglass'

/** The loading page's hourglass: the sand follows `progress` (0 to 100) and turns over on its own while it's unknown; at 100 it pours its last and glows. */
export function Hourglass({ progress }: { progress?: number }) {
  const known = progress !== undefined
  return (
    <MiniatureHourglass
      interactive={false}
      size="100%"
      progress={known ? Math.min(1, Math.max(0, progress / 100)) : undefined}
      done={known && progress >= 100}
    />
  )
}
