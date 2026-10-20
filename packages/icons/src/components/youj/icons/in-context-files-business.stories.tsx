import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useYouj } from '@youj/core'
import { cn } from '@youj/core'
import { AwardIcon } from './award'
import { BookOpenIcon } from './book-open'
import { BriefcaseIcon } from './briefcase'
import { BuildingIcon } from './building'
import { CalculatorIcon } from './calculator'
import { ChevronRightIcon } from './chevron-right'
import { DollarSignIcon } from './dollar-sign'
import { EyeIcon } from './eye'
import { EyeOffIcon } from './eye-off'
import { FileCodeIcon } from './file-code'
import { FileImageIcon } from './file-image'
import { FileJsonIcon } from './file-json'
import { FileTerminalIcon } from './file-terminal'
import { FolderIcon } from './folder'
import { FolderInputIcon } from './folder-input'
import { FolderOpenIcon } from './folder-open'
import { LockIcon } from './lock'
import { LockOpenIcon } from './lock-open'
import { QrCodeIcon } from './qr-code'
import { XIcon } from './x'
import { ease, focusRing } from './story-kit'

const meta = {
  title: 'Icons/In context/Files, security & business',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The files, security and business icons inside a workspace settings screen. Rows, links and buttons are the trigger, so hovering or keyboard-focusing the whole control plays its icon: a file type animates its glyph, the moving arrow goes into its folder, the eye blinks behind its slash, the open lock dips as if to close, the case is picked up, the lights come on floor by floor, a sum is typed, the S is rewritten, a scan line crosses the code, a page turns and the badge swings on its pin. lock-open, eye-off and folder-open rest exactly on the unlocked, hidden and open poses of lock, eye and folder, so they sit beside those state icons without a seam. Under "Motion: reduced" every icon holds its complete resting drawing.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/* ── Shared UI ───────────────────────────────────────────────────────────── */


function Panel({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn('flex flex-col rounded-2xl border border-line bg-surface shadow-sm', className)}>
      <h2 className="border-b border-line px-4 py-3 text-xs font-medium tracking-wide text-fg-muted uppercase">{title}</h2>
      {children}
    </section>
  )
}

function Button({ className, primary, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap',
        ease,
        focusRing,
        primary ? 'bg-accent text-on-accent hover:opacity-90' : 'border border-line bg-surface text-fg hover:bg-hover',
        className,
      )}
      {...props}
    />
  )
}

/** A row that is one button: hovering or focusing anywhere in it plays its icon. */
function Row({ icon, label, detail, onClick, pressed, trailing }: { icon: ReactNode; label: string; detail?: ReactNode; onClick?: () => void; pressed?: boolean; trailing?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cn('flex w-full items-center gap-3 px-4 py-2.5 text-start text-sm text-fg hover:bg-hover', ease, focusRing, pressed && 'bg-selected')}
    >
      <span className="text-fg-muted">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate">{label}</span>
        {detail && <span className="block truncate text-xs text-fg-muted">{detail}</span>}
      </span>
      {trailing}
    </button>
  )
}

/* ── Files ───────────────────────────────────────────────────────────────── */

const FILES = [
  { name: 'app.tsx', Icon: FileCodeIcon, tint: 'text-accent', size: '4.2 KB' },
  { name: 'tsconfig.json', Icon: FileJsonIcon, tint: 'text-warning', size: '612 B' },
  { name: 'deploy.sh', Icon: FileTerminalIcon, tint: 'text-success', size: '1.1 KB' },
  { name: 'hero.png', Icon: FileImageIcon, tint: 'text-danger', size: '248 KB' },
] as const
const FOLDERS = ['archive', 'marketing', 'releases'] as const

