'use client'

import { useState } from 'react'
import { Collapse } from '@youj/motion'
import { PlayIcon, RotateCcwIcon, RotateCwIcon, ScissorsIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Slider } from '../../../components/ui/slider'
import { Eyebrow } from '../../../components/ui/typography'
import { formatTimecode, WaveformScrubber } from '../../../components/ui/waveform-scrubber'
import { cn, dateTimeFormat, numberFormat } from '../../../lib/utils'
import { RATES, type ChapterPlayerCopy, type ChapterPlayerMedia } from './data'
import type { usePlayer } from './use-player'

interface PlayerProps {
  media: ChapterPlayerMedia
  player: ReturnType<typeof usePlayer>
  clip: [number, number] | null
  onClip: (range: [number, number] | null) => void
  onShare: () => Promise<unknown> | unknown
  copy: ChapterPlayerCopy
}

const TICKS = Math.round((RATES.max - RATES.min) / RATES.step) + 1

/** The rate on a fader over a ruler: a tick every tenth, a long one at 1×, 1.5× and 2×. */
function SpeedRuler({ rate, onRate, copy }: { rate: number; onRate: (rate: number) => void; copy: ChapterPlayerCopy }) {
  const format = numberFormat(copy.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return (
    <div className="flex items-center gap-3">
      <Eyebrow aria-hidden>{copy.speed}</Eyebrow>
      <div className="relative w-36 sm:w-40">
        <div aria-hidden className="pointer-events-none absolute inset-x-2 top-[calc(50%+0.4375rem)] flex justify-between">
          {Array.from({ length: TICKS }, (_, i) => {
            const value = Math.round((RATES.min + i * RATES.step) * 10) / 10
            const major = value === 1 || value === 1.5 || value === 2
            return <span key={i} className={cn('w-px', major ? 'h-2 bg-fg-subtle' : 'h-1 bg-fg-subtle', value === rate && 'bg-fg')} />
          })}
        </div>
        <Slider
          // Slider names its thumb from aria-label (a labelledby on the root never reaches it).
          aria-label={copy.speed}
          min={RATES.min}
          max={RATES.max}
          step={RATES.step}
          value={[rate]}
          onValueChange={(v) => onRate(Math.round((Array.isArray(v) ? v[0]! : (v as number)) * 10) / 10)}
          getAriaValueText={(_, v) => copy.speedValue(format.format(v))}
        />
      </div>
      <span aria-hidden dir="auto" className="w-10 font-mono text-ui-sm text-fg tabular-nums">
        {copy.speedValue(format.format(rate))}
      </span>
    </div>
  )
}

/** What's playing: the chapter, the clock, the wave to scrub, the transport, the rate and the clip. */
function Player({ media, player, clip, onClip, onShare, copy }: PlayerProps) {
  const { position, playing, rate, setRate, seek, skip, toggle } = player
  const time = (t: number) => formatTimecode(t, copy.locale)
  const index = Math.max(0, media.chapters.filter((c) => position >= c.start).length - 1)
  const chapter = media.chapters[index]!
  // The clip bar keeps its last range while it folds away.
  const [last, setLast] = useState(clip)
  if (clip && clip !== last) setLast(clip)
  const shownClip = clip ?? last
  const range = shownClip && `${time(shownClip[0])}–${time(shownClip[1])}`
  const date = dateTimeFormat(copy.locale, { day: 'numeric', month: 'short' })
  const count = numberFormat(copy.locale, { minimumIntegerDigits: 2 })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {/* The media's tile: a soft accent tint and the wave glyph, no image to load. */}
        <div
          aria-hidden
          className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-accent-subtle sm:size-20"
        >
          {/* The mark: five bars, the same voice as the wave below. */}
          <span className="relative flex h-7 items-center gap-[3px]">
            {[0.45, 0.8, 1, 0.65, 0.35].map((h, i) => (
              <span key={i} className="w-[3px] rounded-full bg-accent-text" style={{ height: `${h * 100}%` }} />
            ))}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Eyebrow className="truncate tabular-nums">
            {count.format(index + 1)} / {count.format(media.chapters.length)}
            {media.date !== undefined && <span className="hidden sm:inline"> · {date.format(media.date)}</span>}
          </Eyebrow>
          <p aria-live="polite" className="truncate text-xl leading-tight font-medium tracking-tight text-fg">
            {chapter.title}
          </p>
          <p className="truncate text-ui-sm text-fg-muted">{copy.byline(media.author)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span role="timer" className="font-mono text-3xl leading-none font-medium tracking-tight text-fg tabular-nums">
            {time(position)}
          </span>
          <span dir="auto" className="font-mono text-ui-sm text-fg-muted tabular-nums">{copy.left(time(media.length - position))}</span>
        </div>
      </div>

      <WaveformScrubber
        peaks={media.peaks}
        duration={media.length}
        chapters={media.chapters}
        value={position}
        onValueChange={seek}
        clip={clip}
        onClipChange={onClip}
        locale={copy.locale}
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex items-center gap-2">
          <Button variant="secondary" aria-label={copy.back(15)} onClick={() => skip(-15)} className="gap-1 px-3 font-mono tabular-nums">
            <RotateCcwIcon size={14} />
            <span aria-hidden>{numberFormat(copy.locale).format(15)}</span>
          </Button>
          {/* shape: the transport's play key, a size above the controls around it */}
          <Button size="icon-lg" aria-label={playing ? copy.pause : copy.play} aria-pressed={playing} onClick={toggle} className="size-12">
            <PlayIcon size={20} active={playing} className="fill-current" />
          </Button>
          <Button variant="secondary" aria-label={copy.forward(30)} onClick={() => skip(30)} className="gap-1 px-3 font-mono tabular-nums">
            <span aria-hidden>{numberFormat(copy.locale).format(30)}</span>
            <RotateCwIcon size={14} />
          </Button>
        </div>
        <div className="order-last w-full sm:order-none sm:w-auto">
          <SpeedRuler rate={rate} onRate={setRate} copy={copy} />
        </div>
        <Button
          variant="secondary"
          aria-pressed={!!clip}
          onClick={() => onClip(clip ? null : [Math.floor(position), Math.min(media.length, Math.floor(position) + 33)])}
          className="ms-auto aria-pressed:text-accent-text"
        >
          <ScissorsIcon size={14} />
          {copy.clip}
        </Button>
      </div>

      <Collapse open={!!clip}>
        {shownClip && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl bg-accent-subtle p-3 ps-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <Eyebrow>{copy.clipping}</Eyebrow>
              <span className="font-mono text-ui-lg text-fg tabular-nums">
                {range}
                <span className="ms-2 text-ui-sm text-fg-muted">{copy.clipLength(numberFormat(copy.locale).format(shownClip[1] - shownClip[0]))}</span>
              </span>
            </div>
            <div className="ms-auto flex gap-2">
              <Button variant="secondary" onClick={() => onClip(null)}>
                {copy.cancel}
              </Button>
              <AsyncButton onAction={onShare} pendingLabel={copy.sharing} successLabel={copy.shared}>
                {copy.share(range!)}
              </AsyncButton>
            </div>
          </div>
        )}
      </Collapse>
    </div>
  )
}

export { Player }
