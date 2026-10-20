import { useState, type ButtonHTMLAttributes, type KeyboardEvent } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { cn } from '@youj/core'
import { AnchorIcon } from './anchor'
import { ArrowDownRightIcon } from './arrow-down-right'
import { ArrowUpLeftIcon } from './arrow-up-left'
import { CapsLockIcon } from './caps-lock'
import { ChevronLeftIcon } from './chevron-left'
import { ChevronRightIcon } from './chevron-right'
import { ChevronUpIcon } from './chevron-up'
import { ChevronsLeftIcon } from './chevrons-left'
import { ChevronsLeftRightIcon } from './chevrons-left-right'
import { ChevronsRightIcon } from './chevrons-right'
import { EllipsisIcon } from './ellipsis'
import { EllipsisVerticalIcon } from './ellipsis-vertical'
import { FileIcon } from './file'
import { FolderIcon } from './folder'
import { LayoutDashboardIcon } from './layout-dashboard'
import { MountainIcon } from './mountain'
import { SettingsIcon } from './settings'
import { LogOutIcon } from './log-out'
import { EyeIcon } from './eye'
import { ease, focusRing, Stage } from './story-kit'

const meta = {
  title: 'Icons/In context/Directions, places & keys',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Chevrons, double chevrons, diagonal arrows, ellipses, the dashboard, Caps Lock, anchor and mountain inside real product UI. Buttons, links and `data-yj-trigger` rows play their icon on hover or keyboard focus. The user menu at the foot of the sidebar turns its chevron-up over as it opens upward; a right-to-left tree turns chevron-left down into each open branch; the password field fills its Caps Lock key while the lock is on. Pagination holds its single chevrons still (`trigger="none"`) and nudges them with CSS, as the UI kit does; its first and last buttons run their double chevrons to the edge. Under "Motion: reduced" every state still reads, instantly.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>


function IconButton({ label, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn('inline-flex size-8 items-center justify-center rounded-md text-fg-muted hover:bg-hover hover:text-fg', ease, focusRing, className)}
      {...props}
    />
  )
}

/* ── Workspace ───────────────────────────────────────────────────────────── */

const NAV = [
  { Icon: LayoutDashboardIcon, label: 'Dashboard' },
  { Icon: AnchorIcon, label: 'Harbour' },
  { Icon: MountainIcon, label: 'Depots' },
] as const

const ROWS = [
  { id: 'SHP-2031', route: 'Rotterdam → Felixstowe', berth: 'Berth 12', eta: '06:40' },
  { id: 'SHP-2029', route: 'Antwerp → Hamburg', berth: 'Berth 4', eta: '09:15' },
  { id: 'SHP-2024', route: 'Le Havre → Bilbao', berth: 'Berth 7', eta: '11:05' },
]

const PAGES = 12

function pageItems(page: number): (number | 'gap')[] {
  if (page <= 3) return [1, 2, 3, 4, 'gap', PAGES]
  if (page >= PAGES - 2) return [1, 'gap', PAGES - 3, PAGES - 2, PAGES - 1, PAGES]
  return [1, 'gap', page - 1, page, page + 1, 'gap', PAGES]
}

function Pagination({ page, onPage }: { page: number; onPage: (p: number) => void }) {
  const edge = cn('group/edge inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm text-fg-muted hover:bg-hover hover:text-fg disabled:pointer-events-none disabled:opacity-40', ease, focusRing)
  const nudge = 'transition-transform duration-(--yj-duration-fast) ease-standard'
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-2 border-t border-line px-3 py-2.5">
      <p className="text-xs text-fg-muted">
        Page {page} of {PAGES}
      </p>
      <ul className="flex items-center gap-0.5">
        <li>
          <IconButton label="First page" disabled={page === 1} onClick={() => onPage(1)} className="disabled:pointer-events-none disabled:opacity-40">
            <ChevronsLeftIcon size={16} />
          </IconButton>
        </li>
        <li>
          <button type="button" className={edge} disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
            <ChevronLeftIcon size={16} trigger="none" className={cn(nudge, 'group-hover/edge:-translate-x-0.5')} />
          </button>
        </li>
        {pageItems(page).map((item, i) =>
          item === 'gap' ? (
            <li key={`gap-${i}`} aria-hidden className="flex size-8 items-center justify-center text-fg-subtle">
              <EllipsisIcon size={16} />
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onPage(item)}
                className={cn('h-8 min-w-8 rounded-md px-2 text-sm tabular-nums', ease, focusRing, item === page ? 'bg-selected font-medium text-fg shadow-xs' : 'text-fg-muted hover:bg-hover hover:text-fg')}
              >
                {item}
              </button>
            </li>
          ),
        )}
        <li>
          <button type="button" className={edge} disabled={page === PAGES} onClick={() => onPage(page + 1)} aria-label="Next page">
            <ChevronRightIcon size={16} trigger="none" className={cn(nudge, 'group-hover/edge:translate-x-0.5')} />
          </button>
        </li>
        <li>
          <IconButton label="Last page" disabled={page === PAGES} onClick={() => onPage(PAGES)} className="disabled:pointer-events-none disabled:opacity-40">
            <ChevronsRightIcon size={16} />
          </IconButton>
        </li>
      </ul>
    </nav>
  )
}

