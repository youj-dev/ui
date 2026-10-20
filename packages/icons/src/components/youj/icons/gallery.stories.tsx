import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useYouj } from '@youj/core'
import { cn } from '@youj/core'
import { icons, CheckIcon, SearchIcon, ICON_CATEGORIES, type IconCategory, type IconTrigger, type YoujIconComponent } from './index'

const CATEGORIES: readonly IconCategory[] = ICON_CATEGORIES
const byName = Object.fromEntries(icons.map((I) => [I.meta.name, I]))
const componentName = (I: YoujIconComponent) => I.displayName ?? 'Icon'
const importLine = (I: YoujIconComponent) => `import { ${componentName(I)} } from '@youj/icons'`
const cliLine = (I: YoujIconComponent) => `pnpm dlx shadcn@latest add ${window.location.origin}/r/icon-${I.meta.name}.json`

const meta = {
  title: 'Icons/Gallery',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          `The youj icon set: ${icons.length} original icons on a 24px grid (2px live-area padding, 1.5 stroke, round caps and joins, \`currentColor\`), each with its own choreography. Every icon takes \`size\`, \`strokeWidth\`, \`className\`, \`aria-label\` (decorative by default) and \`trigger: hover | mount | loop | none\`. Hover also fires from a hovered or keyboard-focused parent button, or any \`data-yj-trigger\` ancestor. State icons (menu ↔ close, play ↔ pause…) take a controlled \`active\`. Under reduced motion, icons hold their resting pose and state icons switch instantly. Hover a tile to preview, click to copy the import line or the registry command.`,
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/* ── Pieces ──────────────────────────────────────────────────────────────── */

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string; count?: number }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-lg border border-line bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors duration-(--yj-duration-fast) ease-standard outline-none focus-visible:ring-2 focus-visible:ring-accent',
            value === o.value ? 'bg-selected text-fg' : 'text-fg-muted hover:text-fg',
          )}
        >
          {o.label}
          {o.count !== undefined && <span className={cn('ml-1.5 font-mono text-[10px]', value === o.value ? 'text-fg-muted' : 'text-fg-subtle')}>{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

function Slider({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string }) {
  return (
    <label className="flex items-center gap-2.5 text-xs text-fg-muted">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-24 cursor-pointer accent-(--color-accent)"
      />
      <span className="w-9 font-mono text-[11px] text-fg">{format(value)}</span>
    </label>
  )
}

/** 24×24 keyline grid behind the inspector preview: pixel grid, 2px live area, 9 and 3 radius circles. */
function Keylines() {
  return (
    <svg viewBox="0 0 24 24" className="absolute inset-0 size-full text-line" fill="none" stroke="currentColor" aria-hidden>
      {Array.from({ length: 23 }, (_, i) => (
        <g key={i} strokeWidth={0.03}>
          <path d={`M${i + 1} 0 V24`} />
          <path d={`M0 ${i + 1} H24`} />
        </g>
      ))}
      <g strokeWidth={0.06} className="text-line-strong">
        <rect x="2" y="2" width="20" height="20" />
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3" />
        <path d="M2 2 L22 22 M22 2 L2 22" />
      </g>
    </svg>
  )
}

function Inspector({ icon: Icon, strokeWidth, copyMode }: { icon: YoujIconComponent; strokeWidth: number; copyMode: CopyMode }) {
  // State icons loop through their morph until the toggle takes manual control.
  const [manual, setManual] = useState<boolean | undefined>(undefined)
  const stateful = Boolean(Icon.meta.states)
  useEffect(() => setManual(undefined), [Icon])
  const active = manual ?? false

  return (
    <aside className="sticky top-24 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-canvas">
        <Keylines />
        <Icon key={Icon.meta.name} size="100%" strokeWidth={strokeWidth} trigger="loop" active={manual} className="absolute inset-0 text-fg" />
      </div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm text-fg">{Icon.meta.name}</p>
          <p className="mt-0.5 text-xs capitalize text-fg-subtle">{Icon.meta.category}</p>
        </div>
        {stateful && (
          <button
            type="button"
            onClick={() => setManual(!active)}
            className="rounded-md border border-line px-2 py-1 font-mono text-[11px] text-fg-muted transition-colors duration-(--yj-duration-fast) ease-standard hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {Icon.meta.states![active ? 1 : 0]} ↔ {Icon.meta.states![active ? 0 : 1]}
          </button>
        )}
      </div>
      <p className="text-xs leading-relaxed text-fg-muted">{Icon.meta.keywords.join(' · ')}</p>
      <code className="block rounded-lg bg-well px-3 py-2.5 font-mono text-[11px] leading-relaxed break-all text-fg-muted">
        {copyMode === 'import' ? importLine(Icon) : `shadcn add icon-${Icon.meta.name}`}
      </code>
    </aside>
  )
}

type CopyMode = 'import' | 'cli'

// Memoised with stable handlers: hovering a tile updates the inspector, and
// without this every one of the ~200 tiles (and its icon) re-rendered per hover.
const Tile = memo(function Tile({
  icon: Icon,
  size,
  strokeWidth,
  onPreview,
  onCopy,
}: {
  icon: YoujIconComponent
  size: number
  strokeWidth: number
  onPreview: (I: YoujIconComponent) => void
  onCopy: (I: YoujIconComponent) => void
}) {
  return (
    <button
      type="button"
      onPointerEnter={() => onPreview(Icon)}
      onFocus={() => onPreview(Icon)}
      onClick={() => onCopy(Icon)}
      aria-label={`${Icon.meta.name} icon, copy`}
      className="group relative flex h-24 flex-col items-center justify-center gap-3 rounded-xl border border-transparent text-fg-muted transition-colors duration-(--yj-duration-fast) ease-standard outline-none hover:border-line hover:bg-surface hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"
    >
      <Icon size={size} strokeWidth={strokeWidth} />
      <span className="flex max-w-full items-center gap-1.5 truncate px-2 font-mono text-[10.5px] text-fg-subtle transition-colors duration-(--yj-duration-fast) ease-standard group-hover:text-fg-muted">
        {Icon.meta.name}
        {Icon.meta.states && <span className="size-1 shrink-0 rounded-full bg-accent" title="State icon: takes a controlled active prop" />}
      </span>
    </button>
  )
})

function Toast({ message }: { message: { text: string; id: number } | null }) {
  if (!message) return null
  return (
    <div
      key={message.id}
      role="status"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-line bg-overlay py-2 pr-4 pl-3 text-sm text-fg shadow-lg"
    >
      <span className="text-success">
        <CheckIcon size={18} strokeWidth={2} trigger="mount" />
      </span>
      {message.text}
    </div>
  )
}

/* ── Gallery ─────────────────────────────────────────────────────────────── */

function GalleryView() {
  const k = useYouj()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<IconCategory | 'all'>('all')
  const [size, setSize] = useState(24)
  const [strokeWidth, setStrokeWidth] = useState(1.5)
  const [copyMode, setCopyMode] = useState<CopyMode>('import')
  const [preview, setPreview] = useState<YoujIconComponent>(() => byName['check']!)
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return icons.filter(
      (I) =>
        (category === 'all' || I.meta.category === category) &&
        (!q || I.meta.name.includes(q) || I.meta.category.includes(q) || I.meta.keywords.some((w) => w.includes(q))),
    )
  }, [query, category])

  const sections = category === 'all' && !query ? CATEGORIES.map((c) => ({ c, list: matches.filter((I) => I.meta.category === c) })).filter((s) => s.list.length > 0) : [{ c: null, list: matches }]

  const showPreview = useCallback((I: YoujIconComponent) => setPreview(() => I), [])
  const copy = useCallback(async (I: YoujIconComponent) => {
    const text = copyMode === 'import' ? importLine(I) : cliLine(I)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard can be blocked inside the Storybook iframe; the toast still confirms the intent.
    }
    clearTimeout(toastTimer.current)
    setToast({ text: copyMode === 'import' ? `Copied import for ${I.meta.name}` : `Copied shadcn command for ${I.meta.name}`, id: Date.now() })
    toastTimer.current = setTimeout(() => setToast(null), k.ms('deliberate') * 3)
  }, [copyMode, k])

  return (
    <div className="min-h-screen bg-canvas px-5 pt-10 pb-24 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="font-mono text-[11px] tracking-[0.18em] text-fg-subtle uppercase">youj / icons</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg">Icons that move with intent</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-muted">
            {icons.length} original icons on a 24px grid. Every one has its own choreography, not a shared effect. Hover to preview, click to copy.
          </p>
        </header>

        <div className="sticky top-0 z-20 -mx-2 mb-6 flex flex-wrap items-center gap-3 border-b border-line bg-canvas/85 youj-allow-glass px-2 py-3 backdrop-blur">
          <label data-yj-trigger className="flex h-9 min-w-56 flex-1 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-fg-subtle focus-within:ring-2 focus-within:ring-accent">
            <SearchIcon size={16} strokeWidth={1.75} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search icons, e.g. delete, sync, dark mode"
              aria-label="Search icons"
              className="h-full w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
            />
            <span className="font-mono text-[11px]">{matches.length}</span>
          </label>
          <Segmented
            label="Category"
            value={category}
            onChange={setCategory}
            options={[{ value: 'all' as const, label: 'All', count: icons.length }, ...CATEGORIES.map((c) => ({ value: c, label: c, count: icons.filter((I) => I.meta.category === c).length })).filter((o) => o.count > 0)]}
          />
          <div className="flex flex-wrap items-center gap-4">
            <Slider label="Size" value={size} min={16} max={48} step={4} onChange={setSize} format={(v) => `${v}px`} />
            <Slider label="Stroke" value={strokeWidth} min={1} max={2.5} step={0.25} onChange={setStrokeWidth} format={(v) => v.toFixed(2)} />
            <Segmented
              label="Copy"
              value={copyMode}
              onChange={setCopyMode}
              options={[
                { value: 'import' as const, label: 'Import' },
                { value: 'cli' as const, label: 'CLI' },
              ]}
            />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex flex-col gap-10">
            {sections.map(({ c, list }) => (
              <section key={c ?? 'results'} aria-label={c ?? 'Results'}>
                {c && (
                  <h2 className="mb-3 flex items-baseline gap-2 text-xs font-medium tracking-wide text-fg-muted capitalize">
                    {c}
                    <span className="font-mono text-[10px] text-fg-subtle">{list.length}</span>
                  </h2>
                )}
                {list.length ? (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-1.5">
                    {list.map((I) => (
                      <Tile key={I.meta.name} icon={I} size={size} strokeWidth={strokeWidth} onPreview={showPreview} onCopy={copy} />
                    ))}
                  </div>
                ) : (
                  <p className="py-16 text-center text-sm text-fg-muted">No icons match “{query}”.</p>
                )}
              </section>
            ))}
          </div>
          <div className="hidden lg:block">
            <Inspector icon={preview} strokeWidth={strokeWidth} copyMode={copyMode} />
          </div>
        </div>
      </div>
      <Toast message={toast} />
    </div>
  )
}

