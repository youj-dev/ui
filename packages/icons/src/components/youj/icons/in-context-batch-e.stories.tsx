import { useState, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { cn } from '@youj/core'
import {
  ApertureIcon,
  ArchiveRestoreIcon,
  AudioLinesIcon,
  BanknoteIcon,
  BatteryChargingIcon,
  BellDotIcon,
  BotIcon,
  BrightnessIcon,
  CalendarClockIcon,
  CalendarPlusIcon,
  CaptionsIcon,
  CarIcon,
  ChartSplineIcon,
  CheckCheckIcon,
  CircleAlertIcon,
  CircleArrowUpIcon,
  CircleDashedIcon,
  CircleHelpIcon,
  CircleXIcon,
  ClapperboardIcon,
  CloudOffIcon,
  CloudSnowIcon,
  CoffeeIcon,
  ColumnsIcon,
  CookieIcon,
  CopyIcon,
  CropIcon,
  CrownIcon,
  DiscIcon,
  DoorIcon,
  DropletIcon,
  EraserIcon,
  EyeClosedIcon,
  FlameIcon,
  FlaskIcon,
  FlipHorizontalIcon,
  FolderPlusIcon,
  FunnelIcon,
  GemIcon,
  GitCompareIcon,
  GitForkIcon,
  GridIcon,
  HammerIcon,
  HardDriveIcon,
  HashIcon,
  HighlighterIcon,
  IndentIcon,
  LayoutListIcon,
  LeafIcon,
  ListCollapseIcon,
  LogsIcon,
  MegaphoneIcon,
  MessageDotsIcon,
  MessageSparkleIcon,
  MicIcon,
  MinusIcon,
  MoonIcon,
  MousePointerIcon,
  MoveIcon,
  PaletteIcon,
  PanelBottomIcon,
  PartyPopperIcon,
  PictureInPictureIcon,
  PipetteIcon,
  PlaneIcon,
  RadarIcon,
  RecordIcon,
  RefreshIcon,
  RowsIcon,
  RssIcon,
  RulerIcon,
  ScanBarcodeIcon,
  ScissorsIcon,
  ScreenShareIcon,
  SignalIcon,
  SignatureIcon,
  SirenIcon,
  SmilePlusIcon,
  SortIcon,
  SparkleIcon,
  SplineIcon,
  SproutIcon,
  SquareCheckIcon,
  SunIcon,
  SunriseIcon,
  TargetIcon,
  TextSparkleIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  TicketIcon,
  ToggleIcon,
  UnlinkIcon,
  VerifiedIcon,
  VideoIcon,
  WandIcon,
  WavesIcon,
  WifiOffIcon,
  WorkflowIcon,
  WrapTextIcon,
  WrenchIcon,
  XIcon,
  ZapIcon,
  ZoomInIcon,
  type YoujIconComponent,
} from './index'
import { Button, ease, focusRing, IconButton, Stage, useLater } from './story-kit'

const meta = {
  title: 'Icons/In context/Status, layout, media & AI',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The fifth batch inside real product UI. Rows, cards and buttons are `data-yj-trigger` groups or interactive parents, so hovering or keyboard-focusing them plays their icon. State icons follow the state of their control: send folds into stop while a reply streams, captions wipe on, a pending issue closes into done, a toggle knob stretches across, a boarding pass tears at the stub. Switch the toolbar to "Motion: reduced" and every state still reads, instantly.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/* ── Shared UI ───────────────────────────────────────────────────────────── */


function Panel({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <section aria-label={label} className={cn('rounded-2xl border border-line bg-surface shadow-sm', className)}>
      {children}
    </section>
  )
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-lg bg-well p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn('h-7 rounded-md px-2.5 text-xs font-medium', ease, focusRing, value === o.value ? 'bg-key text-fg shadow-sm' : 'text-fg-muted hover:text-fg')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Chip({ Icon, children }: { Icon: YoujIconComponent; children: ReactNode }) {
  return (
    <span data-yj-trigger className="inline-flex h-6 items-center gap-1.5 rounded-full border border-line bg-well px-2 text-[11px] font-medium text-fg-muted">
      <Icon size={13} strokeWidth={1.75} />
      {children}
    </span>
  )
}

/* ── Assistant ───────────────────────────────────────────────────────────── */

const REPLY = 'Three things stood out in last week’s sign-ups: trials from the pricing page doubled, the Teams plan converted best, and drop-off moved from step 2 to step 3 of onboarding.'

function AssistantDemo() {
  const later = useLater()
  const [awake, setAwake] = useState(true)
  const [smart, setSmart] = useState(true)
  const [voice, setVoice] = useState(false)
  const [phase, setPhase] = useState<'thinking' | 'streaming' | 'done'>('done')
  const [linear, setLinear] = useState(false)
  const [draft, setDraft] = useState('')
  const [rating, setRating] = useState<'up' | 'down' | null>(null)
  const generating = phase === 'thinking' || phase === 'streaming'

  const send = () => {
    if (generating) return setPhase('done')
    setDraft('')
    setRating(null)
    setPhase('thinking')
    later(() => {
      setPhase('streaming')
      later(() => setPhase('done'), 2)
    }, 1.5)
  }

  return (
    <Stage>
      <Panel label="Assistant" className="flex w-full max-w-[560px] flex-col">
        <header className="flex items-center gap-3 border-b border-line px-4 py-3">
          <button
            type="button"
            role="switch"
            aria-checked={awake}
            aria-label="Assistant online"
            onClick={() => setAwake((a) => !a)}
            className={cn('flex size-9 items-center justify-center rounded-lg bg-well', ease, focusRing, awake ? 'text-accent' : 'text-fg-muted')}
          >
            <BotIcon size={20} active={awake} />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-fg">Insights assistant</h2>
            <p className="text-xs text-fg-muted">{awake ? 'Online · reads your analytics workspace' : 'Paused · wake it to ask questions'}</p>
          </div>
          <Chip Icon={ZapIcon}>Fast</Chip>
          <button
            type="button"
            aria-pressed={smart}
            onClick={() => setSmart((s) => !s)}
            className={cn('inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium', ease, focusRing, smart ? 'bg-accent-subtle text-accent' : 'text-fg-muted hover:bg-hover')}
          >
            <SparkleIcon size={15} active={smart} />
            Smart replies
          </button>
          <IconButton label="Close assistant" className="-me-1 size-8">
            <XIcon size={16} />
          </IconButton>
        </header>

        <ol className="flex flex-col gap-4 px-4 py-5" aria-live="polite">
          <li className="flex flex-col items-end gap-1">
            <p className="max-w-[80%] rounded-2xl rounded-br-md bg-well px-3.5 py-2.5 text-sm text-fg">What changed in sign-ups last week?</p>
            <span className="flex items-center gap-1 text-[11px] text-fg-muted">
              <CheckCheckIcon size={14} active={phase !== 'thinking'} aria-label={phase !== 'thinking' ? 'Read' : 'Sent'} />
              09:41
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-well text-fg-muted">
              <MessageDotsIcon size={15} active={phase === 'thinking'} />
            </span>
            <div className="min-w-0 flex-1">
              {phase === 'thinking' ? (
                <p className="pt-1 text-sm text-fg-muted">Reading 1,284 sign-up events…</p>
              ) : (
                <p className="text-sm leading-relaxed text-fg">{phase === 'streaming' ? `${REPLY.slice(0, 72)}…` : REPLY}</p>
              )}
              {phase === 'done' && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
                  <svg viewBox="0 0 120 32" preserveAspectRatio="none" className="h-8 min-w-0 flex-1 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Sign-ups, last 7 days, rising">
                    <path vectorEffect="non-scaling-stroke" d={linear ? 'M2 26 L22 20 L42 23 L62 14 L82 16 L102 7 L118 5' : 'M2 26 C12 23 14 20 22 20 C30 20 34 24 42 23 C52 22 54 14 62 14 C70 14 74 17 82 16 C92 15 94 8 102 7 C110 6 114 5 118 5'} />
                  </svg>
                  <Button className="h-8 px-2.5 text-xs" aria-pressed={linear} onClick={() => setLinear((l) => !l)}>
                    <ChartSplineIcon size={15} active={linear} />
                    {linear ? 'Linear' : 'Smooth'}
                  </Button>
                </div>
              )}
              {phase === 'done' && (
                <div className="mt-2 flex items-center gap-0.5 text-fg-muted">
                  <IconButton label="Copy answer" className="size-8">
                    <CopyIcon size={15} />
                  </IconButton>
                  <IconButton label="Good answer" aria-pressed={rating === 'up'} onClick={() => setRating((r) => (r === 'up' ? null : 'up'))} className="size-8">
                    <ThumbsUpIcon size={15} active={rating === 'up'} />
                  </IconButton>
                  <IconButton label="Bad answer" aria-pressed={rating === 'down'} onClick={() => setRating((r) => (r === 'down' ? null : 'down'))} className="size-8">
                    <ThumbsDownIcon size={15} active={rating === 'down'} />
                  </IconButton>
                  <IconButton label="Regenerate" onClick={send} className="size-8">
                    <RefreshIcon size={15} />
                  </IconButton>
                  {rating === 'down' && <span className="ms-2 text-xs text-fg-muted">Thanks, we’ll use this to improve answers.</span>}
                </div>
              )}
            </div>
          </li>
        </ol>

        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {[
            { Icon: MessageSparkleIcon, label: 'Ask about churn' },
            { Icon: TextSparkleIcon, label: 'Rewrite as a summary' },
            { Icon: WandIcon, label: 'Fix my query' },
          ].map(({ Icon, label }) => (
            <Button key={label} className="h-8 rounded-full px-3 text-xs" onClick={() => setDraft(label)}>
              <Icon size={14} />
              {label}
            </Button>
          ))}
        </div>

        <form
          className="m-3 mt-0 flex items-end gap-2 rounded-xl border border-line bg-canvas p-2 focus-within:ring-2 focus-within:ring-accent"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <label className="sr-only" htmlFor="assistant-draft">
            Message
          </label>
          <textarea
            id="assistant-draft"
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={awake ? 'Ask anything about your data' : 'The assistant is paused'}
            disabled={!awake}
            className="min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-fg outline-none placeholder:text-fg-muted disabled:opacity-60"
          />
          <IconButton label={voice ? 'Stop voice mode' : 'Voice mode'} aria-pressed={voice} onClick={() => setVoice((v) => !v)} className={cn('size-9', voice && 'text-accent')}>
            {voice ? <AudioLinesIcon size={18} active /> : <MicIcon size={18} />}
          </IconButton>
          <button
            type="submit"
            aria-label={generating ? 'Stop generating' : 'Send'}
            disabled={!awake || (!generating && !draft.trim() && phase !== 'done')}
            className={cn('flex size-9 items-center justify-center rounded-full text-fg disabled:opacity-40', ease, focusRing, 'hover:bg-hover')}
          >
            <CircleArrowUpIcon size={22} active={generating} />
          </button>
        </form>
      </Panel>
    </Stage>
  )
}

export const Assistant: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'An AI assistant panel. Send folds into stop while the reply streams, the avatar’s lines draw into typing dots while it thinks, read receipts gain their second tick. The bot wakes and sleeps, smart replies switch on with a sparkle, voice mode speaks in a waveform, and a thumbs-down fills when you rate an answer.',
      },
    },
  },
  render: () => <AssistantDemo />,
}

