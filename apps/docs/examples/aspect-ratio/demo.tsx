'use client'

import { MusicIcon, PlayIcon } from '@youj/icons'
import { AspectRatio, Skeleton } from '@youj/react'

export default function AspectRatioDemo() {
  return (
    <div className="grid w-full max-w-2xl grid-cols-[2fr_1fr_1fr] items-start gap-4">
      <figure className="flex flex-col gap-2">
        <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg border border-line">
          <div className="grid size-full place-items-center bg-linear-to-br from-accent/30 via-band to-canvas">
            <span className="grid size-12 place-items-center rounded-full bg-canvas text-fg shadow-md">
              <PlayIcon size={20} />
            </span>
          </div>
        </AspectRatio>
        <figcaption className="text-ui-sm text-fg-muted">16 / 9 · Video</figcaption>
      </figure>
      <figure className="flex flex-col gap-2">
        <AspectRatio ratio={1} className="overflow-hidden rounded-lg border border-line">
          <div className="grid size-full place-items-center bg-linear-to-tr from-fg/15 to-band text-fg-muted">
            <MusicIcon size={24} />
          </div>
        </AspectRatio>
        <figcaption className="text-ui-sm text-fg-muted">1 · Cover</figcaption>
      </figure>
      <figure className="flex flex-col gap-2">
        {/* The box holds its shape before anything loads, so nothing below it moves. */}
        <AspectRatio ratio={4 / 5} className="overflow-hidden rounded-lg">
          <Skeleton className="size-full rounded-none" />
        </AspectRatio>
        <figcaption className="text-ui-sm text-fg-muted">4 / 5 · Loading</figcaption>
      </figure>
    </div>
  )
}
