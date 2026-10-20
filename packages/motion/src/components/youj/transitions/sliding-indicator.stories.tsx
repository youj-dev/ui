import { Fragment, useId, useState, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Activity, Boxes, GitBranch, LayoutGrid, Settings2 } from 'lucide-react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { cn } from '@youj/core/lib/youj/cn'
import { SlidingIndicator, type SlidingIndicatorProps } from './sliding-indicator'

const meta: Meta<SlidingIndicatorProps> = {
  title: 'Motion/Transitions/SlidingIndicator',
  component: SlidingIndicator,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'One highlight per group that glides between items: tabs, segmented controls, toggle groups, nav. Drop `<SlidingIndicator />` inside the group container (`relative isolate`); it finds the active item from the attributes a selected item exposes anyway (`aria-selected`, `aria-current`, `aria-pressed`, `aria-checked`, Base UI `data-active` / `data-pressed` / `data-checked`), or follows the pointer and keyboard focus with `follow="hover"`. The glide is Motion layout projection on the `smooth` spring: transform-only, corners kept round mid-flight, and a new target mid-glide retargets from where it is, carrying its velocity. With `linger`, losing the target holds the highlight for the fast token before it fades, so a pointer crossing a separator or a group label carries it on to the next item in one glide (menus). Resizes, font loads and RTL re-place it without motion. Reduced motion jumps, and does not linger.',
      },
    },
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['pill', 'underline'] },
    follow: { control: 'inline-radio', options: ['active', 'hover'] },
    match: { control: 'text' },
    linger: { control: 'boolean' },
  },
  args: { variant: 'pill', follow: 'active', linger: false },
}
export default meta
type Story = StoryObj<SlidingIndicatorProps>

const TABS = ['Overview', 'Deployments', 'Analytics', 'Logs', 'Settings']
const NAV = [
  { label: 'Projects', icon: LayoutGrid },
  { label: 'Integrations', icon: Boxes },
  { label: 'Activity', icon: Activity },
  { label: 'Settings', icon: Settings2 },
]
const RANGES = ['1h', '24h', '7d', '30d', '90d']

const itemBase =
  'rounded-md outline-none transition-colors yj-duration-fast ease-standard focus-visible:ring-2 focus-visible:ring-accent'

/** Tabs: role=tab + aria-selected. The underline follows the selection; arrow keys move it too. */
function Tabs({ indicator, initial = 1 }: { indicator?: Partial<SlidingIndicatorProps>; initial?: number }) {
  const [active, setActive] = useState(initial)
  return (
    <div
      role="tablist"
      aria-label="Project sections"
      className="relative isolate flex gap-1 border-b border-line px-3"
      onKeyDown={(e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
        const next = (active + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length
        setActive(next)
        ;(e.currentTarget.querySelectorAll('[role=tab]')[next] as HTMLElement).focus()
      }}
    >
      {TABS.map((tab, i) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === i}
          tabIndex={active === i ? 0 : -1}
          onClick={() => setActive(i)}
          className={cn(itemBase, 'my-1.5 px-3 py-1.5 text-sm', active === i ? 'text-fg' : 'text-fg-muted hover:text-fg')}
        >
          {tab}
        </button>
      ))}
      <SlidingIndicator variant="underline" className="-mb-px" {...indicator} />
    </div>
  )
}

/** Segmented control: a radiogroup, so aria-checked marks the selection. */
function Segmented({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Time range" className="relative isolate inline-flex rounded-lg bg-well p-0.5">
      <SlidingIndicator className="rounded-[7px] bg-key shadow-sm ring-1 ring-line" />
      {RANGES.map((r) => (
        <button
          key={r}
          type="button"
          role="radio"
          aria-checked={value === r}
          onClick={() => onChange(r)}
          className={cn(
            itemBase,
            'h-7 min-w-11 px-2.5 font-mono text-xs tabular-nums',
            value === r ? 'text-fg' : 'text-fg-muted hover:text-fg',
          )}
        >
          {r}
        </button>
      ))}
    </div>
  )
}

