import { useEffect, useRef, useState, type ButtonHTMLAttributes } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { motion } from 'motion/react'
import { useYouj } from '@youj/core'
import { cn } from '@youj/core'
import {
  AlarmClockIcon,
  ArchiveIcon,
  BellOffIcon,
  CalendarCheckIcon,
  CalendarIcon,
  ChevronDownIcon,
  ClipboardIcon,
  ClockIcon,
  CloudDownloadIcon,
  CloudUploadIcon,
  FileIcon,
  FilePlusIcon,
  FileTextIcon,
  FolderIcon,
  ForwardIcon,
  HistoryIcon,
  HourglassIcon,
  IdCardIcon,
  MailOpenIcon,
  MessagesIcon,
  MicIcon,
  PhoneCallIcon,
  PrinterIcon,
  ReplyIcon,
  SaveIcon,
  SmileIcon,
  ThumbsUpIcon,
  TimerIcon,
  UserCheckIcon,
  UserIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersIcon,
  VideoIcon,
} from './index'
import { ease, focusRing, Panel, Stage, useFlash } from './story-kit'

const meta = {
  title: 'Icons/In context/Files, people & time',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The files, people, communication and time icons inside real product UI. Rows, cards and buttons are the trigger, so hovering or keyboard-focusing the whole control plays its icon. Every state icon is driven by the state of its control: folder open, link copied, upload finished, invite sent, notifications muted, camera off, in a call, slot booked. Under reduced motion the icons hold still and state icons switch instantly.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/* ── Shared UI ───────────────────────────────────────────────────────────── */


type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
function Button({ variant = 'secondary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap',
        ease,
        focusRing,
        variant === 'primary' && 'bg-accent text-on-accent hover:opacity-90',
        variant === 'secondary' && 'border border-line bg-surface text-fg hover:bg-hover',
        variant === 'ghost' && 'text-fg-muted hover:bg-hover hover:text-fg',
        variant === 'danger' && 'bg-danger text-canvas hover:opacity-90',
        variant === 'success' && 'bg-success text-canvas hover:opacity-90',
        className,
      )}
      {...props}
    />
  )
}

function IconButton({ label, className, variant = 'ghost', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; variant?: Variant }) {
  return <Button variant={variant} aria-label={label} title={label} className={cn('w-9 justify-center px-0', className)} {...props} />
}

function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={cn('relative h-5 w-9 shrink-0 rounded-full', ease, focusRing, on ? 'bg-accent' : 'bg-line-strong')}
    >
      <span
        className={cn(
          'absolute top-0.5 size-4 rounded-full bg-surface shadow-sm transition-[inset-inline-start] duration-(--yj-duration-fast) ease-standard',
          on ? 'start-[18px]' : 'start-0.5',
        )}
      />
    </button>
  )
}

function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
  return (
    <span aria-hidden className={cn('flex size-8 shrink-0 items-center justify-center rounded-full bg-well font-mono text-[11px] font-medium text-fg-muted', className)}>
      {initials}
    </span>
  )
}

/** Runs `next` after `beats` deliberate beats while `when` holds. Cleans up on change. */
function useAfter(when: boolean, beats: number, next: () => void) {
  const k = useYouj()
  const cb = useRef(next)
  cb.current = next
  useEffect(() => {
    if (!when) return
    const t = setTimeout(() => cb.current(), k.ms('deliberate') * beats)
    return () => clearTimeout(t)
  }, [when, beats, k])
}

/* ── Files: a file browser ───────────────────────────────────────────────── */

interface Entry {
  name: string
  kind: 'doc' | 'file'
  modified: string
  size: string
}

