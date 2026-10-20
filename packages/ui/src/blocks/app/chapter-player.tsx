'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { FileTextIcon, MoreHorizontalIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'
import { formatTimecode } from '../../components/ui/waveform-scrubber'
import { useAnnouncer } from '../../hooks/use-announcer'
import { Chapters } from './chapter-player/chapters'
import { DEFAULT_COPY, MEDIA, START, demo, type ChapterPlayerChapter, type ChapterPlayerCopy, type ChapterPlayerMedia } from './chapter-player/data'
import { Player } from './chapter-player/player'
import { ChapterPlayerEmpty, ChapterPlayerError, ChapterPlayerLoading } from './chapter-player/states'
import { usePlayer } from './chapter-player/use-player'
import { cn } from '../../lib/utils'

/* A recording as a listening instrument: an episode, a lecture, an
 * audiobook. The now-playing row names the
 * chapter you're in and runs the clock in big mono, with the time left
 * under it. The WaveformScrubber is the recording's sound as bars (played in
 * ink, the rest dim), chapter starts as ticks with their titles above and a
 * ruler of minutes below; drag it or use the keys, and hover to see the
 * time and chapter under the pointer. Under it the transport (back 15, a
 * play disc that morphs to pause, forward 30), the speed on a fader over a
 * ruler from 0.8× to 2×, and Clip: two accent handles bracket half a minute
 * from the playhead and a bar offers "Share 0:42–1:15". The chapters list
 * jumps anywhere and lights the one playing, with how far through it you
 * are. Playback is simulated with a clock (`usePlayer`); swap it for an
 * <audio> element's currentTime, playbackRate and play(). Loading, an error
 * with Retry and no media at all take the player's and the chapters' place at
 * their size. Reduced motion: the wave is drawn in place and the clip bar
 * opens without folding.
 * It is built for the compact layout density (ui.css), taken from the page; embedded,
 * it stops at its natural width, as it does on its own, unless `fill`. */

interface ChapterPlayerProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2` (its sections `h3`s), without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (896px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<ChapterPlayerCopy>
  /** How its dates, times and numbers read (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** What plays; `null` for nothing to play. Default: the demo's podcast episode. */
  media?: ChapterPlayerMedia | null
  /** Where the playhead starts, in seconds. Default: a little into the third chapter. */
  start?: number
  /** Shares a clip, in seconds; resolve when its link is copied. Default: a short demo wait. */
  onShareClip?: (range: [number, number]) => Promise<unknown> | unknown
  /** Skeletons in place of the player and the chapters while your media loads. Default false. */
  loading?: boolean
  /** Shown in place of the player and the chapters when they fail to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there is no media. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** Classes for its parts: `card` holds the block's size (685px tall at 100%; the chapters scroll in what the player leaves, so opening a clip never resizes it). */
  classNames?: { card?: string }
}

function ChapterPlayer({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  media = MEDIA,
  start = START,
  onShareClip,
  loading = false,
  error,
  onRetry,
  empty,
  classNames,
  className,
  ...rest
}: ChapterPlayerProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const SectionTitle = embedded ? 'h3' : 'h2'
  const { announce, announcer } = useAnnouncer()
  const player = usePlayer(media?.length ?? 0, start)
  const idle = loading || !!error || !media
  const [clip, setClip] = useState<[number, number] | null>(null)
  const time = (t: number) => formatTimecode(t, copy.locale)

  // Its natural width: on the card on its own page, on the section embedded (where a className can change it).
  const cap = !fill && 'max-w-224'
  const card = (
    <Card className={cn('h-171.25 w-full text-fg', !embedded && cap, classNames?.card)}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>
            {loading ? (
              <>
                <Skeleton className="inline-block h-4 w-32 align-middle" />
                <span className="sr-only">{copy.loadingLabel}</span>
              </>
            ) : error || !media ? (
              copy.idleTitle
            ) : (
              media.title
            )}
          </Title>
        </CardTitle>
        <CardDescription>{loading ? <Skeleton className="inline-block h-3.5 w-28 align-middle" /> : error || !media ? '—' : copy.subtitle(media.series, media.part)}</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label={copy.more}>
            <MoreHorizontalIcon size={16} />
          </Button>
        </CardAction>
      </CardHeader>

      {loading ? (
        <ChapterPlayerLoading copy={copy} />
      ) : error ? (
        <ChapterPlayerError message={error} onRetry={onRetry} copy={copy} />
      ) : !media ? (
        <ChapterPlayerEmpty empty={empty} copy={copy} />
      ) : (
        <>
      <CardContent>
        <Player
          media={media}
          player={player}
          clip={clip}
          onClip={setClip}
          copy={copy}
          onShare={async () => {
            if (!clip) return
            await (onShareClip ? onShareClip(clip) : demo('ChapterPlayer: onShareClip', 700))
            announce(copy.sharedAnnounce(`${time(clip[0])}–${time(clip[1])}`))
          }}
        />
      </CardContent>

      {/* The chapters scroll in what the player leaves: the clip bar opening never resizes the card. */}
      <CardContent className="-my-1 min-h-0 flex-1 overflow-y-auto py-1 yj-scrollbar">
        <Chapters media={media} position={player.position} onSeek={player.seek} copy={copy} SectionTitle={SectionTitle} titleId={`${titleId}-chapters`} />
      </CardContent>

        </>
      )}

      <CardFooter className="flex-wrap">
        <span className="me-auto font-mono text-ui-sm text-fg-muted tabular-nums">
          {copy.status}
          {' · '}
          {loading ? <Skeleton className="inline-block h-3.5 w-16 align-middle" /> : idle ? '—' : copy.timeLeft(time(media.length - player.position))}
        </span>
        <Button variant="secondary">
          <FileTextIcon size={14} />
          {copy.transcript}
        </Button>
      </CardFooter>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', cap, className)}>
      {card}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { ChapterPlayer, type ChapterPlayerProps }
export type { ChapterPlayerChapter, ChapterPlayerCopy, ChapterPlayerMedia }
