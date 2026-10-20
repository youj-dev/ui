import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Bold, Check, ChevronDown, Copy, Italic, Link2, MoreHorizontal, PanelRight, Trash2, Underline, X } from 'lucide-react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { cn } from '@youj/core/lib/youj/cn'
import { Portal, usePresence } from './presets-story-kit'

const meta: Meta = {
  title: 'Motion/Transitions/OverlayPresets',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'CSS presets (`src/styles/presets.css`, Tailwind `@utility`) for Base UI’s `data-starting-style` / `data-ending-style` lifecycle: `yj-pop` (popover, menu, select) grows from `--transform-origin`; `yj-tooltip` arrives from its trigger; `yj-dialog` rises a few px while scaling, and a parent recedes behind a nested dialog; `yj-backdrop` fades (and thins with a drawer swipe); `yj-sheet-{top,right,bottom,left,start,end}` slides off its edge (logical sides flip in RTL, Drawer swipes are followed); `yj-toast` / `yj-toast-top` + `yj-toast-content` run Base UI’s stacked toasts; `yj-collapse` animates `--collapsible-panel-height` / `--accordion-panel-height`; `yj-fade`; `yj-duration-*` for bespoke transitions. Every duration is a youj token × `--yj-motion`, so Speed, `prefers-reduced-motion` and `reducedMotion="always"` all reach them; portaled overlays get the provider through `{...useYoujScope()}` on their Portal. `[data-instant]` is honored. These stories drive the presets with a small harness that reproduces Base UI’s attributes; @youj/react uses them on real Base UI.',
      },
    },
    layout: 'centered',
  },
}
export default meta
type Story = StoryObj

const button =
  'inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-[13px] font-medium text-fg transition-colors yj-duration-fast hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none'
const panel = 'rounded-xl border border-line bg-surface text-fg shadow-lg shadow-fg/5'

/* ── Popover / menu: yj-pop ─────────────────────────────────────────────── */

function useDismiss(open: boolean, close: () => void, ...refs: { current: HTMLElement | null }[]) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    const onDown = (e: PointerEvent) => {
      if (!refs.some((r) => r.current?.contains(e.target as Node))) close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  })
}