/* ── Meeting ─────────────────────────────────────────────────────────────── */

const PEOPLE = ['Ana Sousa', 'Marco Ruiz', 'Priya Nair', 'Jonas Weber']

function MeetingDemo() {
  const [sharing, setSharing] = useState(false)
  const [captions, setCaptions] = useState(true)
  const [recording, setRecording] = useState(false)
  const [pip, setPip] = useState(false)
  const [reacted, setReacted] = useState(false)
  const [view, setView] = useState<'list' | 'grid'>('grid')
  const [muted, setMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)

  return (
    <Stage>
      <div className="flex w-full max-w-[900px] flex-col gap-3">
        <div className="relative flex aspect-[16/8] items-end overflow-hidden rounded-2xl border border-line bg-well p-4">
          <div className="absolute start-4 top-4 flex items-center gap-2">
            <span data-yj-trigger className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-surface px-2 text-xs font-medium text-fg">
              <HashIcon size={14} />
              design-review
            </span>
            {recording && (
              <span role="status" className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-surface px-2 text-xs font-medium text-danger">
                <RecordIcon size={14} active /> Recording
              </span>
            )}
            <span className={cn('inline-flex h-7 items-center gap-1.5 rounded-lg bg-surface px-2 text-xs font-medium', sharing && recording ? 'text-warning' : 'text-fg-muted')}>
              <SignalIcon size={14} active={sharing && recording} />
              {sharing && recording ? 'Connection unstable' : 'Connection good'}
            </span>
          </div>
          <div className={cn('absolute end-4 top-4 grid gap-2', view === 'grid' ? 'grid-cols-2' : 'grid-cols-1')} aria-label="Participants" role="list">
            {PEOPLE.slice(0, view === 'grid' ? 4 : 3).map((p) => (
              <span role="listitem" key={p} className={cn('flex items-center justify-center rounded-lg bg-surface text-[11px] text-fg-muted', view === 'grid' ? 'size-16' : 'h-8 w-40 justify-start px-2.5')}>
                {view === 'grid' ? p.split(' ').map((w) => w[0]).join('') : p}
              </span>
            ))}
          </div>
          {sharing && (
            <p className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center gap-2 text-sm text-fg-muted">
              <MousePointerIcon size={16} trigger="loop" /> You’re presenting “Checkout v3 flows”
            </p>
          )}
          {captions && <p className="relative mx-auto rounded-md bg-surface px-3 py-1.5 text-sm text-fg">Priya: so the stepper stays, but the summary moves up.</p>}
        </div>

        <Panel label="Call controls" className="flex flex-wrap items-center justify-center gap-1 rounded-2xl p-2 md:justify-between">
          <div className="flex items-center gap-1">
            <IconButton label="Mute" aria-pressed={muted} onClick={() => setMuted((m) => !m)}>
              <MicIcon size={18} active={muted} />
            </IconButton>
            <IconButton label="Camera off" aria-pressed={camOff} onClick={() => setCamOff((c) => !c)}>
              <VideoIcon size={18} active={camOff} />
            </IconButton>
          </div>
          <div className="flex items-center gap-1">
            <Button variant={sharing ? 'primary' : 'ghost'} onClick={() => setSharing((s) => !s)} className="h-9">
              <ScreenShareIcon size={18} active={sharing} />
              {sharing ? 'Stop sharing' : 'Share screen'}
            </Button>
            <IconButton label="Captions" aria-pressed={captions} onClick={() => setCaptions((c) => !c)} className={cn(captions && 'text-fg')}>
              <CaptionsIcon size={18} active={captions} />
            </IconButton>
            <IconButton label={recording ? 'Stop recording' : 'Record'} onClick={() => setRecording((r) => !r)} className={cn(recording && 'text-danger hover:text-danger')}>
              <RecordIcon size={18} active={recording} />
            </IconButton>
            <IconButton label="React" aria-pressed={reacted} onClick={() => setReacted((r) => !r)} className={cn(reacted && 'text-fg')}>
              <SmilePlusIcon size={18} active={reacted} />
            </IconButton>
            <IconButton label="Celebrate">
              <PartyPopperIcon size={18} />
            </IconButton>
            <IconButton label="Picture in picture" aria-pressed={pip} onClick={() => setPip((p) => !p)}>
              <PictureInPictureIcon size={18} active={pip} />
            </IconButton>
          </div>
          <div className="flex items-center gap-2">
            <IconButton label="Announce to everyone">
              <MegaphoneIcon size={18} />
            </IconButton>
            <IconButton label="Recordings">
              <DiscIcon size={18} />
            </IconButton>
            <IconButton label={view === 'grid' ? 'List view' : 'Grid view'} onClick={() => setView((v) => (v === 'grid' ? 'list' : 'grid'))}>
              <LayoutListIcon size={18} active={view === 'grid'} />
            </IconButton>
          </div>
        </Panel>
      </div>
    </Stage>
  )
}

