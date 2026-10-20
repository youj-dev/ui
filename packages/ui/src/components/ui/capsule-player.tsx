'use client'

import type { ReactNode } from 'react'
import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { PlayIcon } from '@youj/icons/components/youj/icons/play'
import { SkipBackIcon } from '@youj/icons/components/youj/icons/skip-back'
import { SkipForwardIcon } from '@youj/icons/components/youj/icons/skip-forward'
import { capsulePlayerLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { Capsule, type CapsuleProps } from './capsule'
import { formatTimecode } from './waveform-scrubber'

/* What's playing, in one capsule: cover art in a disc, the title with its
 * artist, a thin progress rail you can seek (a Base UI slider: arrows step
 * five seconds, Home/End jump), the time played in mono, and the transport,
 * previous, a play disc in ink that morphs to pause, and next. It owns no
 * clock: pass `position` and `duration` from your player and act on
 * `onPlayingChange`, `onSeek`, `onPrevious` and `onNext`.
 * Motion: the play triangle folds into the pause bars on the snappy spring
 * (the PlayIcon morph); a new track's title rises in as the old one leaves
 * upward (base token), and the rail's thumb grows in on hover and focus
 * while the fill tracks the time exactly. Reduced motion: the icon and the
 * title swap at once. */

interface CapsulePlayerProps extends Omit<CapsuleProps, 'title' | 'children'> {
  title: string
  /** The artist, show or source, muted after the title. */
  subtitle?: string
  /** Cover art: an <img> or any node, cropped to a disc. Decorative. */
  artwork?: ReactNode
  playing: boolean
  onPlayingChange: (playing: boolean) => void
  /** The playhead, in seconds. */
  position: number
  /** The track's length, in seconds. */
  duration: number
  /** Seeks to a time in seconds, as the rail is dragged or stepped. Without it the rail only shows progress. */
  onSeek?: (seconds: number) => void
  /** Without it, the previous button is disabled. */
  onPrevious?: () => void
  /** Without it, the next button is disabled. */
  onNext?: () => void
  /** Formats the times. Default: the YoujProvider locale. */
  locale?: string
}

function CapsulePlayer({
  title,
  subtitle,
  artwork,
  playing,
  onPlayingChange,
  position,
  duration,
  onSeek,
  onPrevious,
  onNext,
  locale: localeProp,
  className,
  ...props
}: CapsulePlayerProps) {
  const k = useYouj()
  const labels = useComponentLabels(capsulePlayerLabels)
  const locale = useLocale(localeProp)
  const time = (seconds: number) => formatTimecode(seconds, locale)
  const at = Math.min(Math.max(position, 0), Math.max(duration, 0))

  return (
    <MotionFeatures>
      <Capsule data-slot="capsule-player" data-playing={playing || undefined} className={cn('w-full max-w-[26rem] gap-1', className)} {...props}>
        <span aria-hidden data-slot="capsule-player-art" className="relative aspect-square h-full shrink-0 overflow-hidden own:rounded-xl bg-band [&>img]:size-full [&>img]:object-cover">
          {artwork}
        </span>
        <div className="own:flex min-w-0 flex-1 flex-col justify-center gap-1 px-1.5">
          <div className="own:flex min-w-0 items-baseline gap-2">
            <span className="relative min-w-0 flex-1 overflow-hidden">
              <AnimatePresence initial={false} mode="popLayout">
                <m.span
                  key={title}
                  data-slot="capsule-player-title"
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '-100%', opacity: 0 }}
                  transition={k.reduced ? { type: false } : k.tween('base', 'emphasized')}
                  className="own:block truncate own:text-ui-sm own:font-medium own:text-fg"
                >
                  {title}
                  {subtitle && <span className="own:font-normal own:text-fg-muted"> · {subtitle}</span>}
                </m.span>
              </AnimatePresence>
            </span>
            <span data-slot="capsule-player-time" className="shrink-0 own:font-mono own:text-ui-xs own:text-fg-muted own:tabular-nums">
              {time(at)}
            </span>
          </div>
          {/* Playback runs left to right in every script, as media players do: the rail, its arrows and its thumb stay LTR. */}
          <DirectionProvider direction="ltr">
            <SliderPrimitive.Root
              dir="ltr"
              data-slot="capsule-player-rail"
              value={at}
              min={0}
              max={Math.max(duration, 1)}
              step={5}
              disabled={!onSeek}
              onValueChange={(next) => onSeek?.(next as number)}
              thumbAlignment="edge"
              className="group/rail w-full"
            >
              <SliderPrimitive.Control className="relative own:flex h-2.5 w-full touch-none items-center select-none">
                <SliderPrimitive.Track className="relative h-[3px] w-full own:rounded-full own:bg-well">
                  <SliderPrimitive.Indicator data-slot="capsule-player-progress" className="own:rounded-full own:bg-fg" />
                  <SliderPrimitive.Thumb
                    aria-label={labels.waveformSeek}
                    getAriaValueText={() => labels.waveformPosition(time(at), time(duration))}
                    className={cn(
                      'size-2.5 own:rounded-full own:bg-fg own:shadow-xs-soft focus-ring-within data-disabled:hidden',
                      'scale-0 transition-[scale] yj-duration-fast ease-enter group-hover/rail:scale-100 has-[:focus-visible]:scale-100 data-dragging:scale-100',
                      'after:absolute after:-inset-2',
                    )}
                  />
                </SliderPrimitive.Track>
              </SliderPrimitive.Control>
            </SliderPrimitive.Root>
          </DirectionProvider>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label={labels.previousTrack} disabled={!onPrevious} onClick={onPrevious} className="own:text-fg-muted">
          <SkipBackIcon size={16} />
        </Button>
        <Button size="icon" aria-label={playing ? labels.pause : labels.play} onClick={() => onPlayingChange(!playing)}>
          <PlayIcon size={16} active={playing} className="fill-current" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={labels.nextTrack} disabled={!onNext} onClick={onNext} className="own:text-fg-muted">
          <SkipForwardIcon size={16} />
        </Button>
      </Capsule>
    </MotionFeatures>
  )
}

export { CapsulePlayer, type CapsulePlayerProps }
