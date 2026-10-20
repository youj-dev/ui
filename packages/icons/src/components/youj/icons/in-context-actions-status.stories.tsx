import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { cn } from '@youj/core'
import { CircleDotIcon } from './circle-dot'
import { CircleMinusIcon } from './circle-minus'
import { CirclePlusIcon } from './circle-plus'
import { CircleUserIcon } from './circle-user'
import { CopyPlusIcon } from './copy-plus'
import { LanguagesIcon } from './languages'
import { LifeBuoyIcon } from './life-buoy'
import { OctagonAlertIcon } from './octagon-alert'
import { PinIcon } from './pin'
import { PinOffIcon } from './pin-off'
import { RotateCcwIcon } from './rotate-ccw'
import { RotateCwIcon } from './rotate-cw'
import { SearchIcon } from './search'
import { SearchXIcon } from './search-x'
import { UserXIcon } from './user-x'
import { ZoomInIcon } from './zoom-in'
import { ZoomOutIcon } from './zoom-out'
import { ease, focusRing } from './story-kit'

const meta = {
  title: 'Icons/In context/Actions, status & people',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Circle actions, people, alerts and help icons inside a workspace settings screen. Every icon sits in a button or a `data-yj-trigger` row, so hovering or keyboard-focusing the control plays it: the seat stepper turns its plus and pinches its minus, an avatar nods, a removed member leans away from the ×, an unpinned row tips its pin, the rotate buttons run a full turn, the scripts trade places, the buoy turns one stripe on and the stop sign braces. Search for someone who isn’t there to meet search-x. Under reduced motion every icon holds its resting drawing, and the controls still work.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>


function Panel({ title, children, className, action }: { title: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section aria-label={title} className={cn('rounded-2xl border border-line bg-surface shadow-sm', className)}>
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}

function IconButton({ label, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn('inline-flex size-8 items-center justify-center rounded-lg text-fg-muted hover:bg-hover hover:text-fg disabled:opacity-40', ease, focusRing, className)}
      {...props}
    />
  )
}

/* ── Members ─────────────────────────────────────────────────────────────── */

const PEOPLE = [
  { id: 'ada', name: 'Ada Okafor', email: 'ada@northwind.dev', role: 'Owner' },
  { id: 'lin', name: 'Lin Moreau', email: 'lin@northwind.dev', role: 'Admin' },
  { id: 'sam', name: 'Sam Teixeira', email: 'sam@northwind.dev', role: 'Editor' },
  { id: 'yui', name: 'Yui Tanaka', email: 'yui@northwind.dev', role: 'Editor' },
]

function Members() {
  const [people, setPeople] = useState(PEOPLE)
  const [pinned, setPinned] = useState<string[]>(['ada'])
  const [query, setQuery] = useState('')
  const [seats, setSeats] = useState(6)
  const [roles, setRoles] = useState(['Owner', 'Admin', 'Editor'])

  const shown = people
    .filter((p) => `${p.name} ${p.email}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => Number(pinned.includes(b.id)) - Number(pinned.includes(a.id)))
  const togglePin = (id: string) => setPinned((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]))

  return (
    <Panel
      title="Members"
      action={
        <div className="flex items-center gap-1 text-xs text-fg-muted" role="group" aria-label="Seats">
          <IconButton label="Remove a seat" onClick={() => setSeats((s) => Math.max(people.length, s - 1))} disabled={seats <= people.length}>
            <CircleMinusIcon size={18} />
          </IconButton>
          <span className="w-16 text-center tabular-nums" aria-live="polite">
            {seats} seats
          </span>
          <IconButton label="Add a seat" onClick={() => setSeats((s) => s + 1)}>
            <CirclePlusIcon size={18} />
          </IconButton>
        </div>
      }
    >
      <label className="mx-4 mt-3 flex h-9 items-center gap-2 rounded-lg border border-line bg-canvas px-2.5 text-fg-muted focus-within:ring-2 focus-within:ring-accent">
        <SearchIcon size={16} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members" aria-label="Search members" className="h-full flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle" />
      </label>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center" data-yj-trigger>
          <span className="text-fg-subtle">
            <SearchXIcon size={32} strokeWidth={1.25} />
          </span>
          <p className="text-sm font-medium text-fg">No one matches “{query}”</p>
          <p className="text-xs text-fg-muted">Check the spelling, or invite them by email.</p>
          <button type="button" onClick={() => setQuery('')} className={cn('mt-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-fg hover:bg-hover', ease, focusRing)}>
            Clear search
          </button>
        </div>
      ) : (
        <ul className="px-2 py-2">
          {shown.map((p) => {
            const isPinned = pinned.includes(p.id)
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-hover" data-yj-trigger>
                <span className="text-fg-muted">
                  <CircleUserIcon size={28} strokeWidth={1.25} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg">{p.name}</span>
                  <span className="block truncate text-xs text-fg-muted">{p.email}</span>
                </span>
                <span className="hidden text-xs text-fg-muted sm:block">{p.role}</span>
                <IconButton label={isPinned ? `Unpin ${p.name}` : `Pin ${p.name} to the top`} aria-pressed={isPinned} onClick={() => togglePin(p.id)} className={cn(isPinned && 'text-fg')}>
                  {isPinned ? <PinOffIcon size={16} /> : <PinIcon size={16} />}
                </IconButton>
                <IconButton label={`Remove ${p.name}`} disabled={p.role === 'Owner'} onClick={() => setPeople((all) => all.filter((x) => x.id !== p.id))} className="hover:text-danger">
                  <UserXIcon size={16} />
                </IconButton>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
        <span className="text-xs text-fg-muted">Roles</span>
        {roles.map((r, i) => (
          <span key={`${r}-${i}`} className="rounded-full border border-line bg-well px-2 py-0.5 text-xs text-fg">
            {r}
          </span>
        ))}
        <button type="button" onClick={() => setRoles((all) => [...all, `${all[all.length - 1]} copy`])} className={cn('ms-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-fg-muted hover:bg-hover hover:text-fg', ease, focusRing)}>
          <CopyPlusIcon size={16} />
          Duplicate role
        </button>
      </div>
    </Panel>
  )
}

/* ── Cover image ─────────────────────────────────────────────────────────── */

function CoverImage() {
  const [turn, setTurn] = useState(0)
  const [zoom, setZoom] = useState(1)
  return (
    <Panel title="Cover image" action={<span className="text-xs tabular-nums text-fg-muted">{Math.round(zoom * 100)}%</span>}>
      <div className="m-4 flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-canvas">
        <div
          className="flex h-2/3 w-1/2 items-end rounded-lg border border-line bg-well p-2 transition-transform duration-(--yj-duration-slow) ease-emphasized"
          style={{ transform: `rotate(${turn}deg) scale(${zoom})` }}
        >
          <span className="h-2 w-2/3 rounded-full bg-accent-line" />
        </div>
      </div>
      <div role="toolbar" aria-label="Image tools" className="flex items-center gap-1 border-t border-line px-3 py-2">
        <IconButton label="Rotate left" onClick={() => setTurn((t) => t - 90)}>
          <RotateCcwIcon size={18} />
        </IconButton>
        <IconButton label="Rotate right" onClick={() => setTurn((t) => t + 90)}>
          <RotateCwIcon size={18} />
        </IconButton>
        <span className="mx-1 h-5 w-px bg-line" />
        <IconButton label="Zoom out" disabled={zoom <= 0.6} onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))}>
          <ZoomOutIcon size={18} />
        </IconButton>
        <IconButton label="Zoom in" disabled={zoom >= 1.4} onClick={() => setZoom((z) => Math.min(1.4, +(z + 0.2).toFixed(1)))}>
          <ZoomInIcon size={18} trigger="none" />
        </IconButton>
      </div>
    </Panel>
  )
}

/* ── Workspace ───────────────────────────────────────────────────────────── */

const DIGESTS = ['Daily', 'Weekly', 'Off'] as const
const LANGUAGES = ['English', 'Deutsch', '日本語'] as const

function Workspace() {
  const [digest, setDigest] = useState<(typeof DIGESTS)[number]>('Weekly')
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]>('English')
  const [confirming, setConfirming] = useState(false)
  return (
    <Panel title="Workspace">
      <div className="flex items-center gap-3 px-4 py-3" data-yj-trigger>
        <span className="text-fg-muted">
          <LanguagesIcon size={18} />
        </span>
        <span className="flex-1 text-sm text-fg">Language</span>
        <select value={language} onChange={(e) => setLanguage(e.target.value as typeof language)} aria-label="Language" className={cn('h-8 rounded-lg border border-line bg-canvas px-2 text-sm text-fg', focusRing)}>
          {LANGUAGES.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </div>

      <div className="border-t border-line px-4 py-3">
        <p id="digest-label" className="mb-2 text-sm text-fg">
          Email digest
        </p>
        <div role="radiogroup" aria-labelledby="digest-label" className="flex gap-1">
          {DIGESTS.map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={digest === d}
              onClick={() => setDigest(d)}
              className={cn('inline-flex flex-1 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm', ease, focusRing, digest === d ? 'border-accent-line text-fg' : 'border-line text-fg-muted hover:text-fg')}
            >
              {digest === d ? <CircleDotIcon size={16} className="text-accent" /> : <span aria-hidden className="m-[1.5px] size-[13px] rounded-full border-[1.5px] border-current opacity-60" />}
              {d}
            </button>
          ))}
        </div>
      </div>

      <a href="#help" className={cn('flex items-center gap-3 border-t border-line px-4 py-3 text-sm text-fg hover:bg-hover', ease, focusRing)}>
        <span className="text-fg-muted">
          <LifeBuoyIcon size={18} />
        </span>
        Help center
        <span className="ms-auto text-xs text-fg-muted">Replies in about 2 hours</span>
      </a>

      <div role="alert" className="m-4 flex items-start gap-3 rounded-xl border border-danger-line bg-danger-subtle p-3" data-yj-trigger>
        <span className="mt-0.5 text-danger">
          <OctagonAlertIcon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fg">Delete workspace</p>
          <p className="mt-0.5 text-xs text-fg-muted">{confirming ? 'This removes 4 members and every project. It can’t be undone.' : 'Removes everything in Northwind for everyone.'}</p>
        </div>
        <button type="button" onClick={() => setConfirming((c) => !c)} className={cn('rounded-lg border border-danger-line px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger-subtle', ease, focusRing)}>
          {confirming ? 'Cancel' : 'Delete…'}
        </button>
      </div>
    </Panel>
  )
}

export const WorkspaceSettings: Story = {
  name: 'Workspace settings',
  render: () => (
    <div className="flex min-h-screen items-start justify-center bg-canvas p-4 md:p-10">
      <div className="grid w-full max-w-[980px] grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Members />
        <div className="grid gap-4">
          <CoverImage />
          <Workspace />
        </div>
      </div>
    </div>
  ),
}

/** Every icon in the batch at 16, 20 and 24px inside real buttons: hover or Tab through them. */
export const Buttons: Story = {
  render: () => {
    const all = [
      [CirclePlusIcon, 'Add'],
      [CircleMinusIcon, 'Remove'],
      [CircleDotIcon, 'Selected'],
      [CircleUserIcon, 'Account'],
      [UserXIcon, 'Remove member'],
      [OctagonAlertIcon, 'Stop'],
      [SearchXIcon, 'No results'],
      [CopyPlusIcon, 'Duplicate'],
      [RotateCwIcon, 'Rotate right'],
      [RotateCcwIcon, 'Rotate left'],
      [ZoomOutIcon, 'Zoom out'],
      [PinOffIcon, 'Unpin'],
      [LifeBuoyIcon, 'Help'],
      [LanguagesIcon, 'Language'],
    ] as const
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {all.map(([Icon, label]) => (
            <button key={label} type="button" className={cn('flex flex-col items-center gap-2 rounded-xl border border-line bg-surface px-3 py-3 text-xs text-fg-muted hover:text-fg', ease, focusRing)}>
              <span className="flex items-end gap-2 text-fg">
                <Icon size={16} />
                <Icon size={20} />
                <Icon size={24} />
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>
    )
  },
}
