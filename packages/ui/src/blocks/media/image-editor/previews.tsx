'use client'

import { m, useTransform } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { cn } from '../../../lib/utils'
import type { ImageEditorCopy, ImageEditorPreview } from './data'
import { clamp, previewView, toFrame, transformOf, type Size } from './geometry'
import { livePlacement, type Live } from './use-live'

/* Every place the image appears, live: the framed image cropped to each
 * shape around the focal point, as far as the frame's edges allow. Each is
 * the same image under the same springs as the stage, not a snapshot, so a
 * drag, a turn or a new crop moves them all at once. An avatar's are
 * circles at the sizes it's shown. */

interface PreviewsProps {
  /** The group's heading, one level under the block's title. */
  Heading: 'h2' | 'h3'
  live: Live
  natural: Size
  /** The image, once it's ready; until then each preview keeps its place, empty. */
  src: string | null
  previews: ImageEditorPreview[]
  round: boolean
  copy: ImageEditorCopy
}

export function Previews({ Heading, live, natural, src, previews, round, copy }: PreviewsProps) {
  return (
    <MotionFeatures>
      <section className="flex flex-col gap-2">
        <Heading className="text-ui-sm font-medium text-fg-muted">{copy.previews}</Heading>
        <ul className="flex flex-wrap items-end gap-x-3 gap-y-3">
          {previews.map((preview) => (
            <Preview key={preview.id} live={live} natural={natural} src={src} preview={preview} round={round} />
          ))}
        </ul>
      </section>
    </MotionFeatures>
  )
}

function Preview({ live, natural, src, preview, round }: Omit<PreviewsProps, 'previews' | 'copy' | 'Heading'> & { preview: ImageEditorPreview }) {
  const height = preview.size ?? 64
  const width = Math.round(height * preview.ratio)
  const transform = useTransform(() => {
    const { p, frame } = livePlacement(live, natural)
    const at = toFrame({ x: live.focalX.get(), y: live.focalY.get() }, natural, p)
    const focal = round ? { x: 0, y: 0 } : { x: clamp(at.x, -frame.width / 2, frame.width / 2), y: clamp(at.y, -frame.height / 2, frame.height / 2) }
    const view = previewView(frame, { width, height }, focal)
    return transformOf(p, view.k, view.offset)
  })
  return (
    <li className="flex flex-col items-start gap-1.5">
      <span aria-hidden className={cn('relative block overflow-hidden bg-well', round ? 'rounded-full' : 'rounded-md')} style={{ width, height }}>
        {src && (
          <m.img
            src={src}
            alt=""
            draggable={false}
            className="absolute top-1/2 left-1/2 max-w-none"
            style={{ width: natural.width, height: natural.height, transform }}
          />
        )}
        <span className="absolute inset-0 rounded-[inherit] border border-line-subtle" />
      </span>
      <span className="text-ui-xs text-fg-muted">{preview.label}</span>
    </li>
  )
}
