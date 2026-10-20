'use client'

import { useEffect, useId, useState, type ElementType, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { AppPage } from '../../components/ui/app-page'
import { Sparkline } from '../../components/ui/sparkline'
import { StatCard } from '../../components/ui/stat-card'
import { Whiteboard, type WhiteboardPin, type WhiteboardScene } from '../../components/ui/whiteboard'
import { cn } from '../../lib/utils'
import { CommentThread, type CommentThreadItem, type CommentThreadPerson, type CommentThreadProps } from '../activity/comment-thread'
import { DailyBars } from './daily-bars'
import {
  ACTIVATION,
  DAYS,
  DEFAULT_COPY,
  DEMO_NOW,
  NOTES,
  PATH,
  PREVIOUS_TOTAL,
  SCENE,
  TEAM,
  THREADS,
  USER,
  demo,
  demoPeople,
  type CollaborativeCanvasCopy,
  type CollaborativeCanvasCrumb,
  type CollaborativeCanvasPerson,
} from './collaborative-canvas/data'
import { BoardActions, Header } from './collaborative-canvas/header'

/* A team's board: the breadcrumbs to it, who is on it and Share over a
 * Whiteboard that fills the screen. On the board, live kit cards (a chart
 * and a stat) sit among sticky notes joined by connectors, other people's
 * cursors move with the board, and comment pins open a CommentThread in a
 * popover, where a thread is answered and resolved. Without `people` it
 * runs two demo collaborators under a dashed "Demo data" badge; pass your
 * realtime layer's `people` (and `threads`, by pin id) to drive it. Demo
 * content — edit after adding. Reduced motion: cursors jump, the board's
 * view doesn't ease. */

interface CollaborativeCanvasProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title' | 'defaultValue'> {
  /** Wraps the screen in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) titled with the board's name and holding who is here and Share, over the board filling the page; no breadcrumbs of its own. Default true; `false` draws its own page (the breadcrumbs bar over a board that fills the viewport). */
  embedded?: boolean
  /** Formats the threads' times. Default: the app's locale (YoujProvider). */
  locale?: string
  /** Any of the screen's strings, to rewrite or translate. */
  copy?: Partial<CollaborativeCanvasCopy>
  /** Where the board is; the last step is its name. Default: the demo's "Acme / Growth / Q4 activation review". */
  path?: CollaborativeCanvasCrumb[]
  /** The board's scene, when your app owns it; pair with `onValueChange`. */
  value?: WhiteboardScene
  /** The scene at first. Default: the demo's review board. */
  defaultValue?: WhiteboardScene
  onValueChange?: (scene: WhiteboardScene) => void
  /** Everyone else on the board, their cursors in board coordinates. Default: two demo collaborators, moving (a demo, marked). */
  people?: CollaborativeCanvasPerson[]
  /** The threads behind each comment pin, by pin id. Default: the demo's two threads. */
  threads?: Record<string, CommentThreadItem[]>
  /** Who can be @mentioned in a thread. Default: the demo's team. */
  team?: CommentThreadPerson[]
  /** The signed-in person: new comments are theirs. Default: the demo's Jordan. */
  user?: CommentThreadPerson
  /** What the board's embeds hold, by id. Default: the demo's sign-ups chart and activation card. */
  embeds?: Record<string, ReactNode>
  /** The time the threads are read against. Default: the demo's, or the browser's clock with your `threads`. */
  now?: Date | number
  /** Shows a dashed "Demo data" badge while the screen runs its demo collaborators. Default true. */
  demoMarker?: boolean
  /** Share. Default: the demo's (it reports the link copied). */
  onShare?: () => Promise<unknown> | unknown
  /** A new comment or reply in a pin's thread. */
  onPost?: CommentThreadProps['onPost']
  /** A pin's thread resolved or reopened from inside it. */
  onResolve?: CommentThreadProps['onResolve']
  /** Renders the breadcrumbs' links. Default `a`. */
  linkComponent?: ElementType
}

/** The demo's people walk their paths while nothing else drives them: a point every 60 ms, which LiveCursors' spring joins into a glide. */
function useDemoPeople(active: boolean) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setTick(performance.now() / 700), 60)
    return () => clearInterval(id)
  }, [active])
  return demoPeople(tick)
}

