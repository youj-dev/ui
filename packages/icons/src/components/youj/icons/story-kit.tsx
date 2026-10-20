import { useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn, useYouj } from '@youj/core'
import type { YoujIconComponent } from './icon-base'

/* Storybook-only helpers the icon stories share. Not a registry item. */

/* ── Shared UI ───────────────────────────────────────────────────────────── */

export const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-accent'
export const ease = 'transition-colors duration-(--yj-duration-fast) ease-standard'

/** A centered full-screen stage for one demo. */
export function Stage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex min-h-screen items-center justify-center bg-canvas p-4 md:p-10', className)}>{children}</div>
}

/** A full-screen page for a stack of sections. */
export function PageStage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('min-h-screen bg-canvas px-4 py-10 sm:px-8', className)}>{children}</div>
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border border-line bg-surface shadow-sm', className)}>{children}</div>
}

export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({ variant = 'secondary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
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
        variant === 'danger' && 'text-fg-muted hover:bg-hover hover:text-danger',
        className,
      )}
      {...props}
    />
  )
}

export function IconButton({
  label,
  className,
  variant = 'ghost',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; variant?: Variant }) {
  return <Button variant={variant} aria-label={label} title={label} className={cn('w-9 justify-center px-0', className)} {...props} />
}

/* ── Timers ──────────────────────────────────────────────────────────────── */

/** A flag that turns itself off after a beat, e.g. "copied". */
export function useFlash(beats = 3): [boolean, () => void] {
  const k = useYouj()
  const [on, setOn] = useState(false)
  const t = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(t.current), [])
  return [
    on,
    () => {
      clearTimeout(t.current)
      setOn(true)
      t.current = setTimeout(() => setOn(false), k.ms('deliberate') * beats)
    },
  ]
}

/** Runs a callback after a number of beats; a new call cancels the pending one. */
export function useLater() {
  const k = useYouj()
  const t = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(t.current), [])
  return (fn: () => void, beats: number) => {
    clearTimeout(t.current)
    t.current = setTimeout(fn, k.ms('deliberate') * beats)
  }
}

/* ── Morphs ──────────────────────────────────────────────────────────────── */

export interface MorphArgs {
  auto: boolean
}

/** The args and controls every Morphs page shares. */
export const morphMeta = {
  tags: ['autodocs'],
  args: { auto: false },
  argTypes: { auto: { description: 'Flip every icon on a slow cycle' } },
}

/** The parameters every Morphs page shares; `component` is the docs description. */
export const morphParameters = (component: string) => ({
  layout: 'fullscreen' as const,
  docs: { description: { component } },
})

export const autoplayParameters = { docs: { description: { story: 'Flips every icon on a slow cycle. Stops under reduced motion.' } } }

export interface MorphGroup {
  title: string
  note?: string
  icons: YoujIconComponent[]
}

function MorphCard({
  icon: Icon,
  active,
  onToggle,
  size,
  strokeWidth,
  showName,
}: {
  icon: YoujIconComponent
  active: boolean
  onToggle: () => void
  size: number
  strokeWidth?: number
  showName: boolean
}) {
  const [from, to] = Icon.meta.states!
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`${Icon.meta.name}: ${active ? to : from}`}
      onClick={onToggle}
      className={cn(
        'group flex flex-col items-center gap-5 rounded-2xl border bg-surface px-4 pt-8 pb-5 transition-colors duration-(--yj-duration-fast) ease-standard outline-none focus-visible:ring-2 focus-visible:ring-accent',
        active ? 'border-line-strong text-fg' : 'border-line text-fg-muted hover:text-fg',
      )}
    >
      <Icon size={size} strokeWidth={strokeWidth} active={active} />
      <span className="flex flex-col items-center gap-1">
        {showName && <span className="font-mono text-[11px] text-fg-muted">{Icon.meta.name}</span>}
        <span className="flex flex-wrap items-center justify-center gap-x-1.5 font-mono text-[11px]">
          <span className={cn('whitespace-nowrap', active ? 'text-fg-muted' : 'text-fg')}>{from}</span>
          <span className="text-fg-muted" aria-hidden>
            ↔
          </span>
          <span className={cn('whitespace-nowrap', active ? 'text-fg' : 'text-fg-muted')}>{to}</span>
        </span>
      </span>
    </button>
  )
}

/** A page of state icons, each a card that toggles between its two states. Pass `groups` for labelled sections or `icons` for one flat grid. */
export function MorphsView({
  auto,
  groups,
  icons,
  heading,
  intro,
  iconSize = 40,
  strokeWidth,
  minCol = 150,
  showName = true,
}: {
  auto: boolean
  groups?: MorphGroup[]
  icons?: YoujIconComponent[]
  heading: ReactNode
  intro: ReactNode
  iconSize?: number
  strokeWidth?: number
  minCol?: number
  showName?: boolean
}) {
  const k = useYouj()
  const all = useMemo(() => icons ?? groups!.flatMap((g) => g.icons), [icons, groups])
  const [state, setState] = useState<Record<string, boolean>>({})
  const every = all.every((I) => state[I.meta.name])

  useEffect(() => {
    if (!auto || k.reduced) return
    const t = setInterval(() => setState((s) => Object.fromEntries(all.map((I) => [I.meta.name, !s[I.meta.name]]))), k.ms('deliberate') * 3)
    return () => clearInterval(t)
  }, [auto, k, all])

  const grid = (list: YoujIconComponent[]) => (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fill,minmax(${minCol}px,1fr))` }}>
      {list.map((I) => (
        <MorphCard
          key={I.meta.name}
          icon={I}
          active={Boolean(state[I.meta.name])}
          onToggle={() => setState((s) => ({ ...s, [I.meta.name]: !s[I.meta.name] }))}
          size={iconSize}
          strokeWidth={strokeWidth}
          showName={showName}
        />
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-canvas px-6 py-10 md:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-fg-muted uppercase">youj / icons / morphs</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">{heading}</h1>
            <p className="mt-1.5 max-w-xl text-sm text-fg-muted">{intro}</p>
          </div>
          <button
            type="button"
            onClick={() => setState(Object.fromEntries(all.map((I) => [I.meta.name, !every])))}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {every ? 'Reset all' : 'Toggle all'}
          </button>
        </div>
        {groups ? (
          <div className="flex flex-col gap-8">
            {groups.map((g) => (
              <section key={g.title} aria-label={g.title}>
                <h2 className="mb-3 flex items-baseline gap-2 text-xs font-medium tracking-wide text-fg-muted">
                  {g.title}
                  {g.note && <span className="font-normal">{g.note}</span>}
                </h2>
                {grid(g.icons)}
              </section>
            ))}
          </div>
        ) : (
          grid(all)
        )}
      </div>
    </div>
  )
}