/** Nav: aria-current marks the page; a hover pill tracks the pointer and keyboard focus on top of it. */
function Nav() {
  const [page, setPage] = useState('Projects')
  return (
    <nav aria-label="Main" className="relative isolate flex items-center gap-0.5">
      <SlidingIndicator follow="hover" />
      {NAV.map(({ label, icon: Icon }) => (
        <a
          key={label}
          href={`#${label.toLowerCase()}`}
          aria-current={page === label ? 'page' : undefined}
          onClick={(e) => {
            e.preventDefault()
            setPage(label)
          }}
          className={cn(
            itemBase,
            'inline-flex h-8 items-center gap-1.5 px-2.5 text-[13px]',
            page === label ? 'text-fg' : 'text-fg-muted hover:text-fg',
          )}
        >
          <Icon aria-hidden className="size-3.5" />
          {label}
        </a>
      ))}
    </nav>
  )
}

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('w-full max-w-[680px] overflow-hidden rounded-2xl border border-line bg-surface', className)}>{children}</div>
}

function ProjectHeader() {
  const [range, setRange] = useState('24h')
  return (
    <Frame>
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="grid size-6 place-items-center rounded-md bg-fg text-[11px] font-semibold text-canvas">a</span>
          <span className="font-medium text-fg">acme</span>
          <span className="text-fg-subtle">/</span>
          <span className="inline-flex items-center gap-1.5 text-fg">
            <GitBranch aria-hidden className="size-3.5 text-fg-subtle" />
            web
          </span>
        </div>
        <Nav />
      </div>
      <Tabs />
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div>
          <p className="text-sm font-medium text-fg">Requests</p>
          <p className="mt-0.5 font-mono text-xs text-fg-muted">p95 82 ms · 0.02% errors</p>
        </div>
        <Segmented value={range} onChange={setRange} />
      </div>
      <div className="flex h-24 items-end gap-1 px-5 pb-5" aria-hidden>
        {Array.from({ length: 36 }, (_, i) => (
          <span
            key={i}
            className="flex-1 rounded-sm bg-accent-line"
            style={{ height: `${30 + Math.round(45 * Math.abs(Math.sin(i * 0.7 + RANGES.indexOf(range))))}%` }}
          />
        ))}
      </div>
    </Frame>
  )
}

/** A project header: nav with a hover pill (move across it, or Tab through), tabs with an underline, and a segmented range. */
export const Hero: Story = {
  render: () => <ProjectHeader />,
}

export const Playground: Story = {
  render: (args) => (
    <Frame className="w-full max-w-[560px]">
      <Tabs indicator={args} />
      <p className="px-5 py-4 text-sm text-fg-muted">Switch variant and follow mode in Controls.</p>
    </Frame>
  ),
}