function CollaborativeCanvas({
  theme,
  embedded = true,
  locale: localeProp,
  copy: copyProp,
  path = PATH,
  value,
  defaultValue = SCENE,
  onValueChange,
  people: peopleProp,
  threads = THREADS,
  team = TEAM,
  user = USER,
  embeds: embedsProp,
  now,
  demoMarker = true,
  onShare,
  onPost,
  onResolve,
  linkComponent = 'a',
  className,
  ...rest
}: CollaborativeCanvasProps) {
  const locale = useLocale(localeProp)
  const copy: CollaborativeCanvasCopy = { ...DEFAULT_COPY, ...copyProp, locale }
  const titleId = useId()
  const simulated = peopleProp === undefined
  const demoPeopleNow = useDemoPeople(simulated)
  const people = peopleProp ?? demoPeopleNow
  const title = path.at(-1)?.label ?? ''

  const embeds = embedsProp ?? {
    activation: (
      <StatCard
        label={copy.activation}
        value={ACTIVATION.at(-1)!}
        format={{ style: 'percent' }}
        locale={locale}
        delta={0.04}
        comparison={copy.activationNote}
        chart={<Sparkline data={ACTIVATION} className="h-10" />}
      />
    ),
    signups: (
      <DailyBars
        fill
        headingLevel={2}
        locale={locale}
        days={DAYS}
        previousTotal={PREVIOUS_TOTAL}
        notes={NOTES}
        copy={{ title: copy.signups, subtitle: copy.signupsSubtitle, chart: copy.signups }}
      />
    ),
  }

  const pinContent = (pin: WhiteboardPin, actions: ReactNode) => (
    <CommentThread
      actions={actions}
      fill
      headingLevel={2}
      locale={locale}
      threads={threads[pin.id] ?? []}
      people={team}
      user={user}
      now={now ?? (threads === THREADS ? DEMO_NOW : undefined)}
      demoMarker={false}
      onPost={onPost}
      onResolve={onResolve}
      copy={{ title: copy.thread }}
      classNames={{ card: 'h-104 rounded-none border-0 bg-transparent shadow-none ring-0 [&_[data-slot^=card-]]:bg-transparent' }}
    />
  )

  const onShareBoard = async () => (onShare ? onShare() : demo('CollaborativeCanvas: onShare', 400))
  const board = (framed: boolean) => (
    <Whiteboard
      label={title}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      defaultTool="select"
      embeds={embeds}
      pinContent={pinContent}
      cursors={people}
      className={cn('min-h-0 flex-1 bg-canvas', framed ? 'rounded-xl border border-line' : 'rounded-none border-0')}
      style={{ height: 'auto' }}
    />
  )

  if (embedded) {
    return (
      <ThemeScope theme={theme}>
        <AppPage
          {...rest}
          title={title}
          actions={<BoardActions copy={copy} people={people} demo={simulated && demoMarker} onShare={onShareBoard} />}
          width="fill"
          className={cn('text-fg', className)}
          classNames={{ body: 'min-h-[calc(100dvh-(--spacing(16)))]' }}
        >
          <div className="flex min-h-144 flex-1 flex-col">{board(true)}</div>
        </AppPage>
      </ThemeScope>
    )
  }
  return (
    <ThemeScope theme={theme}>
      <main aria-labelledby={titleId} {...rest} className={cn('bg-canvas text-fg', className)}>
        <div className="flex h-dvh flex-col">
          <h1 id={titleId} className="sr-only">
            {title}
          </h1>
          <Header
            copy={copy}
            path={path}
            people={people}
            demo={simulated && demoMarker}
            linkComponent={linkComponent}
            onShare={onShareBoard}
          />
          {board(false)}
        </div>
      </main>
    </ThemeScope>
  )
}

export {
  CollaborativeCanvas,
  type CollaborativeCanvasCopy,
  type CollaborativeCanvasCrumb,
  type CollaborativeCanvasPerson,
  type CollaborativeCanvasProps,
}