export const Meeting: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A video call. Share screen folds its arrow into a stop ×, captions wipe on as cut-outs, record squares off into stop, picture in picture shrinks the video into the corner, a reaction closes the smile’s ring into a grin and the view toggle inflates list lines into tiles.',
      },
    },
  },
  render: () => <MeetingDemo />,
}

/* ── Triage ──────────────────────────────────────────────────────────────── */

interface Issue {
  id: string
  title: string
  done: boolean
  kind: 'bug' | 'question' | 'incident' | 'task'
  subtasks?: string[]
}

const ISSUES: Issue[] = [
  { id: 'KIN-412', title: 'Checkout total flickers after applying a coupon', done: false, kind: 'bug' },
  { id: 'KIN-409', title: 'Payments API returning 502 in eu-west', done: false, kind: 'incident' },
  { id: 'KIN-398', title: 'Should trials include the Teams add-on?', done: false, kind: 'question' },
  { id: 'KIN-391', title: 'Ship the onboarding checklist', done: true, kind: 'task', subtasks: ['Welcome step', 'Invite teammates', 'Connect a data source'] },
]
const KIND: Record<Issue['kind'], YoujIconComponent> = { bug: CircleXIcon, question: CircleHelpIcon, incident: CircleAlertIcon, task: SquareCheckIcon }