const FOLDER_FILES: Entry[] = [
  { name: 'logo-lockup-horizontal-final-v3.svg', kind: 'file', modified: '2h ago', size: '38 KB' },
  { name: 'palette-and-type-specimen.pdf', kind: 'doc', modified: 'Yesterday', size: '2.4 MB' },
]
const ROOT_FILES: Entry[] = [
  { name: 'launch-brief.pdf', kind: 'doc', modified: 'Yesterday', size: '1.2 MB' },
  { name: 'hero-shot.fig', kind: 'file', modified: 'Mon', size: '18.9 MB' },
]

function FileRow({ entry, nested, copied, onCopy, offline, onOffline }: { entry: Entry; nested?: boolean; copied: boolean; onCopy: () => void; offline: boolean; onOffline: () => void }) {
  const Icon = entry.kind === 'doc' ? FileTextIcon : FileIcon
  return (
    <li data-yj-trigger className={cn('group flex h-12 items-center gap-3 border-b border-line pe-2 last:border-0 hover:bg-hover', ease, nested ? 'ps-11' : 'ps-4')}>
      <span className="text-fg-muted">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-fg" title={entry.name}>
        {entry.name}
      </span>
      <span className="hidden w-20 text-end text-xs text-fg-muted sm:block">{entry.modified}</span>
      <span className="hidden w-16 text-end font-mono text-xs text-fg-muted tabular-nums sm:block">{entry.size}</span>
      <div className="flex">
        <IconButton label={copied ? `Link to ${entry.name} copied` : `Copy link to ${entry.name}`} onClick={onCopy} className={copied ? 'text-success hover:text-success' : undefined}>
          <ClipboardIcon size={16} active={copied} />
        </IconButton>
        <IconButton
          label={offline ? `${entry.name} is available offline` : `Make ${entry.name} available offline`}
          aria-pressed={offline}
          onClick={onOffline}
          className={offline ? 'text-accent hover:text-accent' : undefined}
        >
          <CloudDownloadIcon size={16} active={offline} />
        </IconButton>
      </div>
    </li>
  )
}

