'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { MoreHorizontalIcon, PlayIcon, RulerIcon, SkipBackIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'
import { TrackTimeline, formatClipTime } from '../../components/ui/track-timeline'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { Toggle } from '../../components/ui/toggle'
import { useAnnouncer } from '../../hooks/use-announcer'
import { CLIPS, DEFAULT_COPY, PROJECT, RESOLUTION, TRACKS, trim, demo, type TrackArrangerClip, type TrackArrangerCopy, type TrackArrangerProject, type TrackArrangerTrack } from './track-arranger/data'
import { Inspector } from './track-arranger/inspector'
import { TrackArrangerEmpty, TrackArrangerError, TrackArrangerLoading } from './track-arranger/states'
import { useTransport } from './track-arranger/use-transport'
import { cn } from '../../lib/utils'

/* A project in tracks, arranged like a small studio (a song idea, an episode
 * edit, a video cut): each track a
 * lane in its chart color with its mute and solo keys and a level strip,
 * each clip a rounded bar holding its part's sound (a TrackTimeline). Drag a
 * clip to move it or its edges to trim it; both snap to the clips around
 * them and to the playhead unless Snap is off. The selected clip opens in the
 * inspector below, with its start and end to the tenth of a second and its
 * gain on a fader, which redraws its wave. Play runs the clock in big mono
 * and the playhead across the lanes, the level strips reading each track as
 * it passes. Playback is simulated with a clock (`useTransport`); swap it for
 * your audio engine's. Loading, an error with Retry and a project with no
 * tracks take the body's place at its size. Reduced motion: the level strips
 * jump to each reading; nothing else animates.
 * It is built for the compact layout density (ui.css), taken from the page; embedded,
 * it stops at its natural width, as it does on its own, unless `fill`. */

interface TrackArrangerProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2` (the inspector an `h3`), without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (960px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<TrackArrangerCopy>
  /** How its dates, times and numbers read (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** What is being arranged: its title, its length and a line of detail. Default: the demo's song sketch. */
  project?: TrackArrangerProject
  /** The lanes, in order, each with its source's loudness samples. */
  tracks?: TrackArrangerTrack[]
  /** The bars on the lanes. */
  clips?: TrackArrangerClip[]
  /** Seconds between the samples in each track's `peaks`. Default 0.1. */
  resolution?: number
  /** Where the playhead starts, in seconds. Default: a bar into the chorus. */
  start?: number
  /** The clip selected at first; `null` for none. Default: the chorus idea. */
  defaultSelected?: string | null
  /** Renders the mix; resolve when it's done. Default: a short demo wait. */
  onExport?: (clips: TrackArrangerClip[], tracks: TrackArrangerTrack[]) => Promise<unknown> | unknown
  /** Skeletons in place of the transport, the lanes and the inspector while your project loads. Default false. */
  loading?: boolean
  /** Shown in place of the body when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no tracks. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

function TrackArranger({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  project = PROJECT,
  tracks: tracksProp = TRACKS,
  clips: clipsProp = CLIPS,
  resolution = RESOLUTION,
  start = 28.5,
  defaultSelected = 'chorus',
  onExport,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: TrackArrangerProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const inspectorId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const SectionTitle = embedded ? 'h3' : 'h2'
  const { announce, announcer } = useAnnouncer()
  const transport = useTransport(project.length, start)
  const [clips, setClips] = useState(clipsProp)
  const [tracks, setTracks] = useState(tracksProp)
  const [selected, setSelected] = useState<string | null>(defaultSelected)
  const [snap, setSnap] = useState(true)
  const clip = clips.find((c) => c.id === selected)
  const trackIndex = clip ? tracks.findIndex((t) => t.id === clip.track) : -1
  const time = (t: number) => formatClipTime(t, copy.locale)

  // Its natural width: on the card on its own page, on the section embedded (where a className can change it).
  const cap = !fill && 'max-w-240'
  const card = (
    <Card className={cn('w-full text-fg', !embedded && cap)}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>
            {loading ? (
              <>
                <Skeleton className="inline-block h-4 w-28 align-middle" />
                <span className="sr-only">{copy.loadingLabel}</span>
              </>
            ) : error ? (
              copy.timeline
            ) : (
              project.title
            )}
          </Title>
        </CardTitle>
        <CardDescription>{loading ? <Skeleton className="inline-block h-3.5 w-36 align-middle" /> : error ? '—' : copy.subtitle(project.detail)}</CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.more} />}>
              <MoreHorizontalIcon size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>{copy.rename}</DropdownMenuItem>
              <DropdownMenuItem>{copy.duplicate}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      {loading ? (
        <TrackArrangerLoading copy={copy} />
      ) : error ? (
        <TrackArrangerError message={error} onRetry={onRetry} copy={copy} />
      ) : tracks.length === 0 ? (
        <TrackArrangerEmpty empty={empty} copy={copy} />
      ) : (
        <>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="icon" aria-label={copy.rewind} onClick={transport.rewind}>
              <SkipBackIcon size={15} />
            </Button>
            {/* shape: the transport's play key, a size above the controls around it */}
            <Button size="icon-lg" aria-label={transport.playing ? copy.pause : copy.play} aria-pressed={transport.playing} onClick={transport.toggle} className="size-12">
              <PlayIcon size={20} active={transport.playing} className="fill-current" />
            </Button>
          </div>
          <p role="timer" aria-live="off" className="font-mono text-3xl leading-none font-medium tracking-tight text-fg tabular-nums">
            {time(transport.position)}
            <span className="ms-2 text-ui-lg font-normal tracking-normal text-fg-muted">/ {time(project.length)}</span>
          </p>
          <Toggle variant="outline" size="sm" pressed={snap} onPressedChange={setSnap} className="ms-auto gap-1.5 px-2.5">
            <RulerIcon size={14} />
            {copy.snap}
          </Toggle>
        </div>

        <TrackTimeline
          tracks={tracks}
          clips={clips}
          onClipsChange={setClips}
          onTrackChange={(id, change) => setTracks((list) => list.map((t) => (t.id === id ? { ...t, ...change } : t)))}
          duration={project.length}
          position={transport.position}
          onPositionChange={transport.seek}
          value={selected}
          onValueChange={setSelected}
          resolution={resolution}
          snap={snap}
          playing={transport.playing}
          label={copy.timeline}
          locale={copy.locale}
          aria-controls={clip ? inspectorId : undefined}
        />
      </CardContent>

      <CardContent>
        <Inspector
          clip={clip}
          track={tracks[trackIndex]}
          index={trackIndex}
          length={project.length}
          copy={copy}
          SectionTitle={SectionTitle}
          titleId={inspectorId}
          onTrim={(edge, to) => clip && setClips((list) => trim(list, clip.id, edge, to, project.length))}
          onGain={(db) => clip && setClips((list) => list.map((c) => (c.id === clip.id ? { ...c, gain: db } : c)))}
        />
      </CardContent>

        </>
      )}

      <CardFooter className="flex-wrap">
        <span className="me-auto">{copy.saved}</span>
        <AsyncButton
          disabled={loading || !!error || tracks.length === 0}
          pendingLabel={copy.exporting}
          successLabel={copy.exported}
          onAction={async () => {
            await (onExport ? onExport(clips, tracks) : demo('TrackArranger: onExport', 900))
            announce(copy.announceExported)
          }}
        >
          {copy.export}
        </AsyncButton>
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

export { TrackArranger, type TrackArrangerProps }
export type { TrackArrangerClip, TrackArrangerCopy, TrackArrangerProject, TrackArrangerTrack }