function TriageDemo() {
  const [done, setDone] = useState<Record<string, boolean>>(Object.fromEntries(ISSUES.map((i) => [i.id, i.done])))
  const [descending, setDescending] = useState(false)
  const [filtered, setFiltered] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [compact, setCompact] = useState(false)
  const [unread, setUnread] = useState(true)
  const [archived, setArchived] = useState(false)
  const [linked, setLinked] = useState(true)
  const [subtasks, setSubtasks] = useState([true, true, false])
  const shown = ISSUES.filter((i) => !filtered || !done[i.id]).sort((a, b) => (descending ? -1 : 1) * a.id.localeCompare(b.id))
  const allDone = ISSUES.every((i) => done[i.id])

  return (
    <Stage>
      <Panel label="Issues" className="w-full max-w-[680px] overflow-hidden">
        <header className="flex flex-wrap items-center gap-1 border-b border-line px-3 py-2">
          <h2 className="me-auto ps-1 text-sm font-semibold text-fg">Sprint 24 · Checkout</h2>
          <IconButton label={descending ? 'Sort ascending' : 'Sort descending'} onClick={() => setDescending((d) => !d)}>
            <SortIcon size={17} active={descending} />
          </IconButton>
          <IconButton label="Hide done" aria-pressed={filtered} onClick={() => setFiltered((f) => !f)} className={cn(filtered && 'text-accent hover:text-accent')}>
            <FunnelIcon size={17} active={filtered} />
          </IconButton>
          <IconButton label="Compact rows" aria-pressed={compact} onClick={() => setCompact((c) => !c)}>
            <RowsIcon size={17} active={compact} />
          </IconButton>
          <IconButton label={unread ? 'Notifications, 2 unread' : 'Notifications'} onClick={() => setUnread(false)}>
            <BellDotIcon size={17} active={unread} />
          </IconButton>
        </header>

        <ul>
          {shown.map((issue) => {
            const Kind = KIND[issue.kind]
            const isDone = Boolean(done[issue.id])
            return (
              <li key={issue.id} className="border-b border-line last:border-b-0">
                <div data-yj-trigger className={cn('flex items-center gap-3 px-4 hover:bg-hover', ease, compact ? 'py-1.5' : 'py-3')}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isDone}
                    aria-label={`${issue.title}: ${isDone ? 'done' : 'to do'}`}
                    onClick={() => setDone((d) => ({ ...d, [issue.id]: !d[issue.id] }))}
                    className={cn('flex size-7 shrink-0 items-center justify-center rounded-md', ease, focusRing, isDone ? 'text-success' : 'text-fg-muted hover:text-fg')}
                  >
                    <CircleDashedIcon size={18} active={isDone} />
                  </button>
                  <span className="font-mono text-[11px] text-fg-muted">{issue.id}</span>
                  <p className={cn('min-w-0 flex-1 truncate text-sm', isDone ? 'text-fg-muted line-through decoration-fg-subtle' : 'text-fg')}>{issue.title}</p>
                  <Kind
                    size={16}
                    active={issue.kind === 'incident' || issue.kind === 'task' ? isDone : undefined}
                    aria-label={issue.kind}
                    className={cn('shrink-0', issue.kind === 'incident' && !isDone ? 'text-danger' : 'text-fg-muted')}
                  />
                  {issue.subtasks && (
                    <IconButton label={collapsed ? 'Expand subtasks' : 'Collapse subtasks'} onClick={() => setCollapsed((c) => !c)} className="-me-2 size-8">
                      <ListCollapseIcon size={16} active={collapsed} />
                    </IconButton>
                  )}
                </div>
                {issue.subtasks && !collapsed && (
                  <ul className="pb-2 ps-14">
                    {issue.subtasks.map((s, i) => (
                      <li key={s}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={subtasks[i]}
                          onClick={() => setSubtasks((all) => all.map((v, j) => (j === i ? !v : v)))}
                          className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1 text-start text-sm', ease, focusRing, subtasks[i] ? 'text-fg-muted' : 'text-fg', 'hover:bg-hover')}
                        >
                          <SquareCheckIcon size={16} active={subtasks[i]} />
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
          {shown.length === 0 && <li className="px-4 py-8 text-center text-sm text-fg-muted">Everything in this sprint is done.</li>}
        </ul>

        <footer className="flex flex-wrap items-center gap-2 border-t border-line bg-well px-3 py-2.5">
          <span className={cn('inline-flex h-6 items-center gap-1.5 rounded-full border border-line bg-well px-2 text-[11px] font-medium', allDone ? 'text-success' : 'text-fg-muted')}>
            <TargetIcon size={13} strokeWidth={1.75} active={allDone} />
            {allDone ? 'Sprint goal hit' : 'Sprint goal: 4 issues'}
          </span>
          <Chip Icon={SirenIcon}>On call: Ana</Chip>
          <Chip Icon={GitForkIcon}>feat/checkout-v3</Chip>
          <Chip Icon={GitCompareIcon}>12 files</Chip>
          <Chip Icon={WorkflowIcon}>CI passed</Chip>
          <Chip Icon={FlaskIcon}>2 experiments</Chip>
          <Chip Icon={HammerIcon}>Build 1.8.2</Chip>
          <Chip Icon={LogsIcon}>Logs</Chip>
          <div className="ms-auto flex items-center gap-1">
            <IconButton label={linked ? 'Unlink from epic' : 'Link to epic'} aria-pressed={!linked} onClick={() => setLinked((l) => !l)} className="size-8">
              <UnlinkIcon size={16} active={!linked} />
            </IconButton>
            <IconButton label="New folder">
              <FolderPlusIcon size={16} />
            </IconButton>
            <Button className="h-8 px-2.5 text-xs" onClick={() => setArchived((a) => !a)}>
              <ArchiveRestoreIcon size={15} active={archived} />
              {archived ? 'Restore sprint' : 'Archive sprint'}
            </Button>
          </div>
        </footer>
      </Panel>
    </Stage>
  )
}

export const Triage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'An issue list. Each status closes its dashed ring into a check, subtasks open their box’s corner for the check, the sort arrow turns over, the funnel fills, rows go compact, the thread folds into its parent and the bell drops its badge once read. Archive turns its arrow round to restore.',
      },
    },
  },
  render: () => <TriageDemo />,
}

/* ── Canvas ──────────────────────────────────────────────────────────────── */

const TOOLS: { Icon: YoujIconComponent; label: string }[] = [
  { Icon: MousePointerIcon, label: 'Select' },
  { Icon: MoveIcon, label: 'Move' },
  { Icon: CropIcon, label: 'Crop' },
  { Icon: ScissorsIcon, label: 'Cut' },
  { Icon: SplineIcon, label: 'Pen' },
  { Icon: HighlighterIcon, label: 'Highlight' },
  { Icon: EraserIcon, label: 'Erase' },
  { Icon: PipetteIcon, label: 'Pick color' },
  { Icon: PaletteIcon, label: 'Colors' },
  { Icon: RulerIcon, label: 'Measure' },
  { Icon: SignatureIcon, label: 'Sign' },
]

function CanvasDemo() {
  const [tool, setTool] = useState('Select')
  const [flipped, setFlipped] = useState(false)
  const [grid, setGrid] = useState(true)
  const [three, setThree] = useState(false)
  const [indented, setIndented] = useState(false)
  const [wrap, setWrap] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [panel, setPanel] = useState(true)
  const [narrow, setNarrow] = useState(false)

  return (
    <Stage>
      <Panel label="Canvas editor" className="flex w-full max-w-[980px] flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 border-b border-line p-1.5">
          <div role="toolbar" aria-label="Tools" className="flex flex-wrap items-center gap-0.5">
            {TOOLS.map(({ Icon, label }) => (
              <IconButton key={label} label={label} aria-pressed={tool === label} onClick={() => setTool(label)} className={cn('size-8', tool === label && 'bg-selected text-fg')}>
                <Icon size={16} />
              </IconButton>
            ))}
          </div>
          <span className="mx-1 h-5 w-px bg-line" aria-hidden />
          <IconButton label="Flip horizontally" aria-pressed={flipped} onClick={() => setFlipped((f) => !f)} className="size-8">
            <FlipHorizontalIcon size={16} active={flipped} />
          </IconButton>
          <IconButton label="Show grid" aria-pressed={grid} onClick={() => setGrid((g) => !g)} className="size-8">
            <GridIcon size={16} active={grid} />
          </IconButton>
          <IconButton label="Three columns" aria-pressed={three} onClick={() => setThree((t) => !t)} className="size-8">
            <ColumnsIcon size={16} active={three} />
          </IconButton>
          <IconButton label="Narrow aperture" aria-pressed={narrow} onClick={() => setNarrow((n) => !n)} className="size-8">
            <ApertureIcon size={16} active={narrow} />
          </IconButton>
          <div className="ms-auto flex items-center gap-0.5">
            <IconButton label="Zoom out" onClick={() => setZoom((z) => Math.max(25, z - 25))} className="size-8">
              <MinusIcon size={16} />
            </IconButton>
            <span className="w-12 text-center font-mono text-xs text-fg tabular-nums" aria-live="polite">
              {zoom}%
            </span>
            <IconButton label={zoom >= 200 ? 'Zoom out' : 'Zoom in'} onClick={() => setZoom((z) => (z >= 200 ? 100 : z + 25))} className="size-8">
              <ZoomInIcon size={16} active={zoom >= 200} />
            </IconButton>
            <IconButton label="Bottom panel" aria-pressed={panel} onClick={() => setPanel((p) => !p)} className="size-8">
              <PanelBottomIcon size={16} active={!panel} />
            </IconButton>
          </div>
        </div>
        <div className="grid min-h-[300px] gap-4 bg-canvas p-6 md:grid-cols-[minmax(0,1fr)_240px]">
          <div
            role="img"
            aria-label={`Artboard, ${three ? 'three' : 'two'} columns${grid ? ', grid shown' : ''}${flipped ? ', flipped' : ''}`}
            className={cn('relative grid gap-3 rounded-xl border border-line bg-surface p-5', three ? 'grid-cols-3' : 'grid-cols-2', grid && 'bg-[linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] bg-[size:24px_24px]')}
          >
            {Array.from({ length: three ? 3 : 2 }, (_, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-lg bg-well p-3">
                <span className={cn('h-16 rounded-md bg-line-strong transition-transform duration-(--yj-duration-slow) ease-emphasized', flipped && '-scale-x-100')} />
                <span className="h-2 w-3/4 rounded-full bg-line-strong" />
                <span className="h-2 w-1/2 rounded-full bg-line" />
              </div>
            ))}
            <span className="absolute end-3 bottom-3 inline-flex items-center gap-1.5 rounded-md bg-surface px-2 py-1 text-[11px] text-fg-muted">
              <ClapperboardIcon size={13} trigger="mount" /> Frame 3 of 8
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-fg-muted">Text</p>
            <div className="flex gap-1">
              <Button className="h-8 flex-1 justify-center px-2 text-xs" aria-pressed={indented} onClick={() => setIndented((i) => !i)}>
                <IndentIcon size={15} active={indented} />
                {indented ? 'Outdent' : 'Indent'}
              </Button>
              <Button className="h-8 flex-1 justify-center px-2 text-xs" aria-pressed={wrap} onClick={() => setWrap((w) => !w)}>
                <WrapTextIcon size={15} active={wrap} />
                Wrap
              </Button>
            </div>
            <p className={cn('rounded-lg bg-well px-3 py-2 text-xs leading-relaxed text-fg-muted', indented && 'ps-6', !wrap && 'truncate')}>
              Keep the summary above the fold on mobile; the stepper can collapse to a progress bar.
            </p>
          </div>
        </div>
        {panel && (
          <div className="flex items-center gap-3 border-t border-line px-4 py-2 font-mono text-[11px] text-fg-muted">
            <span className="text-fg">Layers</span> Hero · Summary · Stepper · Pay button
          </div>
        )}
      </Panel>
    </Stage>
  )
}

export const Canvas: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A canvas editor. Hover a tool to play it: the scissors snip, the highlighter lays down its line, the pipette drops a sample, the ruler reads off its marks. Flip mirrors the shape through its axis, the grid grows out of its crossings, a divider splits into three columns, the zoom plus folds into a minus at 200%, and the bottom panel’s divider folds into a chevron.',
      },
    },
  },
  render: () => <CanvasDemo />,
}

