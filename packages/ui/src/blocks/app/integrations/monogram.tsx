'use client'

import { cn } from '../../../lib/utils'
import { TONE, type App } from './data'

function Monogram({ app, size = 'md' }: { app: App; size?: 'md' | 'lg' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-lg font-semibold tracking-tight',
        size === 'lg' ? 'size-14 text-xl' : 'size-10 text-ui-lg',
        TONE[app.tone],
      )}
    >
      {app.logo ??
        app.name
          .split(' ')
          .map((w) => w[0])
          .join('')}
    </span>
  )
}

export { Monogram }