/** Anchored below its trigger. --transform-origin is the trigger's center, as Base UI's Positioner writes it. */
function Anchored({
  label,
  icon,
  align = 'start',
  children,
  width = 240,
}: {
  label: string
  icon?: ReactNode
  align?: 'start' | 'end'
  children: (close: () => void) => ReactNode
  width?: number
}) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const { ref, mounted, attrs } = usePresence<HTMLDivElement>(open)
  useDismiss(open, () => setOpen(false), trigger, ref)
  const t = trigger.current
  const origin = t ? `${align === 'start' ? t.offsetWidth / 2 : width - t.offsetWidth / 2}px -6px` : 'center'
  return (
    <div className="relative">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className={cn(button, open && 'bg-selected')}
      >
        {icon}
        {label}
      </button>
      {mounted && (
        <div
          ref={ref}
          {...attrs}
          data-side="bottom"
          style={{ width, '--transform-origin': origin } as CSSProperties}
          className={cn(panel, 'yj-pop absolute top-full z-10 mt-1.5 p-1', align === 'start' ? 'left-0' : 'right-0')}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

const menuItem =
  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-fg outline-none hover:bg-hover focus-visible:bg-hover'

/* ── Dialog + backdrop: yj-dialog, yj-backdrop ───────────────────────────── */

function Dialog({
  open,
  onClose,
  title,
  children,
  nested = 0,
  backdrop = true,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  nested?: number
  backdrop?: boolean
}) {
  const scrim = usePresence<HTMLDivElement>(open && backdrop)
  const { ref, mounted, attrs } = usePresence<HTMLDivElement>(open)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !nested && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, nested])
  // The Portal stays mounted so the popup's first frame, with data-starting-style, is really painted.
  return (
    <Portal>
      {scrim.mounted && (
        <div ref={scrim.ref} {...scrim.attrs} onClick={onClose} className="yj-backdrop fixed inset-0 z-40 bg-scrim backdrop-blur-[2px]" />
      )}
      {mounted && (
        <div
          ref={ref}
          {...attrs}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          data-nested-dialog-open={nested ? '' : undefined}
          style={{ '--nested-dialogs': nested } as CSSProperties}
          className={cn(panel, 'yj-dialog fixed top-1/2 left-1/2 z-50 w-full max-w-[min(400px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 p-5')}
        >
          {children}
        </div>
      )}
    </Portal>
  )
}

/* ── Toasts: yj-toast, yj-toast-content ──────────────────────────────────── */

interface ToastData {
  id: number
  title: string
  body: string
  open: boolean
}

function useToasts() {
  const [toasts, setToasts] = useState<ToastData[]>([])
  const next = useRef(0)
  const push = (title: string, body: string) => {
    const id = next.current++
    setToasts((all) => [{ id, title, body, open: true }, ...all])
    setTimeout(() => close(id), 5000)
  }
  const close = (id: number) => setToasts((all) => all.map((t) => (t.id === id ? { ...t, open: false } : t)))
  const gone = (id: number) => setToasts((all) => all.filter((t) => t.id !== id))
  return { toasts, push, close, gone }
}

function Toaster({ toasts, close, gone, placement = 'bottom' }: ReturnType<typeof useToasts> & { placement?: 'top' | 'bottom' }) {
  const [expanded, setExpanded] = useState(false)
  const [heights, setHeights] = useState<Record<number, number>>({})
  const front = toasts[0] ? heights[toasts[0].id] : undefined
  let offset = 0
  return (
    <Portal>
      <section
        aria-label="Notifications"
        onPointerEnter={() => setExpanded(true)}
        onPointerLeave={() => setExpanded(false)}
        onFocus={() => setExpanded(true)}
        onBlur={() => setExpanded(false)}
        data-expanded={expanded ? '' : undefined}
        style={{ '--toast-frontmost-height': front ? `${front}px` : undefined } as CSSProperties}
        className={cn('fixed right-4 z-50 w-full max-w-[min(340px,calc(100vw-2rem))]', placement === 'bottom' ? 'bottom-4' : 'top-4')}
      >
        {toasts.map((t, index) => {
          const y = offset
          offset += heights[t.id] ?? 0
          return (
            <Toast
              key={t.id}
              toast={t}
              index={index}
              offsetY={y}
              expanded={expanded}
              placement={placement}
              onClose={() => close(t.id)}
              onGone={() => gone(t.id)}
              onHeight={(h) => setHeights((all) => (all[t.id] === h ? all : { ...all, [t.id]: h }))}
            />
          )
        })}
      </section>
    </Portal>
  )
}

function Toast({
  toast,
  index,
  offsetY,
  expanded,
  placement,
  onClose,
  onGone,
  onHeight,
}: {
  toast: ToastData
  index: number
  offsetY: number
  expanded: boolean
  placement: 'top' | 'bottom'
  onClose: () => void
  onGone: () => void
  onHeight: (h: number) => void
}) {
  const { ref, mounted, attrs } = usePresence<HTMLDivElement>(toast.open, true)
  const content = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (content.current) onHeight(content.current.offsetHeight)
  })
  useEffect(() => {
    if (!mounted) onGone()
  }, [mounted, onGone])
  if (!mounted) return null
  return (
    <div
      ref={ref}
      {...attrs}
      role="status"
      data-expanded={expanded ? '' : undefined}
      data-limited={index >= 3 ? '' : undefined}
      style={
        {
          '--toast-index': index,
          '--toast-offset-y': `${offsetY}px`,
          '--toast-height': `${content.current?.offsetHeight ?? 0}px`,
          '--toast-swipe-movement-x': '0px',
          '--toast-swipe-movement-y': '0px',
        } as CSSProperties
      }
      className={cn(panel, placement === 'bottom' ? 'yj-toast' : 'yj-toast-top', 'overflow-hidden')}
    >
      <div
        ref={content}
        data-behind={index > 0 ? '' : undefined}
        data-expanded={expanded ? '' : undefined}
        className="yj-toast-content flex items-start gap-3 p-3.5"
      >
        <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success-subtle text-success">
          <Check aria-hidden className="size-3" strokeWidth={3} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-fg">{toast.title}</p>
          <p className="mt-0.5 text-xs text-fg-muted">{toast.body}</p>
        </div>
        <button type="button" aria-label="Dismiss" onClick={onClose} className="grid size-6 place-items-center rounded-md text-fg-subtle hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ── Hero ──────────────────────────────────────────────────────────────── */

function ProjectSettings() {
  const [confirm, setConfirm] = useState(false)
  const toaster = useToasts()
  return (
    <div className="w-full max-w-[560px] rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="text-sm font-medium text-fg">acme-web</p>
          <p className="text-xs text-fg-muted">Production · updated 4m ago</p>
        </div>
        <div className="flex items-center gap-2">
          <Anchored label="Share" icon={<Link2 className="size-3.5" />} align="end" width={280}>
            {() => (
              <div className="p-2">
                <p className="text-[13px] font-medium">Share preview</p>
                <p className="mt-0.5 text-xs text-fg-muted">Anyone with the link can view this deploy.</p>
                <div className="mt-3 flex items-center gap-2 rounded-md border border-line bg-canvas px-2 py-1.5 font-mono text-xs text-fg-muted">
                  <span className="truncate">acme-web-a41f9e2.youj.app</span>
                  <Copy className="ml-auto size-3.5 shrink-0" />
                </div>
              </div>
            )}
          </Anchored>
          <Anchored label="" icon={<MoreHorizontal aria-label="More" className="size-4" />} align="end" width={200}>
            {(close) => (
              <div role="menu" aria-label="Project actions">
                <button role="menuitem" type="button" className={menuItem} onClick={close}>
                  <PanelRight className="size-3.5 text-fg-muted" /> Open in new tab
                </button>
                <button role="menuitem" type="button" className={menuItem} onClick={close}>
                  <Copy className="size-3.5 text-fg-muted" /> Duplicate
                </button>
                <div className="my-1 h-px bg-line" />
                <button
                  role="menuitem"
                  type="button"
                  className={cn(menuItem, 'text-danger')}
                  onClick={() => {
                    close()
                    setConfirm(true)
                  }}
                >
                  <Trash2 className="size-3.5" /> Delete project
                </button>
              </div>
            )}
          </Anchored>
        </div>
      </div>
      <div className="px-5 py-4 text-sm text-fg-muted">Open the menu (⋯) and delete the project: menu → dialog → toast.</div>
      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Delete project">
        <p className="text-sm font-medium">Delete acme-web?</p>
        <p className="mt-1.5 text-sm text-fg-muted">Deployments, domains and environment variables go with it. This can’t be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={button} onClick={() => setConfirm(false)}>
            Cancel
          </button>
          <button
            type="button"
            className={cn(button, 'border-danger bg-danger text-on-accent hover:bg-danger')}
            onClick={() => {
              setConfirm(false)
              toaster.push('Project deleted', 'acme-web and its 214 deployments were removed.')
            }}
          >
            Delete
          </button>
        </div>
      </Dialog>
      <Toaster {...toaster} />
    </div>
  )
}

/** A project header: a Share popover, a ⋯ menu whose Delete opens a dialog over a backdrop, and a toast on confirm. */
export const Hero: Story = {
  render: () => <ProjectSettings />,
}

/* ── Tooltip: yj-tooltip, [data-instant] ────────────────────────────────── */

function Tip({ label, children, instantRef }: { label: string; children: ReactNode; instantRef: { current: number } }) {
  const [open, setOpen] = useState(false)
  const [instant, setInstant] = useState(false)
  const { ref, mounted, attrs } = usePresence<HTMLDivElement>(open)
  const show = () => {
    // Like Base UI's delay group: moving between tooltips skips the animation.
    setInstant(performance.now() - instantRef.current < 400)
    setOpen(true)
  }
  const hide = () => {
    instantRef.current = performance.now()
    setOpen(false)
  }
  return (
    <div className="relative" onPointerEnter={show} onPointerLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {mounted && (
        <div
          ref={ref}
          {...attrs}
          role="tooltip"
          data-side="top"
          data-instant={instant ? 'delay' : undefined}
          style={{ '--transform-origin': 'center calc(100% + 6px)' } as CSSProperties}
          className="yj-tooltip pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 rounded-md bg-fg px-2 py-1 text-xs whitespace-nowrap text-canvas"
        >
          {label}
        </div>
      )}
    </div>
  )
}

/** Hover or focus a tool. Moving between tools switches tooltips instantly ([data-instant]), as Base UI’s delay group asks. */
export const Tooltip: Story = {
  render: () => {
    function Toolbar() {
      const last = useRef(0)
      const tools = [
        ['Bold', Bold, '⌘B'],
        ['Italic', Italic, '⌘I'],
        ['Underline', Underline, '⌘U'],
        ['Link', Link2, '⌘K'],
      ] as const
      return (
        <div className="mt-10 flex gap-1 rounded-lg border border-line bg-surface p-1">
          {tools.map(([label, Icon, keys]) => (
            <Tip key={label} label={`${label}  ${keys}`} instantRef={last}>
              <button type="button" aria-label={label} className="grid size-8 place-items-center rounded-md text-fg-muted hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
                <Icon className="size-4" />
              </button>
            </Tip>
          ))}
        </div>
      )
    }
    return <Toolbar />
  },
}

/* ── Sheet: yj-sheet-* ──────────────────────────────────────────────────── */

const SIDES = ['right', 'left', 'bottom', 'top', 'end', 'start'] as const
type Side = (typeof SIDES)[number]
/* Full class names, so Tailwind's scanner sees every preset (a template string alone wouldn't). */
const SHEET: Record<Side, string> = {
  right: 'yj-sheet-right',
  left: 'yj-sheet-left',
  bottom: 'yj-sheet-bottom',
  top: 'yj-sheet-top',
  end: 'yj-sheet-end',
  start: 'yj-sheet-start',
}
const SHEET_PLACE: Record<Side, string> = {
  right: 'inset-y-2 right-2 w-full max-w-[360px]',
  left: 'inset-y-2 left-2 w-full max-w-[360px]',
  end: 'inset-y-2 end-2 w-full max-w-[360px]',
  start: 'inset-y-2 start-2 w-full max-w-[360px]',
  bottom: 'inset-x-2 bottom-2 h-[280px]',
  top: 'inset-x-2 top-2 h-[220px]',
}

function Sheets() {
  const [side, setSide] = useState<Side | null>(null)
  const [shown, setShown] = useState<Side>('right')
  const [rtl, setRtl] = useState(false)
  const open = side !== null
  const scrim = usePresence<HTMLDivElement>(open)
  const { ref, mounted, attrs } = usePresence<HTMLDivElement>(open)
  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="flex w-full max-w-[520px] flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        {SIDES.map((s) => (
          <button
            key={s}
            type="button"
            className={button}
            onClick={() => {
              setShown(s)
              setSide(s)
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs text-fg-muted">
        <input type="checkbox" checked={rtl} onChange={(e) => setRtl(e.target.checked)} />
        Right to left (start / end flip)
      </label>
      <Portal>
        <div dir={rtl ? 'rtl' : 'ltr'}>
          {scrim.mounted && <div ref={scrim.ref} {...scrim.attrs} onClick={() => setSide(null)} className="yj-backdrop fixed inset-0 z-40 bg-scrim" />}
          {mounted && (
            <div
              ref={ref}
              {...attrs}
              role="dialog"
              aria-label={`${shown} sheet`}
              className={cn(panel, SHEET[shown], 'fixed z-50 flex flex-col p-5', SHEET_PLACE[shown])}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Environment variables</p>
                <button type="button" aria-label="Close" onClick={() => setSide(null)} className="grid size-7 place-items-center rounded-md text-fg-muted hover:bg-hover">
                  <X className="size-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-fg-muted">
                yj-sheet-{shown}: slides off its edge, decelerating in and accelerating away.
              </p>
              <div className="mt-4 flex flex-col gap-2 font-mono text-xs">
                {['DATABASE_URL', 'NEXT_PUBLIC_API', 'STRIPE_KEY'].map((key) => (
                  <div key={key} className="flex items-center justify-between rounded-md border border-line bg-canvas px-2.5 py-2">
                    <span className="text-fg">{key}</span>
                    <span className="text-fg-muted">••••••••</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Portal>
    </div>
  )
}

/** Sheets from every edge. `start` / `end` follow the writing direction. */
export const Sheet: Story = {
  render: () => <Sheets />,
}

/* ── Toast stack ───────────────────────────────────────────────────────── */

function ToastDemo() {
  const toaster = useToasts()
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom')
  const n = useRef(1)
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        <button type="button" className={button} onClick={() => toaster.push(`Deployment ${n.current++} ready`, 'acme-web is live on production.')}>
          Add toast
        </button>
        <button type="button" className={button} onClick={() => setPlacement((p) => (p === 'bottom' ? 'top' : 'bottom'))}>
          <ChevronDown className={cn('size-3.5 transition-transform yj-duration-base', placement === 'top' && 'rotate-180')} />
          Stack at the {placement === 'bottom' ? 'top' : 'bottom'}
        </button>
      </div>
      <p className="text-xs text-fg-muted">Add a few, then hover the stack to spread it out.</p>
      <Toaster {...toaster} placement={placement} />
    </div>
  )
}

/** Base UI’s stacked toasts: new toasts rise in, the stack peeks and shrinks behind, hovering spreads it out. */
export const Toasts: Story = {
  render: () => <ToastDemo />,
}

/* ── Nested dialog ─────────────────────────────────────────────────────── */

function NestedDemo() {
  const [outer, setOuter] = useState(false)
  const [inner, setInner] = useState(false)
  return (
    <>
      <button type="button" className={button} onClick={() => setOuter(true)}>
        Edit domain
      </button>
      <Dialog open={outer} onClose={() => setOuter(false)} title="Edit domain" nested={inner ? 1 : 0}>
        <p className="text-sm font-medium">acme.com</p>
        <p className="mt-1.5 text-sm text-fg-muted">Points at production. Removing it takes the site offline for this domain.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={button} onClick={() => setOuter(false)}>
            Close
          </button>
          <button type="button" className={cn(button, 'text-danger')} onClick={() => setInner(true)}>
            Remove domain…
          </button>
        </div>
      </Dialog>
      <Dialog open={inner} onClose={() => setInner(false)} title="Remove domain" backdrop={false}>
        <p className="text-sm font-medium">Remove acme.com?</p>
        <p className="mt-1.5 text-sm text-fg-muted">Visitors will see an error until you add it again.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={button} onClick={() => setInner(false)}>
            Keep it
          </button>
          <button type="button" className={cn(button, 'border-danger bg-danger text-on-accent hover:bg-danger')} onClick={() => setInner(false)}>
            Remove
          </button>
        </div>
      </Dialog>
    </>
  )
}

/** A dialog that opens another: the parent recedes one step behind it ([data-nested-dialog-open], --nested-dialogs). */
export const NestedDialog: Story = {
  render: () => <NestedDemo />,
}

/* ── Collapse: yj-collapse ──────────────────────────────────────────────── */

/** Reproduces Base UI's panel: measures scrollHeight into --collapsible-panel-height, then auto once open. */
function Panel({ open, children }: { open: boolean; children: ReactNode }) {
  const { ref, mounted, attrs } = usePresence<HTMLDivElement>(open)
  const [height, setHeight] = useState<string>('auto')
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setHeight(`${el.scrollHeight}px`)
    if (!open) return
    const done = () => setHeight('auto')
    el.addEventListener('transitionend', done, { once: true })
    return () => el.removeEventListener('transitionend', done)
  }, [open, mounted, ref])
  if (!mounted) return null
  return (
    <div ref={ref} {...attrs} style={{ '--collapsible-panel-height': height } as CSSProperties} className="yj-collapse">
      {children}
    </div>
  )
}

const FAQ = [
  ['What happens to preview deployments?', 'They keep running until their branch is deleted, then expire after 30 days.'],
  ['Can I roll back a production deploy?', 'Yes. Promote any previous deployment from the list; traffic switches over in seconds, with no rebuild.'],
  ['Where do build logs go?', 'Build logs stay available for 90 days. Runtime logs stream to your log drain if you connected one.'],
]

/** yj-collapse on an accordion: one panel collapses as the next opens. */
export const Accordion: Story = {
  render: () => {
    function Faq() {
      const [open, setOpen] = useState<number | null>(0)
      return (
        <div className="w-full max-w-[480px] divide-y divide-line rounded-2xl border border-line bg-surface">
          {FAQ.map(([q, a], i) => (
            <div key={q}>
              <button
                type="button"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-medium text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset"
              >
                {q}
                <ChevronDown aria-hidden className={cn('size-4 shrink-0 text-fg-subtle transition-transform yj-duration-base ease-standard', open === i && 'rotate-180')} />
              </button>
              <Panel open={open === i}>
                <p className="px-4 pb-4 text-sm leading-6 text-fg-muted">{a}</p>
              </Panel>
            </div>
          ))}
        </div>
      )
    }
    return <Faq />
  },
}

/** Reduced motion: every preset applies its end state at once (durations × --yj-motion = 0), so overlays appear and leave instantly. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <ProjectSettings />
    </YoujProvider>
  ),
}