/* ── Settings ────────────────────────────────────────────────────────────── */

function Row({ Icon, title, detail, children }: { Icon: ReactNode; title: string; detail: ReactNode; children?: ReactNode }) {
  return (
    <div data-yj-trigger className="flex items-center gap-3 px-4 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-well text-fg-muted">{Icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-fg">{title}</p>
        <p className="truncate text-xs text-fg-muted">{detail}</p>
      </div>
      {children}
    </div>
  )
}

function SettingsDemo() {
  const later = useLater()
  const [nightShift, setNightShift] = useState(false)
  const [bright, setBright] = useState(false)
  const [online, setOnline] = useState(true)
  const [charging, setCharging] = useState(true)
  const [reveal, setReveal] = useState(false)
  const [verified, setVerified] = useState(false)
  const [checking, setChecking] = useState(false)
  const [cookies, setCookies] = useState(true)

  const verify = () => {
    if (verified) return setVerified(false)
    setChecking(true)
    later(() => {
      setChecking(false)
      setVerified(true)
    }, 1.5)
  }

  return (
    <Stage>
      <div className="flex w-full max-w-[720px] flex-col gap-4 md:flex-row md:items-start">
        <Panel label="Device" className="w-full divide-y divide-line md:max-w-[340px]">
          <Row Icon={<BrightnessIcon size={18} active={bright} />} title="Display" detail={bright ? 'Bright · 90%' : 'Dim · 35%'}>
            <Segmented
              label="Brightness"
              value={bright ? 'bright' : 'dim'}
              onChange={(v) => setBright(v === 'bright')}
              options={[
                { value: 'dim', label: 'Dim' },
                { value: 'bright', label: 'Bright' },
              ]}
            />
          </Row>
          <Row Icon={<MoonIcon size={18} />} title="Night Shift" detail={nightShift ? 'On · warmer colors until 07:00' : 'Warmer colors after sunset'}>
            {/* The icon is the switch: a compact on/off for dense settings lists. */}
            <button
              type="button"
              role="switch"
              aria-checked={nightShift}
              aria-label="Night Shift"
              onClick={() => setNightShift((n) => !n)}
              className={cn('flex h-8 items-center rounded-lg px-1', ease, focusRing, nightShift ? 'text-accent' : 'text-fg-muted hover:text-fg')}
            >
              <ToggleIcon size={30} active={nightShift} />
            </button>
          </Row>
          <Row Icon={<BatteryChargingIcon size={18} active={charging} />} title="Battery" detail={charging ? 'Charging · 68%, full by 14:20' : 'On battery · 68%, about 6 h left'}>
            <Button className="h-8 px-2.5 text-xs" onClick={() => setCharging((c) => !c)}>
              {charging ? 'Unplug' : 'Plug in'}
            </Button>
          </Row>
          <Row Icon={<WifiOffIcon size={18} active={online} />} title="Network" detail={online ? 'Studio 5G' : 'Offline · changes saved on this device'}>
            <Button className="h-8 px-2.5 text-xs" onClick={() => setOnline((o) => !o)}>
              {online ? 'Go offline' : 'Reconnect'}
            </Button>
          </Row>
          <Row Icon={<HardDriveIcon size={18} />} title="Storage" detail="212 GB of 512 GB used" />
          <Row Icon={<WrenchIcon size={18} />} title="Diagnostics" detail="Run a quick system check" />
        </Panel>

        <div className="flex w-full flex-col gap-4">
          <Panel label="Account" className="divide-y divide-line">
            <div className="flex items-center gap-3 px-4 py-3">
              <VerifiedIcon size={22} active={verified} className={verified ? 'text-accent' : 'text-fg-muted'} aria-label={verified ? 'Verified' : 'Not verified'} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-fg">northwind.studio</p>
                <p className="text-xs text-fg-muted">{verified ? 'Domain verified, badge shown on your profile' : checking ? 'Checking the DNS record…' : 'Add a TXT record to verify'}</p>
              </div>
              <Button className="h-8 px-2.5 text-xs disabled:pointer-events-none disabled:opacity-50" onClick={verify} disabled={checking} aria-busy={checking}>
                {verified ? 'Remove' : checking ? 'Checking…' : 'Verify'}
              </Button>
            </div>
            <div className="px-4 py-3">
              <label htmlFor="settings-password" className="text-xs font-medium text-fg-muted">
                Password
              </label>
              <div className="mt-1.5 flex items-center gap-1 rounded-lg border border-line bg-canvas ps-3 focus-within:ring-2 focus-within:ring-accent">
                <input id="settings-password" type={reveal ? 'text' : 'password'} defaultValue="correct horse battery" className="h-9 min-w-0 flex-1 bg-transparent text-sm text-fg outline-none" />
                <IconButton label={reveal ? 'Hide password' : 'Show password'} onClick={() => setReveal((r) => !r)} className="size-9">
                  <EyeClosedIcon size={17} active={!reveal} />
                </IconButton>
              </div>
            </div>
          </Panel>
          <Panel label="Privacy" className="divide-y divide-line">
            <Row Icon={<CookieIcon size={18} />} title="Analytics cookies" detail={cookies ? 'Allowed · helps us fix what breaks' : 'Blocked'}>
              <Button className="h-8 px-2.5 text-xs" aria-pressed={cookies} onClick={() => setCookies((c) => !c)}>
                {cookies ? 'Block' : 'Allow'}
              </Button>
            </Row>
            <Row Icon={<RssIcon size={18} />} title="Changelog feed" detail="Subscribe in your reader" />
            <Row Icon={<CloudOffIcon size={18} active={online} />} title="Sync" detail={online ? 'Synced a minute ago' : 'Paused while offline'} />
          </Panel>
        </div>
      </div>
    </Stage>
  )
}

export const Settings: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Device and account settings. Dim ↔ bright stretches dots into rays, the battery’s cells fuse into a bolt when plugged in, going offline swaps the signal bars for a slashed wifi and pauses sync, verifying a domain crimps the circle into a rosette, and the password toggle blinks its eye shut.',
      },
    },
  },
  render: () => <SettingsDemo />,
}