function UserMenu() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative mt-auto border-t border-line p-2">
      {open && (
        <ul role="menu" aria-label="Account" className="absolute inset-x-2 bottom-full mb-1 rounded-lg border border-line bg-overlay p-1 shadow-lg">
          {[
            { Icon: SettingsIcon, label: 'Settings' },
            { Icon: LogOutIcon, label: 'Sign out' },
          ].map(({ Icon, label }) => (
            <li key={label} role="none">
              <button type="button" role="menuitem" onClick={() => setOpen(false)} className={cn('flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm text-fg-muted hover:bg-surface hover:text-fg', ease, focusRing)}>
                <Icon size={16} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn('flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-start hover:bg-hover', ease, focusRing)}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-on-accent">MV</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-fg">Mara Visser</span>
          <span className="block truncate text-xs text-fg-muted">Port operations</span>
        </span>
        <ChevronUpIcon size={16} active={open} className="text-fg-muted" />
      </button>
    </div>
  )
}

function WorkspaceDemo() {
  const [nav, setNav] = useState('Dashboard')
  const [page, setPage] = useState(1)
  const [wide, setWide] = useState(false)
  return (
    <Stage>
      <div className="flex h-[560px] w-full max-w-[920px] overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <aside className="flex w-56 shrink-0 flex-col max-md:hidden border-e border-line bg-band">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold tracking-wide text-fg-subtle uppercase">Northsea Freight</p>
          <nav aria-label="Workspace" className="flex flex-col gap-0.5 px-2">
            {NAV.map(({ Icon, label }) => (
              <button
                key={label}
                type="button"
                aria-current={nav === label ? 'page' : undefined}
                onClick={() => setNav(label)}
                className={cn('flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm', ease, focusRing, nav === label ? 'bg-selected font-medium text-fg' : 'text-fg-muted hover:bg-hover hover:text-fg')}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>
          <UserMenu />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-line px-5 py-3.5">
            <a href="#overview" className={cn('inline-flex items-center gap-1.5 rounded-md text-xs text-fg-muted hover:text-fg', ease, focusRing)}>
              <ArrowUpLeftIcon size={14} />
              All regions
            </a>
            <h2 className="text-sm font-semibold text-fg">North Sea arrivals</h2>
            <span data-yj-trigger className="ms-auto inline-flex items-center gap-1 rounded-full bg-well px-2 py-0.5 text-xs text-success">
              <ArrowDownRightIcon size={13} strokeWidth={1.75} aria-label="Down" />
              4.2% dwell time
            </span>
          </header>

          <div className="relative min-h-0 flex-1 overflow-auto yj-scrollbar">
            <table className="w-full min-w-[520px] table-fixed border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-start text-xs text-fg-muted">
                  <th scope="col" className={cn('border-b border-line px-5 py-2 text-start font-medium', wide ? 'w-[46%]' : 'w-[34%]')}>
                    <span className="inline-flex items-center gap-1.5">
                      Route
                      <IconButton label={wide ? 'Narrow the route column' : 'Widen the route column'} aria-pressed={wide} onClick={() => setWide((w) => !w)} className="size-6">
                        <ChevronsLeftRightIcon size={14} active={wide} />
                      </IconButton>
                    </span>
                  </th>
                  <th scope="col" className="border-b border-line px-3 py-2 text-start font-medium">Shipment</th>
                  <th scope="col" className="border-b border-line px-3 py-2 text-start font-medium">Berth</th>
                  <th scope="col" className="border-b border-line px-3 py-2 text-end font-medium">ETA</th>
                  <th scope="col" className="w-12 border-b border-line">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.id} className="text-fg hover:bg-hover">
                    <td className="truncate border-b border-line px-5 py-2.5">{row.route}</td>
                    <td className="border-b border-line px-3 py-2.5 font-mono text-xs text-fg-muted">{row.id}</td>
                    <td className="border-b border-line px-3 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <AnchorIcon size={14} className="text-fg-subtle" />
                        {row.berth}
                      </span>
                    </td>
                    <td className="border-b border-line px-3 py-2.5 text-end tabular-nums">{row.eta}</td>
                    <td className="border-b border-line pe-2 text-end">
                      <IconButton label={`Actions for ${row.id}`}>
                        <EllipsisVerticalIcon size={16} />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-3 p-5">
              {[
                { Icon: AnchorIcon, title: 'Harbour 4', detail: 'Berths 1–14 · tide 2.1 m, rising' },
                { Icon: MountainIcon, title: 'Alpine depot', detail: 'Brenner pass · open, chains advised' },
              ].map(({ Icon, title, detail }) => (
                <article key={title} data-yj-trigger className="flex items-start gap-3 rounded-xl border border-line p-3.5 hover:bg-hover">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-well text-fg">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-fg">{title}</h3>
                    <p className="mt-0.5 text-xs text-fg-muted">{detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <Pagination page={page} onPage={setPage} />
          </div>
        </main>
      </div>
    </Stage>
  )
}

export const Workspace: Story = { render: () => <WorkspaceDemo /> }

/* ── Keys and trees ──────────────────────────────────────────────────────── */

function PasswordField() {
  const [caps, setCaps] = useState(false)
  const [shown, setShown] = useState(false)
  const read = (e: KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState('CapsLock'))
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="dir-password" className="text-sm font-medium text-fg">
        Password
      </label>
      <div className={cn('flex h-10 items-center gap-1 rounded-lg border border-line bg-canvas ps-3 pe-1 focus-within:ring-2 focus-within:ring-accent', ease)}>
        <input id="dir-password" type={shown ? 'text' : 'password'} defaultValue="harbour-lights" onKeyDown={read} onKeyUp={read} className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none" aria-describedby="dir-caps" />
        <span className={cn('flex size-8 items-center justify-center', caps ? 'text-warning' : 'text-fg-subtle')}>
          <CapsLockIcon size={16} active={caps} />
        </span>
        <IconButton label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown} onClick={() => setShown((s) => !s)}>
          <EyeIcon size={16} active={shown} />
        </IconButton>
      </div>
      <p id="dir-caps" role="status" className="min-h-4 text-xs text-fg-muted">
        {caps ? 'Caps Lock is on.' : ''}
      </p>
      <button type="button" aria-pressed={caps} onClick={() => setCaps((c) => !c)} className={cn('self-start rounded-md px-2 py-1 text-xs text-fg-muted hover:bg-hover hover:text-fg', ease, focusRing)}>
        Simulate Caps Lock {caps ? 'off' : 'on'}
      </button>
    </div>
  )
}

const TREE = [
  { name: 'مستندات', children: ['تقرير-الربع.pdf', 'الميزانية.xlsx'] },
  { name: 'الشحنات', children: ['روتردام.csv'] },
]

function RtlTree() {
  const [open, setOpen] = useState<Record<string, boolean>>({ مستندات: true })
  return (
    <div dir="rtl" lang="ar" className="rounded-xl border border-line p-2">
      <ul role="tree" aria-label="الملفات" className="flex flex-col gap-0.5 text-sm">
        {TREE.map((branch) => {
          const expanded = Boolean(open[branch.name])
          return (
            <li key={branch.name} role="treeitem" aria-expanded={expanded} aria-selected={false}>
              <button type="button" onClick={() => setOpen((o) => ({ ...o, [branch.name]: !expanded }))} className={cn('flex h-8 w-full items-center gap-1.5 rounded-md px-1.5 text-fg hover:bg-hover', ease, focusRing)}>
                <ChevronLeftIcon size={14} strokeWidth={2} active={expanded} className="text-fg-muted" />
                <FolderIcon size={16} active={expanded} className="text-fg-muted" />
                {branch.name}
              </button>
              {expanded && (
                <ul role="group" className="flex flex-col gap-0.5 ps-8">
                  {branch.children.map((file) => (
                    <li key={file} role="treeitem" aria-selected={false} className="flex h-7 items-center gap-1.5 text-fg-muted">
                      <FileIcon size={15} />
                      {file}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export const KeysAndTrees: Story = {
  name: 'Keys and trees',
  render: () => (
    <Stage>
      <div className="grid w-full max-w-[720px] gap-6 rounded-2xl border border-line bg-surface p-6 shadow-sm md:grid-cols-2">
        <PasswordField />
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-fg">Files, right to left</p>
          <RtlTree />
          <p className="text-xs text-fg-muted">chevron-left turns a quarter to point down into each open branch.</p>
        </div>
      </div>
    </Stage>
  ),
}

/* ── Reduced motion ──────────────────────────────────────────────────────── */

export const ReducedMotion: Story = {
  name: 'Reduced motion',
  parameters: { docs: { description: { story: 'The same icons under reduced motion: hover icons hold their resting pose, and every state switches instantly.' } } },
  globals: { reducedMotion: 'always' },
  render: () => <WorkspaceDemo />,
}
