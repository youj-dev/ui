'use client'

import { Badge, BadgeDot } from '../../../components/ui/badge'
import { Eyebrow } from '../../../components/ui/typography'
import { formatTimecode } from '../../../components/ui/waveform-scrubber'
import { cn, numberFormat } from '../../../lib/utils'
import type { ChapterPlayerCopy, ChapterPlayerMedia } from './data'

interface ChaptersProps {
  media: ChapterPlayerMedia
  position: number
  onSeek: (seconds: number) => void
  copy: ChapterPlayerCopy
  SectionTitle: 'h2' | 'h3'
  titleId: string
}

/** The chapters as rows to jump to: number, title, start and length in mono; the one playing is lit, with how far through it you are. */
function Chapters({ media, position, onSeek, copy, SectionTitle, titleId }: ChaptersProps) {
  const { chapters, length } = media
  const count = numberFormat(copy.locale, { minimumIntegerDigits: 2 })
  const minutes = numberFormat(copy.locale, { maximumFractionDigits: 0 })
  const current = chapters.filter((c) => position >= c.start).length - 1

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow render={<SectionTitle id={titleId} />}>{copy.chapters}</Eyebrow>
        <span dir="auto" className="font-mono text-ui-sm text-fg-muted tabular-nums">{copy.chapterCount(chapters.length)}</span>
      </div>
      <ol className="-mx-2 flex flex-col">
        {chapters.map((c, i) => {
          const end = chapters[i + 1]?.start ?? length
          const now = i === current
          const through = now ? Math.min(1, Math.max(0, (position - c.start) / Math.max(1, end - c.start))) : 0
          return (
            <li key={c.start} className="relative before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-line first:before:hidden">
              <button
                type="button"
                aria-current={now || undefined}
                onClick={() => onSeek(c.start)}
                className={cn(
                  'group/row grid min-h-(--ui--row) w-full grid-cols-[--spacing(7)_minmax(0,1fr)_auto_--spacing(13)] items-center gap-x-3 rounded-lg px-2 py-1 text-start outline-none focus-ring sm:grid-cols-[--spacing(7)_minmax(0,1fr)_auto_--spacing(16)_--spacing(14)]',
                  'transition-[background-color] yj-duration-fast ease-standard hover:bg-hover',
                )}
              >
                <span className={cn('font-mono text-ui-sm tabular-nums', now ? 'text-fg' : 'text-fg-muted')}>{count.format(i + 1)}</span>
                <span className="flex min-w-0 flex-col gap-1.5">
                  <span className={cn('truncate text-ui-lg', now ? 'font-medium text-fg' : 'text-fg')}>{c.title}</span>
                  {now && (
                    <span aria-hidden className="h-0.5 overflow-hidden rounded-full bg-well">
                      <span className="block h-full origin-left rounded-full bg-fg rtl:origin-right" style={{ transform: `scaleX(${through})` }} />
                    </span>
                  )}
                </span>
                <span className="flex justify-end">
                  {now && (
                    <Badge>
                      <BadgeDot />
                      {copy.now}
                    </Badge>
                  )}
                </span>
                <span className="text-end font-mono text-ui-sm text-fg tabular-nums">{formatTimecode(c.start, copy.locale)}</span>
                <span dir="auto" className="hidden text-end font-mono text-ui-sm text-fg-muted tabular-nums sm:block">
                  {copy.minutes(minutes.format((end - c.start) / 60))}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export { Chapters }