/* ── Trip ────────────────────────────────────────────────────────────────── */

function TripDemo() {
  const [boarded, setBoarded] = useState(false)
  const [added, setAdded] = useState(false)
  const [evening, setEvening] = useState(false)
  const [calm, setCalm] = useState(false)
  const [open, setOpen] = useState(false)

  return (
    <Stage>
      <div className="flex w-full max-w-[860px] flex-col gap-4 md:flex-row md:items-start">
        <Panel label="Boarding pass" className="w-full md:max-w-[380px]">
          <div className="flex items-center justify-between px-5 pt-5">
            <span data-yj-trigger className="inline-flex items-center gap-2 text-sm font-semibold text-fg">
              <PlaneIcon size={18} /> LIS → BER
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-well px-2 py-0.5 text-[11px] font-medium text-fg-muted" data-yj-trigger>
              <CrownIcon size={13} /> Priority
            </span>
          </div>
          <dl className="grid grid-cols-3 gap-3 px-5 py-4 text-xs">
            <div>
              <dt className="text-fg-muted">Flight</dt>
              <dd className="mt-0.5 font-mono text-fg">KN 482</dd>
            </div>
            <div>
              <dt className="text-fg-muted">Gate</dt>
              <dd className="mt-0.5 font-mono text-fg">B17</dd>
            </div>
            <div>
              <dt className="text-fg-muted">Seat</dt>
              <dd className="mt-0.5 font-mono text-fg">4A</dd>
            </div>
          </dl>
          <div className="flex items-center gap-3 border-t border-dashed border-line px-5 py-4">
            <TicketIcon size={22} active={boarded} className={boarded ? 'text-fg-muted' : 'text-fg'} aria-label={boarded ? 'Pass used' : 'Pass valid'} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-fg">{boarded ? 'Boarded at 09:12' : 'Boarding from 08:40'}</p>
              <p className="text-xs text-fg-muted">{boarded ? 'Enjoy the flight' : 'Show this at the gate'}</p>
            </div>
            <Button className="h-8 px-2.5 text-xs" onClick={() => setBoarded((b) => !b)}>
              <ScanBarcodeIcon size={15} />
              {boarded ? 'Undo' : 'Scan'}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4">
            <Button className="h-8 px-2.5 text-xs" aria-pressed={added} onClick={() => setAdded((a) => !a)}>
              <CalendarPlusIcon size={15} active={added} />
              {added ? 'In your calendar' : 'Add to calendar'}
            </Button>
            <Button variant="ghost" className="h-8 px-2.5 text-xs">
              <CalendarClockIcon size={15} /> Remind me
            </Button>
            <Button variant="ghost" className="h-8 px-2.5 text-xs">
              <CarIcon size={15} /> Ride to airport
            </Button>
          </div>
        </Panel>

        <div className="flex w-full flex-col gap-4">
          <Panel label="Berlin today" className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-fg">Berlin</p>
              <Segmented
                label="Time of day"
                value={evening ? 'evening' : 'morning'}
                onChange={(v) => setEvening(v === 'evening')}
                options={[
                  { value: 'morning', label: 'Morning' },
                  { value: 'evening', label: 'Evening' },
                ]}
              />
            </div>
            <div className="mt-4 flex items-center gap-4">
              <SunriseIcon size={48} strokeWidth={1.25} active={evening} aria-label={evening ? 'Sunset 19:04' : 'Sunrise 07:02'} />
              <div>
                <p className="text-3xl font-semibold tracking-tight text-fg tabular-nums">{evening ? '19:04' : '07:02'}</p>
                <p className="text-xs text-fg-muted">{evening ? 'Sunset · clear evening' : 'Sunrise · light frost'}</p>
              </div>
            </div>
            <ul className="mt-4 grid grid-cols-4 gap-1 border-t border-line pt-4" aria-label="Conditions">
              {[
                { Icon: SunIcon, label: 'Sunny', value: '11°' },
                { Icon: CloudSnowIcon, label: 'Flurries later', value: '2°' },
                { Icon: DropletIcon, label: 'Humidity', value: '64%' },
                { Icon: MoonIcon, label: 'Clear night', value: '−1°' },
              ].map(({ Icon, label, value }) => (
                <li key={label} data-yj-trigger className={cn('flex flex-col items-center gap-1.5 rounded-lg py-2 text-fg-muted hover:bg-hover hover:text-fg', ease)}>
                  <Icon size={20} aria-label={label} />
                  <span className="text-xs text-fg tabular-nums">{value}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel label="At your hotel" className="divide-y divide-line">
            <Row Icon={<DoorIcon size={18} active={open} />} title="Room 412 · digital key" detail={open ? 'Unlocked · closes in 10 s' : 'Hold your phone to the door'}>
              <Button className="h-8 px-2.5 text-xs" onClick={() => setOpen((o) => !o)}>
                {open ? 'Lock' : 'Unlock'}
              </Button>
            </Row>
            <Row Icon={<WavesIcon size={18} active={calm} />} title="Spa pool" detail={calm ? 'Still water · quiet hours' : 'Jets on · until 21:00'}>
              <Button className="h-8 px-2.5 text-xs" aria-pressed={calm} onClick={() => setCalm((c) => !c)}>
                Quiet
              </Button>
            </Row>
            <Row Icon={<CoffeeIcon size={18} />} title="Breakfast" detail="07:00–10:30 · included" />
            <div className="flex flex-wrap gap-1.5 px-4 py-3">
              <Chip Icon={LeafIcon}>Eco stay</Chip>
              <Chip Icon={FlameIcon}>Popular</Chip>
              <Chip Icon={SproutIcon}>New</Chip>
              <Chip Icon={GemIcon}>Member rate</Chip>
              <Chip Icon={BanknoteIcon}>Pay at hotel</Chip>
              <Chip Icon={RadarIcon}>Nearby</Chip>
            </div>
          </Panel>
        </div>
      </div>
    </Stage>
  )
}

export const Trip: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A travel app. Scanning the boarding pass tears its stub along the perforation, adding the flight swings the calendar’s plus into a check, the evening view sinks the sun behind the horizon, the room key swings the door open and quiet hours smooth the waves flat. Hover a chip or a condition to play it.',
      },
    },
  },
  render: () => <TripDemo />,
}

