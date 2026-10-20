import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { YoujProvider } from '@youj/core'
import { PresenceItem, PresenceList } from '@youj/motion'
import { CircleDashedIcon } from '@youj/icons'
import { Badge } from '@youj/react/components/ui/badge'
import { Button } from '@youj/react/components/ui/button'
import { AsyncButton } from '@youj/react/components/ui/async-button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@youj/react/components/ui/dialog'
import { Input } from '@youj/react/components/ui/input'
import { Switch } from '@youj/react/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@youj/react/components/ui/tabs'
import { toast, Toaster } from '@youj/react/components/ui/toast'
import { ToggleGroup, ToggleGroupItem } from '@youj/react/components/ui/toggle-group'
import { tween } from '../lib/timing'
import { useAction, useFrame, useFrameValue } from '../sim/simulation'
import { Backdrop } from '../film/backdrop'
import { Deferred } from '../film/bits'
import { Camera } from '../film/camera'
import { Cursor, type Point } from '../film/cursor'
import { useFormat, type Format } from '../film/format'
import { MOTION_LOOP as M, TOPICS } from './beats'

/* Motion, as a loop: close-ups of the motion inside the components, one at
 * a time, each about half the frame wide, locked off. Save presses into its
 * whole async lifecycle (the label morphs, a spinner, then Saved with its
 * check); the tab underline glides twice; a switch flips; a dialog opens and
 * closes; three toasts stack, the older stepping back; a list re-sorts, its
 * rows gliding to their places. Then the same list twice, side by side, one
 * with motion and one under reduced motion, where the same change lands at
 * once. Each shot dissolves into the next, and the last back into Save, at
 * rest, where the loop begins.
 *
 * Every close-up is the component at its real size under a Camera, so its
 * own layout animations measure through the lens. The dialog and the toasts
 * portal to the page, so they are zoomed to match instead. */

const P = TOPICS.motion.preroll
type ShotId = keyof typeof M.shots
const ORDER: ShotId[] = ['button', 'tabs', 'toggle', 'dialog', 'toasts', 'list', 'split', 'home']

/** Each shot's magnification, per stage: the subject about half the frame wide (on the tile strip, most of the narrowest tile). */
function scales(format: Format): Record<Exclude<ShotId, 'home'>, number> {
  if (format.tile) return { button: 2.4, tabs: 1.5, toggle: 1.3, dialog: 0.9, toasts: 1.25, list: 1.25, split: 0.72 }
  if (format.tall) return { button: 3.6, tabs: 1.9, toggle: 1.45, dialog: 1.15, toasts: 1.45, list: 1.36, split: 1.2 }
  return { button: 4.2, tabs: 2.8, toggle: 2, dialog: 1.6, toasts: 2, list: 1.9, split: 1.36 }
}

export function MotionLoop() {
  const frame = useFrame()
  const format = useFormat()
  const { width, height } = format
  const zoom = scales(format)
  // The split stacks where the frame is narrow: the portrait cut, and the tile, whose narrowest crop is nearly square.
  const stacked = format.tall || format.tile
  const root = useRef<HTMLDivElement>(null)

  /**
   * How much of a shot is showing. Shots dip through the canvas rather than
   * cross: one subject leaves before the next arrives, since two centred
   * subjects crossing muddle the frame.
   */
  const shown = (id: ShotId) => {
    const next = ORDER[ORDER.indexOf(id) + 1]
    const inn = (at: number) => tween(frame, P + at + M.dissolve * 0.5, M.dissolve, 'enter')
    const out = next ? tween(frame, P + M.shots[next], M.dissolve * 0.6, 'exit') : 0
    return id === 'button' ? Math.max(1 - out, inn(M.shots.home)) : inn(M.shots[id]) * (1 - out)
  }

  const saved = useRef(new Deferred())
  useAction(P + M.button.resolve, () => saved.current.resolve())

  // Made once: the camera re-renders the scene every frame, and a part re-rendered mid-move would re-measure.
  const subjects = useMemo<Record<Exclude<ShotId, 'home' | 'dialog' | 'toasts'>, ReactNode>>(
    () => ({
      button: (
        <AsyncButton size="lg" onAction={() => saved.current.promise} pendingLabel="Saving…" successLabel="Saved" tabIndex={-1}>
          Save changes
        </AsyncButton>
      ),
      tabs: <TabsShot />,
      toggle: <ToggleShot />,
      list: <ListCard at={[M.list.sort]} />,
      split: <Split vertical={stacked} />,
    }),
    [stacked],
  )

  const find = (selector: string, dx = 0.5, dy = 0.5) => (): Point | null => {
    const el = root.current?.querySelector(selector)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width * dx, y: r.top + r.height * dy }
  }

  return (
    <div ref={root} className="absolute inset-0">
      <Backdrop grid={0.7} glow={0.3} glowAt={{ x: 50, y: 50 }} />
      {(Object.keys(subjects) as (keyof typeof subjects)[]).map((id) => (
        <Shot key={id} id={id} show={shown(id)} scale={zoom[id]} width={width} height={height}>
          {subjects[id]}
        </Shot>
      ))}
      <DialogShot open={[P + M.dialog.open, P + M.dialog.close]} zoom={zoom.dialog} />
      <ToastShot zoom={zoom.toasts} height={height} />
      <SplitLabels show={shown('split')} vertical={stacked} small={format.tile} scale={zoom.split} width={width} height={height} />
      <Cursor
        start={{ x: width * 0.72, y: height + 40 }}
        size={() => zoom.button * 0.62}
        show={[P + M.button.reach - 2, P + M.button.away + 12]}
        moves={[
          { at: P + M.button.reach, to: find('[data-shot=button] button', 0.7, 0.62), frames: M.button.frames, press: 'click', after: 2 },
          { at: P + M.button.away, to: { x: width * 0.78, y: height + 60 }, frames: 30 },
        ]}
      />
    </div>
  )
}