export const Gallery: Story = {
  render: () => <GalleryView />,
}

/* ── Playground ──────────────────────────────────────────────────────────── */

interface PlaygroundArgs {
  icon: string
  trigger: IconTrigger
  controlled: boolean
  active: boolean
  size: number
  strokeWidth: number
}

export const Playground: StoryObj<PlaygroundArgs> = {
  args: { icon: 'bell', trigger: 'hover', controlled: false, active: false, size: 96, strokeWidth: 1.5 },
  argTypes: {
    icon: { control: 'select', options: icons.map((I) => I.meta.name) },
    trigger: { control: 'inline-radio', options: ['hover', 'mount', 'loop', 'none'] },
    controlled: { description: 'Drive the icon with `active` instead of the trigger' },
    active: { if: { arg: 'controlled' } },
    size: { control: { type: 'range', min: 16, max: 192, step: 8 } },
    strokeWidth: { control: { type: 'range', min: 0.75, max: 3, step: 0.25 } },
  },
  parameters: {
    docs: {
      description: {
        story: 'One icon, every prop. Switch the toolbar to "Motion: reduced" to see the reduced-motion pose: resting icons stay still, state icons jump straight to their state.',
      },
    },
  },
  render: ({ icon, trigger, controlled, active, size, strokeWidth }) => {
    const Icon = byName[icon] ?? CheckIcon
    return (
      <div className="flex flex-col items-center gap-4 p-10 text-fg">
        <div className="rounded-2xl border border-line bg-surface p-8">
          <Icon key={`${icon}-${trigger}`} size={size} strokeWidth={strokeWidth} trigger={trigger} active={controlled ? active : undefined} aria-label={icon} />
        </div>
        <p className="font-mono text-xs text-fg-subtle">
          {`<${componentName(Icon)} trigger="${trigger}"${controlled ? ` active={${active}}` : ''} />`}
        </p>
      </div>
    )
  },
}