/** Items that grow while selected, a group that reflows: the indicator re-places without gliding, then glides on selection. */
export const ResizeAndLongLabels: Story = {
  render: () => {
    function Demo() {
      const [count, setCount] = useState(3)
      const [wide, setWide] = useState(false)
      const [active, setActive] = useState('Inbox')
      const items = [`Inbox${count ? ` ${count}` : ''}`, 'Assigned to me', 'Created', 'A very long saved view name']
      return (
        <div className="flex flex-col items-start gap-4">
          <div className="flex gap-2">
            <button type="button" onClick={() => setCount((c) => c + 7)} className="rounded-md border border-line px-2.5 py-1 text-xs text-fg-muted hover:text-fg">
              More unread
            </button>
            <button type="button" onClick={() => setWide((w) => !w)} className="rounded-md border border-line px-2.5 py-1 text-xs text-fg-muted hover:text-fg">
              Toggle width
            </button>
          </div>
          <div
            role="tablist"
            aria-label="Views"
            className={cn('relative isolate flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1', wide ? 'w-full max-w-[620px]' : 'w-full max-w-[380px]')}
          >
            <SlidingIndicator />
            {items.map((label) => {
              const key = label.startsWith('Inbox') ? 'Inbox' : label
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active === key}
                  onClick={() => setActive(key)}
                  className={cn(itemBase, 'px-3 py-1.5 text-sm', active === key ? 'text-fg' : 'text-fg-muted hover:text-fg')}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )
    }
    return <Demo />
  },
}

/** dir="rtl": positions are measured, so the glide runs right to left with no extra work. */
export const RightToLeft: Story = {
  render: () => {
    function Demo() {
      const [range, setRange] = useState('7d')
      return (
        <div dir="rtl" className="flex flex-col items-start gap-6">
          <Frame className="w-full max-w-[520px]">
            <Tabs initial={0} />
            <p className="px-5 py-4 text-sm text-fg-muted">Right to left</p>
          </Frame>
          <Segmented value={range} onChange={setRange} />
        </div>
      )
    }
    return <Demo />
  },
}

const MENU = [
  { label: 'Project', items: ['Open', 'Rename', 'Duplicate'] },
  { label: 'Move to', items: ['Design', 'Platform'] },
  { items: ['Archive', 'Delete'] },
]
const MENU_ITEMS = MENU.flatMap((group) => group.items)

/** A menu as Base UI drives one: the row under the pointer (or picked with ↑ ↓) is data-highlighted; separators, labels and padding highlight nothing. */
function ActionMenu({ title, linger }: { title: string; linger: boolean }) {
  const id = useId()
  const [active, setActive] = useState<string | null>(null)
  const step = (by: number) => setActive((a) => MENU_ITEMS[(MENU_ITEMS.indexOf(a ?? '') + by + MENU_ITEMS.length) % MENU_ITEMS.length] ?? null)
  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 font-mono text-[11px] text-fg-muted">{title}</p>
      <div
        role="menu"
        aria-label={title}
        aria-activedescendant={active ? `${id}-${active}` : undefined}
        tabIndex={0}
        onPointerMove={(e) => setActive((e.target as Element).closest('[role=menuitem]')?.textContent ?? null)}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
          e.preventDefault()
          step(e.key === 'ArrowDown' ? 1 : -1)
        }}
        className="relative isolate flex w-52 flex-col rounded-xl border border-line bg-surface p-1 shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {MENU.map((group, g) => (
          <Fragment key={g}>
            {g > 0 && <div role="separator" className="-mx-1 my-1 h-px bg-line" />}
            <div role="group" aria-labelledby={group.label && `${id}-group-${g}`} className="flex flex-col">
              {group.label && (
                <div id={`${id}-group-${g}`} className="px-2 pt-1.5 pb-1 text-[11px] font-medium tracking-wide text-fg-muted uppercase">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => (
                <div
                  key={item}
                  id={`${id}-${item}`}
                  role="menuitem"
                  data-highlighted={active === item ? '' : undefined}
                  className={cn('flex h-8 items-center rounded-md px-2 text-[13px]', item === 'Delete' ? 'text-danger' : active === item ? 'text-fg' : 'text-fg-muted')}
                >
                  {item}
                </div>
              ))}
            </div>
          </Fragment>
        ))}
        <SlidingIndicator match="[data-highlighted]" linger={linger} />
      </div>
    </div>
  )
}

/** `linger`: sweep down both menus. On the left the highlight holds for a beat over each separator and label and glides on to the next row; on the right it blinks out and fades back in. */
export const Linger: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-8">
      <ActionMenu title="linger" linger />
      <ActionMenu title="without linger" linger={false} />
    </div>
  ),
}

/** Two groups side by side, each with its own indicator: they never fight. */
export const IndependentGroups: Story = {
  render: () => {
    function Demo() {
      const [a, setA] = useState('24h')
      const [b, setB] = useState('90d')
      return (
        <div className="flex flex-col items-center gap-4">
          <Segmented value={a} onChange={setA} />
          <Segmented value={b} onChange={setB} />
        </div>
      )
    }
    return <Demo />
  },
}

/** Reduced motion: the indicator jumps to the new item and the hover pill appears without a fade. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <ProjectHeader />
    </YoujProvider>
  ),
}