function FileBrowserDemo() {
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [offline, setOffline] = useState<Record<string, boolean>>({ 'launch-brief.pdf': true })
  const [upload, setUpload] = useState<'idle' | 'uploading' | 'done'>('idle')
  const [added, addFile] = useFlash(3)
  const [saved, save] = useFlash(4)
  const k = useYouj()
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(copyTimer.current), [])
  useAfter(upload === 'uploading', 3, () => setUpload('done'))
  useAfter(upload === 'done', 4, () => setUpload('idle'))

  const copy = (name: string) => {
    clearTimeout(copyTimer.current)
    setCopied(name)
    copyTimer.current = setTimeout(() => setCopied(null), k.ms('deliberate') * 3)
  }
  const row = (entry: Entry, nested?: boolean) => (
    <FileRow
      key={entry.name}
      entry={entry}
      nested={nested}
      copied={copied === entry.name}
      onCopy={() => copy(entry.name)}
      offline={Boolean(offline[entry.name])}
      onOffline={() => setOffline((o) => ({ ...o, [entry.name]: !o[entry.name] }))}
    />
  )

  return (
    <Stage>
      <Panel className="w-full max-w-[760px] overflow-hidden">
        <div className="relative flex flex-wrap items-center gap-2 border-b border-line p-2 ps-4">
          <nav aria-label="Breadcrumb" className="me-auto flex min-w-0 items-center gap-1.5 text-sm">
            <span className="text-fg-muted">Acme</span>
            <span aria-hidden className="text-fg-muted">/</span>
            <span className="text-fg-muted">Design</span>
            <span aria-hidden className="text-fg-muted">/</span>
            <span className="truncate font-medium text-fg">Q3 launch</span>
          </nav>
          <div className="flex">
            <IconButton label="Version history">
              <HistoryIcon size={17} />
            </IconButton>
            <IconButton label="Print">
              <PrinterIcon size={17} />
            </IconButton>
            <IconButton label="Archive folder">
              <ArchiveIcon size={17} />
            </IconButton>
          </div>
          <span className="mx-1 h-5 w-px bg-line" />
          <Button onClick={addFile} className="min-w-[118px] justify-center">
            <FilePlusIcon size={16} active={added} />
            {added ? 'Added' : 'New file'}
          </Button>
          <Button variant="primary" disabled={upload === 'uploading'} onClick={() => setUpload('uploading')} className="min-w-[124px] justify-center disabled:opacity-80">
            <CloudUploadIcon size={16} strokeWidth={1.75} active={upload === 'done'} />
            {upload === 'idle' ? 'Upload' : upload === 'uploading' ? 'Uploading…' : 'Uploaded'}
          </Button>
          <span role="status" className="sr-only">
            {upload === 'uploading' ? 'Uploading 3 files' : upload === 'done' ? 'Upload complete' : ''}
          </span>
          {upload === 'uploading' && (
            <div className="absolute inset-x-0 -bottom-px h-0.5 overflow-hidden" role="progressbar" aria-label="Uploading 3 files">
              <motion.div
                className="h-full origin-left bg-accent rtl:origin-right"
                initial={{ scaleX: k.reduced ? 1 : 0 }}
                animate={{ scaleX: 1 }}
                transition={{ ...k.tween('deliberate', 'standard'), duration: k.duration('deliberate') * 3 }}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 border-b border-line px-4 py-2 font-mono text-[11px] tracking-wide text-fg-muted uppercase">
          <span className="flex-1">Name</span>
          <span className="hidden w-20 text-end sm:block">Modified</span>
          <span className="hidden w-16 text-end sm:block">Size</span>
          <span className="w-[72px]" />
        </div>
        <ul>
          <li>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className={cn('flex h-12 w-full items-center gap-3 border-b border-line ps-4 pe-4 text-start hover:bg-hover', ease, focusRing)}
            >
              <span className={open ? 'text-accent' : 'text-fg-muted'}>
                <FolderIcon size={18} active={open} />
              </span>
              <span className="flex-1 truncate text-sm font-medium text-fg">Brand assets</span>
              <span className="hidden w-20 text-end text-xs text-fg-muted sm:block">Today</span>
              <span className="hidden w-16 text-end font-mono text-xs text-fg-muted sm:block">{FOLDER_FILES.length} items</span>
              <span className="flex w-[72px] justify-end text-fg-subtle">
                <ChevronDownIcon size={16} active={open} />
              </span>
            </button>
            {open && <ul>{FOLDER_FILES.map((f) => row(f, true))}</ul>}
          </li>
          {ROOT_FILES.map((f) => row(f))}
        </ul>
        <div className="flex items-center justify-end gap-3 border-t border-line p-3">
          <span className="text-xs text-fg-muted" aria-live="polite">
            {saved ? 'All changes saved' : '2 unsaved changes'}
          </span>
          <Button variant={saved ? 'secondary' : 'primary'} onClick={save} className="min-w-[140px] justify-center">
            <span className={saved ? 'text-success' : undefined}>
              <SaveIcon size={16} active={saved} />
            </span>
            {saved ? 'Saved' : 'Save changes'}
          </Button>
        </div>
      </Panel>
    </Stage>
  )
}

export const FileBrowser: Story = {
  name: 'File browser',
  parameters: {
    docs: {
      description: {
        story:
          'Rows are hover groups: the page flicks its dog-ear, the text retypes. The folder row opens its panel; copy link folds the lines into a check; "available offline" seals the cloud; Upload launches its arrow and seals when done; New file and Save turn into checks.',
      },
    },
  },
  render: () => <FileBrowserDemo />,
}

/* ── People: a team member list ──────────────────────────────────────────── */

interface Member {
  name: string
  email: string
  role: string
  status: 'verified' | 'id-pending' | 'member'
  kudos: number
}

const MEMBERS: Member[] = [
  { name: 'Ana Ruiz', email: 'ana@northwind.dev', role: 'Admin', status: 'verified', kudos: 12 },
  { name: 'Kenji Mori', email: 'kenji@northwind.dev', role: 'Member', status: 'id-pending', kudos: 4 },
  { name: 'Lena Park-Okonkwo', email: 'lena.park-okonkwo@northwind.dev', role: 'Member', status: 'member', kudos: 7 },
]

function TeamDemo() {
  const [members, setMembers] = useState(MEMBERS)
  const [liked, setLiked] = useState<Record<string, boolean>>({ 'Ana Ruiz': true })
  const [muted, setMuted] = useState(false)
  const [email, setEmail] = useState('')
  const [invited, flashInvited] = useFlash(3)
  const [pending, setPending] = useState([
    { email: 'sam@northwind.dev', opened: true },
    { email: 'jo@northwind.dev', opened: false },
  ])

  const invite = () => {
    const address = email.trim() || 'new.hire@northwind.dev'
    setPending((p) => [{ email: address, opened: false }, ...p.filter((x) => x.email !== address)])
    setEmail('')
    flashInvited()
  }

  return (
    <Stage>
      <Panel className="w-full max-w-[680px]">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <div data-yj-trigger className="me-auto flex items-center gap-2.5">
            <span className="text-fg-muted">
              <UsersIcon size={20} />
            </span>
            <h2 className="text-sm font-semibold text-fg">Design team</h2>
            <span className="rounded-full bg-well px-2 py-0.5 font-mono text-[11px] text-fg-muted">{members.length}</span>
          </div>
          <label className="flex items-center gap-2.5 text-xs text-fg-muted">
            <span className={muted ? 'text-fg-subtle' : 'text-fg-muted'}>
              <BellOffIcon size={17} active={!muted} />
            </span>
            {muted ? 'Notifications muted' : 'Notifications on'}
            <Switch on={!muted} onChange={() => setMuted((m) => !m)} label="Team notifications" />
          </label>
        </div>

        <form
          className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3"
          onSubmit={(e) => {
            e.preventDefault()
            invite()
          }}
        >
          <label htmlFor="invite-email" className="sr-only">
            Invite by email
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@northwind.dev"
            className={cn('h-9 min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 text-sm text-fg placeholder:text-fg-subtle', ease, focusRing)}
          />
          <Button type="submit" variant="primary" className="min-w-[112px] justify-center">
            <UserPlusIcon size={16} strokeWidth={1.75} active={invited} />
            {invited ? 'Invited' : 'Invite'}
          </Button>
        </form>

        <ul aria-label="Members">
          {members.length === 0 && <li className="px-5 py-10 text-center text-sm text-fg-muted">Nobody here yet. Invite someone to get started.</li>}
          {members.map((m) => (
            <li key={m.email} className="flex items-center gap-3 border-b border-line px-5 py-3">
              <Avatar name={m.name} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm text-fg">
                  <span className="truncate">{m.name}</span>
                  {m.status === 'verified' && (
                    <span className="text-success" title="Identity verified">
                      <UserCheckIcon size={15} aria-label="Identity verified" />
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-fg-muted">{m.email}</p>
              </div>
              {m.status === 'id-pending' && (
                <Button variant="ghost" className="h-8 px-2 text-xs">
                  <IdCardIcon size={16} />
                  Verify ID
                </Button>
              )}
              <span className="hidden w-16 text-xs text-fg-muted sm:block">{m.role}</span>
              <Button
                variant="ghost"
                aria-pressed={Boolean(liked[m.name])}
                aria-label={`Give kudos to ${m.name}, ${m.kudos + (liked[m.name] ? 1 : 0)} so far`}
                onClick={() => setLiked((l) => ({ ...l, [m.name]: !l[m.name] }))}
                className={cn('h-8 px-2 tabular-nums', liked[m.name] && 'text-accent hover:text-accent')}
              >
                <ThumbsUpIcon size={16} active={Boolean(liked[m.name])} />
                <span className="w-4 text-start text-xs">{m.kudos + (liked[m.name] ? 1 : 0)}</span>
              </Button>
              <IconButton label={`Remove ${m.name}`} onClick={() => setMembers((list) => list.filter((x) => x.email !== m.email))} className="hover:text-danger">
                <UserMinusIcon size={16} />
              </IconButton>
            </li>
          ))}
        </ul>

        <div className="px-5 pt-4 pb-1 font-mono text-[11px] tracking-wide text-fg-muted uppercase">Pending invites</div>
        <ul aria-label="Pending invites" className="pb-2">
          {pending.map((p) => (
            <li key={p.email} className="flex items-center gap-3 px-5 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong text-fg-subtle">
                <UserIcon size={15} />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-fg-muted">{p.email}</span>
              <span className={cn('flex items-center gap-1.5 text-xs', p.opened ? 'text-fg-muted' : 'text-fg')}>
                <MailOpenIcon size={16} active={!p.opened} aria-label={p.opened ? 'Invite opened' : 'Invite not opened yet'} />
                <span className="hidden sm:inline">{p.opened ? 'Opened' : 'Not opened'}</span>
              </span>
              <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setPending((list) => list.map((x) => (x.email === p.email ? { ...x, opened: !x.opened } : x)))}>
                {p.opened ? 'Resend' : 'Mark opened'}
              </Button>
            </li>
          ))}
        </ul>
      </Panel>
    </Stage>
  )
}

export const TeamMembers: Story = {
  name: 'Team members',
  parameters: {
    docs: {
      description: {
        story:
          'Invite turns its plus into a check. Kudos pumps the thumb and fills it. The notification switch pulls the slash out of the bell and rings it. Resending an invite seals the envelope again (unread); marking it opened folds the flap back up. Remove a member to reach the empty state.',
      },
    },
  },
  render: () => <TeamDemo />,
}

/* ── Time: a scheduling card ─────────────────────────────────────────────── */

const SLOTS = ['13:00', '14:00', '15:30']

function SchedulingDemo() {
  const [slot, setSlot] = useState('14:00')
  const [booked, setBooked] = useState(false)
  const [remind, setRemind] = useState(true)
  const [h, m] = slot.split(':').map(Number) as [number, number]
  const end = new Date(0, 0, 1, h, m + 45)
  const endLabel = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`

  return (
    <Stage>
      <Panel className="w-full max-w-[420px] overflow-hidden">
        <div className="flex items-start gap-3 border-b border-line p-5">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] tracking-wide text-fg-muted uppercase">Q3 launch</p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-fg">Design review</h2>
            <p className="mt-0.5 text-[13px] text-fg-muted">With Ana, Kenji and 2 others</p>
          </div>
          <IconButton label="Reschedule history" className="-me-2 -mt-1">
            <HistoryIcon size={17} />
          </IconButton>
        </div>

        <dl className="flex flex-col gap-1 p-3">
          {[
            { Icon: CalendarIcon, term: 'Date', value: 'Thursday, October 2' },
            { Icon: ClockIcon, term: 'Time', value: `${slot} – ${endLabel}` },
            { Icon: TimerIcon, term: 'Duration', value: '45 min · focus block' },
          ].map(({ Icon, term, value }) => (
            <div key={term} data-yj-trigger className={cn('rounded-lg px-2 py-2 hover:bg-hover', ease)}>
              <dt className="sr-only">{term}</dt>
              <dd className="flex items-center gap-3 text-sm text-fg tabular-nums">
                <span className="text-fg-muted">
                  <Icon size={18} />
                </span>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="px-5 pb-4">
          <p className="mb-2 text-xs text-fg-muted" id="slot-label">
            Pick a slot
          </p>
          <div role="radiogroup" aria-labelledby="slot-label" className="grid grid-cols-3 gap-2">
            {SLOTS.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={slot === s}
                disabled={booked}
                onClick={() => setSlot(s)}
                className={cn(
                  'h-9 rounded-lg border font-mono text-[13px] tabular-nums disabled:opacity-60',
                  ease,
                  focusRing,
                  slot === s ? 'border-accent bg-accent-subtle text-fg' : 'border-line text-fg-muted hover:border-line-strong hover:text-fg',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-line px-5 py-3.5">
          <span className={remind ? 'text-accent' : 'text-fg-muted'}>
            <AlarmClockIcon size={18} active={remind} />
          </span>
          <span className="flex-1 text-sm text-fg">Remind me 10 min before</span>
          <Switch on={remind} onChange={() => setRemind((r) => !r)} label="Reminder 10 minutes before" />
        </div>

        <div className="flex items-center gap-3 border-t border-line bg-canvas px-5 py-4">
          <span className="flex min-w-0 flex-1 items-center gap-2 text-xs text-fg-muted" aria-live="polite">
            {booked ? (
              <>
                <span className="text-success">
                  <UserCheckIcon size={16} trigger="mount" />
                </span>
                Booked · invites sent to 4 people
              </>
            ) : (
              <>
                <HourglassIcon size={16} aria-label="Waiting" />
                Waiting on 2 responses
              </>
            )}
          </span>
          <Button variant={booked ? 'secondary' : 'primary'} aria-pressed={booked} onClick={() => setBooked((b) => !b)} className="min-w-[116px] justify-center">
            <span className={booked ? 'text-success' : undefined}>
              <CalendarCheckIcon size={16} active={booked} />
            </span>
            {booked ? 'Booked' : 'Book slot'}
          </Button>
        </div>
      </Panel>
    </Stage>
  )
}

export const Scheduling: Story = {
  name: 'Scheduling card',
  parameters: {
    docs: {
      description: {
        story:
          'Detail rows are hover groups: the calendar tears off a day, an hour passes on the clock, the timer runs a lap. The reminder switch sets the alarm ringing. Book slot lines the day dots up into a check; the hourglass turns over while responses are pending.',
      },
    },
  },
  render: () => <SchedulingDemo />,
}

/* ── Communication: a call toolbar ───────────────────────────────────────── */

const CHAT = [
  { from: 'Ana Ruiz', text: 'Sharing the updated flows in a sec, the onboarding step moved.', time: '14:02' },
  { from: 'Kenji Mori', text: 'Can we keep the old empty state as a fallback for enterprise?', time: '14:04' },
]

function CallDemo() {
  const [inCall, setInCall] = useState(true)
  const [micOff, setMicOff] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [thumbs, setThumbs] = useState(false)
  const [chat, setChat] = useState(true)
  const [chatMuted, setChatMuted] = useState(false)

  return (
    <Stage className="bg-canvas">
      <div className="flex w-full max-w-[920px] flex-col gap-3 lg:flex-row">
        <Panel className="relative flex min-h-[380px] flex-1 flex-col overflow-hidden p-3">
          <div className="relative flex flex-1 items-center justify-center rounded-xl bg-well">
            {inCall ? (
              <>
                <Avatar name="Ana Ruiz" className="size-20 bg-surface text-lg" />
                <span className="absolute start-3 bottom-3 rounded-md bg-surface px-2 py-1 text-xs text-fg">Ana Ruiz</span>
                <div className="absolute end-3 bottom-3 flex h-20 w-28 items-center justify-center rounded-lg border border-line bg-surface">
                  {camOff ? (
                    <span className="flex flex-col items-center gap-1 text-fg-muted">
                      <VideoIcon size={18} active aria-label="Your camera is off" />
                      <span className="text-[10px]">Camera off</span>
                    </span>
                  ) : (
                    <span className="text-xs text-fg-muted">You</span>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm font-medium text-fg">You left the call</p>
                <p className="text-xs text-fg-muted">Design review · 32 min</p>
              </div>
            )}
          </div>

          <div role="toolbar" aria-label="Call controls" className="mx-auto mt-3 flex items-center gap-1 rounded-full border border-line bg-surface p-1.5 shadow-sm">
            <IconButton label={micOff ? 'Unmute microphone' : 'Mute microphone'} aria-pressed={micOff} disabled={!inCall} onClick={() => setMicOff((m) => !m)} className={cn('size-10 rounded-full disabled:opacity-40', micOff && 'text-danger hover:text-danger')}>
              <MicIcon size={19} active={micOff} />
            </IconButton>
            <IconButton label={camOff ? 'Turn camera on' : 'Turn camera off'} aria-pressed={camOff} disabled={!inCall} onClick={() => setCamOff((c) => !c)} className={cn('size-10 rounded-full disabled:opacity-40', camOff && 'text-danger hover:text-danger')}>
              <VideoIcon size={19} active={camOff} />
            </IconButton>
            <IconButton label="Send a reaction" disabled={!inCall} className="size-10 rounded-full disabled:opacity-40">
              <SmileIcon size={19} />
            </IconButton>
            <IconButton label={thumbs ? 'Lower thumbs up' : 'Thumbs up'} aria-pressed={thumbs} disabled={!inCall} onClick={() => setThumbs((t) => !t)} className={cn('size-10 rounded-full disabled:opacity-40', thumbs && 'text-accent hover:text-accent')}>
              <ThumbsUpIcon size={19} active={thumbs} />
            </IconButton>
            <IconButton label={chat ? 'Hide chat' : 'Show chat'} aria-pressed={chat} onClick={() => setChat((c) => !c)} className={cn('size-10 rounded-full', chat && 'bg-selected text-fg')}>
              <MessagesIcon size={19} />
            </IconButton>
            <span className="mx-1 h-6 w-px bg-line" />
            <Button
              variant={inCall ? 'danger' : 'success'}
              aria-label={inCall ? 'Leave call' : 'Rejoin call'}
              onClick={() => setInCall((c) => !c)}
              className="h-10 min-w-[108px] justify-center rounded-full"
            >
              <PhoneCallIcon size={18} strokeWidth={1.75} active={inCall} />
              {inCall ? 'Leave' : 'Rejoin'}
            </Button>
          </div>
        </Panel>

        {chat && (
          <Panel className="flex w-full flex-col lg:w-[300px]">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <h3 className="me-auto text-sm font-semibold text-fg">Chat</h3>
              <IconButton label={chatMuted ? 'Unmute chat notifications' : 'Mute chat notifications'} aria-pressed={chatMuted} onClick={() => setChatMuted((m) => !m)} className="size-8">
                <BellOffIcon size={16} active={!chatMuted} />
              </IconButton>
            </div>
            <ul className="flex flex-1 flex-col gap-1 p-2">
              {CHAT.map((c) => (
                <li key={c.time} className="group relative rounded-lg px-2 py-2 hover:bg-hover focus-within:bg-hover">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13px] font-medium text-fg">{c.from}</span>
                    <span className="font-mono text-[10px] text-fg-muted">{c.time}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-snug text-fg-muted">{c.text}</p>
                  <div className="mt-1.5 flex gap-1 opacity-100 transition-opacity duration-(--yj-duration-fast) ease-standard lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
                    <Button variant="ghost" className="h-7 gap-1.5 px-2 text-xs">
                      <ReplyIcon size={14} />
                      Reply
                    </Button>
                    <Button variant="ghost" className="h-7 gap-1.5 px-2 text-xs">
                      <ForwardIcon size={14} />
                      Forward
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </Stage>
  )
}

export const CallToolbar: Story = {
  name: 'Call toolbar',
  parameters: {
    docs: {
      description: {
        story:
          'Leave turns the handset into the hang-up pose as the call ends; Rejoin turns it back and the signal returns. Camera off cuts the lens with a slash. Thumbs up pumps and fills; the reaction face winks on hover. In the chat, reply and forward stretch on hover, and the bell mutes chat notifications.',
      },
    },
  },
  render: () => <CallDemo />,
}