function FilesPanel() {
  const [open, setOpen] = useState(true)
  const [selected, setSelected] = useState<string>('hero.png')
  const [moving, setMoving] = useState(false)
  const [moved, setMoved] = useState<string | null>(null)
  const [files, setFiles] = useState<readonly (typeof FILES)[number][]>(FILES)
  const move = (folder: string) => {
    setFiles((list) => list.filter((f) => f.name !== selected))
    setMoved(`${selected} → ${folder}`)
    setMoving(false)
  }
  return (
    <Panel title="Files">
      <div className="py-1">
        <Row
          icon={open ? <FolderOpenIcon size={18} /> : <FolderIcon size={18} />}
          label="src"
          detail={`${files.length} files`}
          onClick={() => setOpen(!open)}
          trailing={<ChevronRightIcon size={14} active={open} className="text-fg-muted rtl:-scale-x-100" />}
        />
        {open && (
          <ul aria-label="src">
            {files.map(({ name, Icon, tint, size }) => (
              <li key={name}>
                <Row icon={<Icon size={18} className={tint} />} label={name} detail={size} pressed={selected === name} onClick={() => setSelected(name)} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-auto border-t border-line p-3">
        <Button onClick={() => setMoving(!moving)} aria-expanded={moving} disabled={!files.some((f) => f.name === selected)}>
          <FolderInputIcon size={16} />
          Move {files.some((f) => f.name === selected) ? selected : 'file'}…
        </Button>
        {moving && (
          <ul aria-label="Move to" className="mt-2 overflow-hidden rounded-lg border border-line">
            {FOLDERS.map((folder) => (
              <li key={folder} className="border-b border-line last:border-0">
                <Row icon={<FolderInputIcon size={18} />} label={folder} detail="Move here" onClick={() => move(folder)} />
              </li>
            ))}
          </ul>
        )}
        <p role="status" className="mt-2 min-h-4 text-xs text-fg-muted">
          {moved && `Moved ${moved}`}
        </p>
      </div>
    </Panel>
  )
}

/* ── Security ────────────────────────────────────────────────────────────── */

function SecurityPanel({ onSecured }: { onSecured: () => void }) {
  const id = useId()
  const [shown, setShown] = useState(false)
  const [locked, setLocked] = useState(false)
  return (
    <Panel title="Security">
      <div className="flex flex-col gap-4 p-4">
        <div>
          <label htmlFor={id} className="mb-1.5 block text-xs text-fg-muted">
            Recovery passphrase
          </label>
          <div className="flex h-9 items-center rounded-lg border border-line bg-canvas pe-1 focus-within:ring-2 focus-within:ring-accent">
            <input
              id={id}
              type={shown ? 'text' : 'password'}
              defaultValue="orbit-maple-quartz-42"
              spellCheck={false}
              className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-sm text-fg outline-none"
            />
            <button
              type="button"
              onClick={() => setShown(!shown)}
              aria-label={shown ? 'Hide passphrase' : 'Show passphrase'}
              title={shown ? 'Hide passphrase' : 'Show passphrase'}
              className={cn('flex size-7 items-center justify-center rounded-md text-fg-muted hover:bg-hover hover:text-fg', ease, focusRing)}
            >
              {shown ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            </button>
          </div>
        </div>
        <div data-yj-trigger className="flex items-center gap-3 rounded-xl border border-line p-3">
          <span className={cn('flex size-9 items-center justify-center rounded-lg bg-well', locked ? 'text-success' : 'text-warning')}>
            {locked ? <LockIcon size={18} /> : <LockOpenIcon size={18} />}
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <span className="block text-fg">{locked ? 'Vault locked' : 'Vault unlocked'}</span>
            <span className="block text-xs text-fg-muted">{locked ? 'Unlock with your passphrase' : 'Locks again in 5 min'}</span>
          </span>
          <Button
            onClick={() => {
              if (!locked) onSecured()
              setLocked(!locked)
            }}
          >
            {locked ? 'Unlock' : 'Lock now'}
          </Button>
        </div>
      </div>
    </Panel>
  )
}

/* ── Company ─────────────────────────────────────────────────────────────── */

function CompanyPanel() {
  const [seats, setSeats] = useState(12)
  const [estimating, setEstimating] = useState(false)
  const [sharing, setSharing] = useState(false)
  return (
    <Panel title="Workspace">
      <div data-yj-trigger className="flex items-center gap-3 border-b border-line px-4 py-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-well text-fg">
          <BuildingIcon size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-fg">Northwind Labs</span>
          <span className="block truncate text-xs text-fg-muted">northwind.dev · 3 offices</span>
        </span>
      </div>
      <div className="py-1">
        <Row icon={<BriefcaseIcon size={18} />} label="Business details" detail="VAT, legal name, address" trailing={<ChevronRightIcon size={14} trigger="none" className="text-fg-muted rtl:-scale-x-100" />} />
        <Row icon={<DollarSignIcon size={18} />} label="Plan: Team" detail={`$${seats * 4} / month · ${seats} seats`} trailing={<ChevronRightIcon size={14} trigger="none" className="text-fg-muted rtl:-scale-x-100" />} />
        <Row icon={<CalculatorIcon size={18} />} label="Estimate cost" detail="Try a seat count" pressed={estimating} onClick={() => setEstimating(!estimating)} />
        {estimating && (
          <div className="flex items-center gap-3 px-4 pt-1 pb-3 ps-11">
            <input
              type="range"
              min={1}
              max={50}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              aria-label="Seats"
              className="h-1 flex-1 cursor-pointer accent-(--color-accent)"
            />
            <span className="w-24 text-end font-mono text-xs text-fg tabular-nums">${seats * 4}/mo</span>
          </div>
        )}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line p-3">
        <Button onClick={() => setSharing(!sharing)} aria-expanded={sharing}>
          <QrCodeIcon size={16} />
          Invite by QR
        </Button>
        <a href="#admin-guide" className={cn('inline-flex h-8 items-center gap-2 rounded-lg px-2 text-sm text-accent hover:underline', focusRing)}>
          <BookOpenIcon size={16} />
          Admin guide
        </a>
        {sharing && (
          <div role="group" aria-label="Invite by QR" data-yj-trigger className="mt-1 flex w-full items-center gap-4 rounded-xl border border-line bg-canvas p-3">
            <span className="rounded-lg bg-surface p-2 text-fg">
              <QrCodeIcon size={72} strokeWidth={1.25} trigger="loop" />
            </span>
            <span className="text-sm">
              <span className="block text-fg">Scan to join Northwind Labs</span>
              <span className="block text-xs text-fg-muted">The code expires in 24 hours.</span>
            </span>
          </div>
        )}
      </div>
    </Panel>
  )
}

/* ── Toast ───────────────────────────────────────────────────────────────── */

function BadgeToast({ onClose }: { onClose: () => void }) {
  const k = useYouj()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    timer.current = setTimeout(onClose, k.ms('deliberate') * 10)
    return () => clearTimeout(timer.current)
  }, [k, onClose])
  return (
    <div role="status" data-yj-trigger className="fixed end-6 bottom-6 z-10 flex w-80 max-w-[calc(100vw-3rem)] items-start gap-3 rounded-2xl border border-line bg-overlay p-4 shadow-lg">
      <span className="text-accent">
        <AwardIcon size={24} trigger="mount" />
      </span>
      <span className="min-w-0 flex-1 text-sm">
        <span className="block font-medium text-fg">Badge earned: Vault keeper</span>
        <span className="block text-xs text-fg-muted">You locked the vault before leaving it open.</span>
      </span>
      <button type="button" onClick={onClose} aria-label="Dismiss" className={cn('rounded-md p-1 text-fg-muted hover:bg-surface hover:text-fg', ease, focusRing)}>
        <XIcon size={14} />
      </button>
    </div>
  )
}

function WorkspaceSettingsDemo() {
  const [badge, setBadge] = useState(false)
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4 md:p-10">
      <div className="grid w-full max-w-[880px] grid-cols-1 items-start gap-4 md:grid-cols-2">
        <FilesPanel />
        <div className="flex flex-col gap-4">
          <SecurityPanel onSecured={() => setBadge(true)} />
          <CompanyPanel />
        </div>
      </div>
      {badge && <BadgeToast onClose={() => setBadge(false)} />}
    </div>
  )
}

export const WorkspaceSettings: Story = {
  name: 'Workspace settings',
  parameters: {
    docs: {
      description: {
        story:
          'Hover the rows: each file type animates its own glyph, and "Move…" opens a list whose arrows slide into their folders. Show the passphrase to swap the eye for eye-off (it blinks behind its slash on hover); lock the vault and a badge toast swings in. "Estimate cost" types its sum while the plan row rewrites its S; "Invite by QR" loops the scan line over a large code, and the admin guide turns a page.',
      },
    },
  },
  render: () => <WorkspaceSettingsDemo />,
}

/* ── The set at a glance ─────────────────────────────────────────────────── */

const SET = [
  LockOpenIcon,
  EyeOffIcon,
  FolderOpenIcon,
  FolderInputIcon,
  FileCodeIcon,
  FileJsonIcon,
  FileTerminalIcon,
  FileImageIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalculatorIcon,
  DollarSignIcon,
  QrCodeIcon,
  AwardIcon,
]

export const AtAGlance: Story = {
  name: 'At a glance',
  parameters: {
    docs: {
      description: {
        story: 'The fifteen at 16, 24 and 40px. Hover a tile to play its icon; the sizes follow the docs guidance (1.75 stroke at 16, 1.5 above).',
      },
    },
  },
  render: () => (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {SET.map((Icon) => (
          <li key={Icon.meta.name}>
            <button
              type="button"
              className={cn('flex w-full flex-col items-center gap-3 rounded-xl border border-line bg-surface px-4 pt-5 pb-3 text-fg hover:bg-hover', ease, focusRing)}
            >
              <span className="flex items-end gap-4">
                <Icon size={16} strokeWidth={1.75} />
                <Icon size={24} />
                <Icon size={40} />
              </span>
              <span className="font-mono text-[11px] text-fg-muted">{Icon.meta.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  ),
}