/* ── Reduced motion ──────────────────────────────────────────────────────── */

const STATES: YoujIconComponent[] = [CircleDashedIcon, CircleArrowUpIcon, ToggleIcon, BatteryChargingIcon, RecordIcon, CaptionsIcon, LayoutListIcon, TicketIcon, SunriseIcon]

export const ReducedMotion: Story = {
  name: 'Reduced motion',
  globals: { reducedMotion: 'always' },
  parameters: {
    docs: {
      description: {
        story: 'Pinned to reduced motion. Toggle the row: every state icon switches straight to its end pose with no in-between, and hover icons hold still.',
      },
    },
  },
  render: function Render() {
    const [on, setOn] = useState(false)
    return (
      <Stage>
        <Panel label="Reduced motion" className="flex flex-col items-center gap-5 p-6">
          <div className="flex flex-wrap items-center justify-center gap-5 text-fg">
            {STATES.map((I) => (
              <I key={I.meta.name} size={28} active={on} aria-label={`${I.meta.name}: ${I.meta.states![on ? 1 : 0]}`} />
            ))}
          </div>
          <Button onClick={() => setOn((o) => !o)} aria-pressed={on}>
            {on ? 'Back to rest' : 'Switch every state'}
          </Button>
        </Panel>
      </Stage>
    )
  },
}
