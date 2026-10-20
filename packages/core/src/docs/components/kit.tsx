import { useCallback, useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react'
import { motion } from 'motion/react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { cn } from '../../lib/youj/cn'
import { useYouj } from '../../lib/youj/provider'

/* Shared building blocks for the docs pages: panels, a segmented token
 * picker, replay controls, and hooks that restart demos when the toolbar
 * Motion/Speed controls change. */

/** A key that changes on replay() and whenever speed or reduced motion changes. */
export function useReplay(): [string, () => void] {
  const k = useYouj()
  const [n, setN] = useState(0)
  const replay = useCallback(() => setN((v) => v + 1), [])
  return [`${n}-${k.timeScale}-${k.reduced}`, replay]
}

/** Tracks the `data-theme` attribute on <html>, which the toolbar sets. */
export function useDataTheme() {
  const [theme, setTheme] = useState<string | null>(null)
  useEffect(() => {
    const el = document.documentElement
    const read = () => setTheme(el.getAttribute('data-theme'))
    read()
    const mo = new MutationObserver(read)
    mo.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [])
  return theme
}

/** Changes whenever the toolbar's Theme or Preset changes (data-theme / data-yj-theme on <html>). */
export function useThemeKey() {
  const [key, setKey] = useState('')
  useEffect(() => {
    const el = document.documentElement
    const read = () => setKey(`${el.getAttribute('data-theme')}|${el.getAttribute('data-yj-theme')}`)
    read()
    const mo = new MutationObserver(read)
    mo.observe(el, { attributes: true, attributeFilter: ['data-theme', 'data-yj-theme'] })
    return () => mo.disconnect()
  }, [])
  return key
}

export function useInView(ref: RefObject<Element | null>) {
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? true))
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return inView
}

/** Calls `fn` every `ms` while mounted and visible. Stops under reduced motion. */
export function useCycle(ms: number, ref: RefObject<Element | null>) {
  const k = useYouj()
  const inView = useInView(ref)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (k.reduced || !inView) return
    const id = window.setInterval(() => {
      if (!document.hidden) setTick((t) => t + 1)
    }, ms)
    return () => window.clearInterval(id)
  }, [ms, k.reduced, inView])
  return tick
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-xl border border-line bg-surface', className)}>{children}</div>
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-fg-muted">{children}</div>
}

export function Mono({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn('font-mono text-[12px] tabular-nums text-fg-muted', className)}>{children}</span>
}

const buttonClass =
  'inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-[13px] font-medium text-fg ' +
  'transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-hover ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas'

export function ReplayButton({ onClick, label = 'Replay' }: { onClick: () => void; label?: string }) {
  const k = useYouj()
  const [turns, setTurns] = useState(0)
  return (
    <button
      type="button"
      className={buttonClass}
      onClick={() => {
        setTurns((t) => t + 1)
        onClick()
      }}
    >
      <motion.span
        aria-hidden
        className="inline-flex"
        animate={{ rotate: -360 * turns }}
        transition={k.reduced ? { duration: 0 } : k.tween('slow', 'standard')}
      >
        <RotateCcw size={14} strokeWidth={2} />
      </motion.span>
      {label}
    </button>
  )
}

export function PlayPauseButton({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={buttonClass} onClick={onToggle} aria-pressed={!playing}>
      {playing ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}
      {playing ? 'Pause' : 'Play'}
    </button>
  )
}

/** Toggle-button group with a sliding indicator (snappy spring). */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  format = (v) => v,
}: {
  label: string
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  format?: (v: T) => ReactNode
}) {
  const k = useYouj()
  const id = useId()
  return (
    <div role="group" aria-label={label} className="inline-flex h-8 items-center rounded-md border border-line bg-well p-0.5">
      {options.map((opt) => {
        const active = opt === value
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt)}
            className={cn(
              'relative h-full rounded-[5px] px-2.5 text-[12px] font-medium transition-colors duration-(--yj-duration-fast) ease-standard',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              active ? 'text-fg' : 'text-fg-muted hover:text-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                aria-hidden
                className="absolute inset-0 rounded-[5px] border border-line bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.08)]"
                transition={k.reduced ? { duration: 0 } : k.spring('snappy')}
              />
            )}
            <span className="relative">{format(opt)}</span>
          </button>
        )
      })}
    </div>
  )
}

export function ReducedNote() {
  const k = useYouj()
  if (!k.reduced) return null
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-well px-2.5 py-0.5 text-[12px] text-fg-muted">
      <span aria-hidden className="size-1.5 rounded-[1px] bg-warning" />
      Reduced motion: showing end states
    </span>
  )
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>
}

/** Keeps a DOM measurement of an element's content width. */
export function useWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.clientWidth)
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}
