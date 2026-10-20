'use client'

import { Button } from '@youj/react'
import { PlusIcon, RocketIcon } from '@youj/icons'

const TEXT = [
  { size: 'xs', height: '24' },
  { size: 'sm', height: '28' },
  { size: 'default', height: '32' },
  { size: 'lg', height: '40' },
] as const

const ICON = [
  { size: 'icon-xs', height: '24' },
  { size: 'icon-sm', height: '28' },
  { size: 'icon', height: '32' },
  { size: 'icon-lg', height: '40' },
] as const

export default function ButtonSizes() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-wrap items-end justify-center gap-x-5 gap-y-4">
        {TEXT.map(({ size, height }) => (
          <figure key={size} className="flex flex-col items-center gap-2">
            <Button size={size}>
              <RocketIcon />
              Deploy
            </Button>
            <figcaption className="font-mono text-ui-xs text-fg-muted">
              {size} · {height}px
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="flex flex-wrap items-end justify-center gap-x-5 gap-y-4">
        {ICON.map(({ size, height }) => (
          <figure key={size} className="flex flex-col items-center gap-2">
            {/* Icon-only buttons are named by aria-label. */}
            <Button size={size} variant="outline" aria-label="New project">
              <PlusIcon />
            </Button>
            <figcaption className="font-mono text-ui-xs text-fg-muted">
              {size} · {height}px
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