/** One close-up: the subject at its real size, centred, under a camera that magnifies it about the stage's centre. */
function Shot({ id, show, scale, width, height, children }: { id: string; show: number; scale: number; width: number; height: number; children: ReactNode }) {
  const cx = width / 2
  const cy = height / 2
  return (
    <div
      data-shot={id}
      aria-hidden={show <= 0 || undefined}
      className="absolute inset-0"
      style={{ opacity: show, visibility: show > 0 ? 'visible' : 'hidden', transform: `translateY(${(1 - Math.min(1, show)) * 6}px)` }}
    >
      <Camera shot={{ scale, x: cx * (1 - scale), y: cy * (1 - scale), originX: 0, originY: 0 }}>
        <div className="absolute inset-0 grid place-items-center">{children}</div>
      </Camera>
    </div>
  )
}

/* ── The subjects ──────────────────────────────────────────────────────── */

const TABS = ['General', 'Security', 'Members', 'Billing']

/** Underline tabs: General, then Security, then Billing; the indicator glides to each. */
function TabsShot() {
  const value = useFrameValue((f) => ['General', 'Security', 'Billing'][M.tabs.glides.filter((at) => f >= P + at).length]!)
  return (
    <Tabs value={value.toLowerCase()}>
      <TabsList>
        {TABS.map((label) => (
          <TabsTrigger key={label} value={label.toLowerCase()} tabIndex={-1}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

/** A settings row whose switch flips on. */
function ToggleShot() {
  const on = useFrameValue((f) => f >= P + M.toggle.flip)
  return (
    <div className="flex w-[360px] items-center justify-between gap-6 rounded-xl border border-line bg-surface px-4 py-3.5 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <span className="text-ui font-medium text-fg">Require two-factor</span>
        <span className="text-ui-sm text-fg-muted">For everyone, at next sign-in.</span>
      </div>
      <Switch checked={on} tabIndex={-1} aria-label="Require two-factor" />
    </div>
  )
}

/** The dialog, opened and closed by the frame. It portals to the page, so it is zoomed to the shot's scale. */
function DialogShot({ open: [from, to], zoom }: { open: [number, number]; zoom: number }) {
  const open = useFrameValue((f) => f >= from && f < to)
  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--loop-dialog-zoom', String(zoom))
  }, [zoom])
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} initialFocus={false} finalFocus={false}>
        <DialogHeader>
          <DialogTitle>Invite to Northwind</DialogTitle>
          <DialogDescription>They can see every project in the workspace.</DialogDescription>
        </DialogHeader>
        <Input defaultValue="mira@northwind.dev" aria-label="Email" tabIndex={-1} />
        <DialogFooter>
          <Button variant="ghost" tabIndex={-1}>
            Cancel
          </Button>
          <Button tabIndex={-1}>Send invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** The loop's own Toaster, centred and zoomed to the shot, fed three notifications that stack, then dismissed. */
function ToastShot({ zoom, height }: { zoom: number; height: number }) {
  useLayoutEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--loop-toast-zoom', String(zoom))
    // The stack's front toast sits a little under the middle of the frame.
    root.setProperty('--loop-toast-bottom', `${(height * 0.36) / zoom}px`)
  }, [zoom, height])
  useAction(P + M.toasts.at[0]!, () => toast.success('Changes saved', { description: 'Security settings are up to date.' }))
  useAction(P + M.toasts.at[1]!, () => toast('Invite sent', { description: 'Mira can join Northwind.' }))
  useAction(P + M.toasts.at[2]!, () => toast.info('Backup ready', { description: 'Stored somewhere safe.' }))
  useAction(P + M.toasts.dismiss, () => toast.dismiss())
  return <Toaster position="bottom-center" limit={3} timeout={60_000} className="bottom-(--loop-toast-bottom) [zoom:var(--loop-toast-zoom)]" />
}

/* ── The list, and the split ───────────────────────────────────────────── */

interface Task {
  id: string
  title: string
  priority: 'High' | 'Medium' | 'Low'
  /** Newest first. */
  age: number
}

const TASKS: Task[] = [
  { id: 'docs', title: 'Write the migration guide', priority: 'Low', age: 0 },
  { id: 'tokens', title: 'Tune the motion tokens', priority: 'High', age: 1 },
  { id: 'icons', title: 'Redraw the icon set', priority: 'Medium', age: 2 },
  { id: 'launch', title: 'Plan the launch', priority: 'High', age: 3 },
]
const RANK = { High: 0, Medium: 1, Low: 2 }
const BY = {
  newest: [...TASKS].sort((a, b) => a.age - b.age),
  priority: [...TASKS].sort((a, b) => RANK[a.priority] - RANK[b.priority] || a.age - b.age),
}

/** Tasks with a sort control: at each frame in `at` the sort flips, the pill glides and the rows glide to their new places. */
function ListCard({ at }: { at: number[] }) {
  const sort = useFrameValue((f) => (at.filter((a) => f >= P + a).length % 2 === 1 ? 'priority' : 'newest'))
  return (
    <div className="flex w-[380px] flex-col gap-2 rounded-xl border border-line bg-surface p-2 shadow-sm">
      <div className="flex items-center justify-between ps-2">
        <span className="text-ui font-semibold text-fg">Tasks</span>
        <ToggleGroup variant="segmented" size="sm" value={[sort]} aria-label="Sort">
          <ToggleGroupItem value="newest" tabIndex={-1}>
            Newest
          </ToggleGroupItem>
          <ToggleGroupItem value="priority" tabIndex={-1}>
            Priority
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <PresenceList className="flex flex-col">
        {BY[sort].map((task) => (
          <PresenceItem key={task.id} className="flex items-center gap-3 rounded-lg bg-surface px-2.5 py-2">
            <CircleDashedIcon size={16} strokeWidth={1.6} className="text-fg-muted" trigger="none" />
            <span className="min-w-0 flex-1 truncate text-ui text-fg">{task.title}</span>
            <Badge variant={task.priority === 'High' ? 'default' : 'secondary'}>{task.priority}</Badge>
          </PresenceItem>
        ))}
      </PresenceList>
    </div>
  )
}

/** The same list twice, sorted at the same frames: with motion, and under reduced motion. */
function Split({ vertical }: { vertical: boolean }) {
  const sorts = [M.list.sort, ...M.split.sorts]
  return (
    <div className={vertical ? 'flex flex-col gap-24' : 'flex gap-16'}>
      <ListCard at={sorts} />
      <YoujProvider reducedMotion="always">
        <ListCard at={sorts} />
      </YoujProvider>
    </div>
  )
}

/** Over each half of the split: which it is. In page space, so they read at one size (a size down on the tile strip, where the halves stack tight). */
function SplitLabels({ show, vertical, small, scale, width, height }: { show: number; vertical: boolean; small: boolean; scale: number; width: number; height: number }) {
  if (show <= 0) return null
  // The cards are 380 wide and about 212 tall, 64 apart (96 stacked), centred on the stage, magnified by `scale`.
  const card = { w: 380 * scale, h: 212 * scale, gap: (vertical ? 96 : 64) * scale }
  const labels = [
    { text: 'Motion', x: vertical ? width / 2 : width / 2 - card.gap / 2 - card.w / 2, y: vertical ? height / 2 - card.gap / 2 - card.h : height / 2 - card.h / 2 },
    { text: 'Reduced motion', x: vertical ? width / 2 : width / 2 + card.gap / 2 + card.w / 2, y: vertical ? height / 2 + card.gap / 2 : height / 2 - card.h / 2 },
  ]
  return (
    <>
      {labels.map((label, i) => (
        <p
          key={label.text}
          className={`absolute flex items-center gap-3 font-mono leading-none tracking-[0.1em] whitespace-nowrap text-fg-muted uppercase ${small ? 'text-[16px]' : 'text-[22px]'}`}
          style={{ left: label.x, top: label.y - (small ? 28 : 44), opacity: show, transform: 'translateX(-50%)' }}
        >
          <span aria-hidden className={`size-2 rounded-[1.5px] ${i === 0 ? 'bg-accent' : 'bg-fg-subtle'}`} />
          {label.text}
        </p>
      ))}
    </>
  )
}
