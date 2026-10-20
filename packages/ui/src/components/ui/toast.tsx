'use client'

import { toastLabels } from '@youj/core/labels'
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Toast as ToastPrimitive } from '@base-ui/react/toast'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures, useYouj, useYoujScope, useSoundCue, useDirection } from '@youj/core'
import { AsyncFeedback, type AsyncState } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { AlertTriangleIcon, CheckCircleIcon, CircleXIcon, InfoIcon, XIcon } from '@youj/icons'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { Spinner } from './spinner'

/* Notifications that stack in a corner. Base UI's Toast, moved by motion's
 * yj-toast: a new toast rises in from the edge and the ones behind it step
 * back (each peeks 12px and is 5% smaller, its text hidden); hovering or
 * focusing the stack spreads it out with gaps and pauses the timers; a swipe
 * towards the edge throws a toast away from where the finger let go. Status
 * icons play once as the toast lands. A promise toast morphs its first line
 * through motion's AsyncFeedback: a spinner while the work runs, then the
 * drawn check or the shaken cross. Reduced motion: toasts appear and leave
 * in place, and swipes still track the finger.
 *
 * `toast()` works from anywhere; render one <Toaster /> in the app. The
 * viewport is a polite live region ("Notifications", F6 jumps to it), so
 * new toasts and a promise toast's changes are announced without stealing
 * focus. With sound on, a toast sounds as it rises in: success and
 * error with their own cue, anything else `notify`; a promise toast sounds
 * again when it settles, as its check draws or its cross shakes.
 *
 * `media` puts a visual at the toast's start in place of the status icon:
 * an illustration, a loader or an animated icon, which the caller imports
 * (this package never imports scenes or loaders). It sits on a small
 * recessed stage that sizes each kind to fit (a scene fills it, a loader
 * keeps its proportions inside it, an icon sits at half its size), lands
 * on the settle spring just after the toast, and crossfades when the media
 * changes, so a promise toast can go from a loader to a scene. A typed
 * toast with media wears its status as a small pip on the stage's corner.
 * The stage is decorative: the title and description carry the message. */

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface ToastOptions {
  /** Upserts: a toast with the same id is updated in place and its timer restarts. */
  id?: string
  description?: ReactNode
  /** Time on screen in milliseconds; 0 keeps it until dismissed. Default: the Toaster's. */
  timeout?: number
  /**
   * `high` announces it assertively, for the rare toast that must interrupt.
   * Base UI then hides the toast itself from assistive tech until it is
   * focused and speaks it through an alert instead. Default `low` (polite).
   */
  priority?: 'low' | 'high'
  /** A button in the toast, such as Undo. Pressing it runs `onClick` and dismisses the toast. */
  action?: { label: ReactNode; onClick: () => void }
  /**
   * A visual at the toast's start, in place of the status icon: an
   * illustration, a loader or an animated icon. It is decorative (hidden
   * from assistive tech), so the title must still say what happened.
   */
  media?: ReactNode
  onClose?: () => void
  onRemove?: () => void
}

type PromiseStep = string | (ToastOptions & { title: ReactNode })
interface PromiseOptions<Value> {
  loading: PromiseStep
  success: PromiseStep | ((value: Value) => PromiseStep)
  error: PromiseStep | ((error: unknown) => PromiseStep)
}

interface ToastData {
  /** Set on toast.promise toasts, which render through AsyncFeedback. */
  promise?: boolean
  media?: ReactNode
}

const manager = ToastPrimitive.createToastManager<ToastData>()

/** Base UI's options from ours: `action` becomes an action button that also closes its toast; `media` rides in `data`. */
function toBaseOptions({ action, media, ...options }: ToastOptions, getId: () => string | undefined) {
  return {
    ...options,
    ...(media !== undefined && { data: { media } }),
    actionProps: action && {
      children: action.label,
      onClick: () => {
        action.onClick()
        manager.close(getId())
      },
    },
  }
}

function add(title: ReactNode, type: ToastType | undefined, options: ToastOptions = {}) {
  let id = options.id
  id = manager.add({
    ...toBaseOptions(options, () => id),
    title,
    type,
  })
  return id
}

function promiseStep(step: PromiseStep, getId: () => string | undefined) {
  const { title, ...options } = typeof step === 'string' ? { title: step } : step
  return {
    ...toBaseOptions(options, getId),
    title,
    // Each step brings its own media, or none: a loader doesn't outlive the loading step.
    data: { promise: true, media: options.media },
  }
}

let promiseCount = 0

function promise<Value>(work: Promise<Value>, options: PromiseOptions<Value>) {
  // Base UI's promise() doesn't return the toast's id, but its loading step
  // is added as given, so an id passed there names the toast. Actions need it.
  const loading = typeof options.loading === 'string' ? { title: options.loading } : options.loading
  const id = loading.id ?? `youj-promise-${++promiseCount}`
  const getId = () => id
  return manager.promise(work, {
    loading: { ...promiseStep(loading, getId), id } as ReturnType<typeof promiseStep>,
    success: (value: Value) =>
      promiseStep(typeof options.success === 'function' ? options.success(value) : options.success, getId),
    error: (error: unknown) =>
      promiseStep(typeof options.error === 'function' ? options.error(error) : options.error, getId),
  })
}

/**
 * Shows a toast and returns its id. `toast.success` / `error` / `warning` /
 * `info` add a status icon; `toast.promise` follows a promise from loading to
 * success or error and returns it; `toast.dismiss(id?)` closes one or all;
 * `toast.update(id, …)` changes one in place.
 */
const toast = Object.assign((title: ReactNode, options?: ToastOptions) => add(title, undefined, options), {
  success: (title: ReactNode, options?: ToastOptions) => add(title, 'success', options),
  error: (title: ReactNode, options?: ToastOptions) => add(title, 'error', options),
  warning: (title: ReactNode, options?: ToastOptions) => add(title, 'warning', options),
  info: (title: ReactNode, options?: ToastOptions) => add(title, 'info', options),
  promise,
  dismiss: (id?: string) => manager.close(id),
  update: (id: string, { title, ...options }: ToastOptions & { title?: ReactNode }) =>
    manager.update(id, (prev) => {
      const { data, ...base } = toBaseOptions(options, () => id)
      // Media merges into the toast's data, so a promise toast stays one.
      return { ...base, ...(data && { data: { ...prev.data, ...data } }), ...(title !== undefined ? { title } : {}) }
    }),
})

/* ── Rendering ─────────────────────────────────────────────────────────── */

type ToasterPosition = 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end'

const positionClass: Record<ToasterPosition, string> = {
  'top-start': 'top-4 start-4',
  'top-center': 'top-4 inset-x-0 own:mx-auto',
  'top-end': 'top-4 end-4',
  'bottom-start': 'bottom-4 start-4',
  'bottom-center': 'bottom-4 inset-x-0 own:mx-auto',
  'bottom-end': 'bottom-4 end-4',
}

type Swipe = 'up' | 'down' | 'left' | 'right'

/** Toasts leave towards the edge they sit on, and sideways towards the nearer side (mirrored in RTL). */
function swipeDirections(position: ToasterPosition, rtl: boolean): Swipe[] {
  const [block, inline] = position.split('-') as ['top' | 'bottom', 'start' | 'center' | 'end']
  const vertical: Swipe = block === 'top' ? 'up' : 'down'
  if (inline === 'center') return [vertical]
  return [vertical, inline === 'end' !== rtl ? 'right' : 'left']
}

const iconProps = { trigger: 'mount', size: 16, strokeWidth: 2 } as const
const successIcon = <CheckCircleIcon {...iconProps} className="own:text-success" />
const errorIcon = <CircleXIcon {...iconProps} className="own:text-danger" />
const statusIcon: Record<ToastType, ReactNode> = {
  success: successIcon,
  error: errorIcon,
  warning: <AlertTriangleIcon {...iconProps} className="own:text-warning" />,
  info: <InfoIcon {...iconProps} className="own:text-fg-muted" />,
  loading: <Spinner label={null} className="own:text-fg-muted" />,
}

const asyncState: Record<string, AsyncState> = { loading: 'pending', success: 'success', error: 'error' }

/** The first line: status icon and title; for a promise toast, AsyncFeedback morphing between its states. */
function ToastHeadline({ toast: item }: { toast: ToastPrimitive.Root.ToastObject<ToastData> }) {
  const type = item.type as ToastType | undefined
  const state = type && asyncState[type]
  if (item.data?.promise && state) {
    const label = typeof item.title === 'string' ? item.title : undefined
    return (
      <AsyncFeedback
        state={state}
        tint={false}
        pendingLabel={label}
        successLabel={label}
        errorLabel={label}
        icons={{
          pending: (
            <span className="own:inline-flex items-center gap-1.5">
              {statusIcon.loading}
              {item.title}
            </span>
          ),
          success: successIcon,
          error: errorIcon,
        }}
      >
        {item.title}
      </AsyncFeedback>
    )
  }
  return (
    <>
      {type && statusIcon[type]}
      {item.title}
    </>
  )
}

/** The stage at the toast's start: the media, crossfading when it changes, and a typed toast's status pip on its corner. */
function ToastMedia({ toast: item }: { toast: ToastPrimitive.Root.ToastObject<ToastData> }) {
  const k = useYouj()
  const media = item.data?.media
  // A new key for each new media, so the old one fades out under the new one.
  const [shown, setShown] = useState({ media, key: 0 })
  if (shown.media !== media) setShown({ media, key: shown.key + 1 })
  const type = item.type as ToastType | undefined
  const still = k.reduced ? { type: false as const } : undefined
  return (
    <MotionFeatures>
      <m.span
        aria-hidden
        data-slot="toast-media"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={still ?? { ...k.spring('settle'), delay: k.duration('fast') }}
        className={cn(
          'relative own:grid shrink-0 place-items-center',
          'own:size-(--ui--toast-media) own:[--ui--toast-media:calc(--spacing(14)_-_--spacing(2)_*_var(--ui--compact,0))]',
          'own:rounded-[max(var(--radius-sm),calc(var(--radius-xl)_-_--spacing(2.5)))] own:border own:border-line-subtle own:bg-well',
          // A faint dot grid: the stage the kit's scenes are drawn on.
          'own:bg-[radial-gradient(var(--color-line)_0.6px,transparent_0.8px)] own:bg-size-[--spacing(1.5)_--spacing(1.5)] own:bg-center',
          'own:[--yj-anim-paper:var(--color-well)]',
        )}
      >
        <span className="own:grid size-full overflow-hidden own:rounded-[inherit] *:col-start-1 *:row-start-1">
          <AnimatePresence initial={false}>
            <m.span
              key={shown.key}
              data-slot="toast-media-content"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={still ?? k.tween('slow', 'enter')}
              // ui.css fits each kind of media to the stage.
              className="own:grid place-items-center size-full"
            >
              {media}
            </m.span>
          </AnimatePresence>
        </span>
        {type && type !== 'loading' && (
          <span
            data-slot="toast-media-status"
            className="absolute -end-1.5 -bottom-1.5 own:grid size-5 place-items-center own:rounded-full own:bg-overlay own:shadow-xs *:size-4"
          >
            {statusIcon[type]}
          </span>
        )}
      </m.span>
    </MotionFeatures>
  )
}

/** The sound for a toast's arrival or its settled promise. Toasts already showing when the Toaster mounts stay quiet. */
function useToastSound(toasts: ToastPrimitive.Root.ToastObject<ToastData>[], on: boolean) {
  const cue = useSoundCue()
  const seen = useRef<Map<string, string | undefined>>(null)
  useEffect(() => {
    const before = seen.current
    seen.current = new Map(toasts.map((item) => [item.id, item.type]))
    if (!before || !on) return
    for (const item of toasts) {
      const settled = item.type === 'success' || item.type === 'error' ? item.type : undefined
      if (!before.has(item.id)) cue(settled ?? 'notify')
      else if (settled && before.get(item.id) !== settled) cue(settled)
    }
  }, [toasts])
}

function ToastList({ position, sound }: { position: ToasterPosition; sound: boolean }) {
  const { toasts } = ToastPrimitive.useToastManager<ToastData>()
  const rtl = useDirection() === 'rtl'
  const k = useYouj()
  const labels = useComponentLabels(toastLabels)
  useToastSound(toasts, sound)
  // Under reduced motion a loading promise toast is text only (AsyncFeedback's fallback), so nothing to indent past.
  const hasIcon = (item: ToastPrimitive.Root.ToastObject<ToastData>) =>
    !!item.type && !(k.reduced && item.type === 'loading' && item.data?.promise)
  const hasMedia = (item: ToastPrimitive.Root.ToastObject<ToastData>) => item.data?.media != null && item.data.media !== false
  return toasts.map((item) => (
    <ToastPrimitive.Root
      key={item.id}
      toast={item}
      swipeDirection={swipeDirections(position, rtl)}
      data-slot="toast"
      data-yj-tone="overlay"
      data-yj-media={hasMedia(item) ? '' : undefined}
      className={cn(
        position.startsWith('top') ? 'yj-toast-top' : 'yj-toast',
        'own:rounded-xl border border-line own:bg-overlay own:text-fg own:shadow-lg select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
      )}
    >
      <ToastPrimitive.Content
        data-slot="toast-content"
        className={cn(
          'yj-toast-content own:flex gap-3 overflow-hidden own:pe-2.5',
          // With media the stage sits a concentric 10px inside the corner and the text centres beside it.
          hasMedia(item) ? 'items-center own:p-2.5' : 'items-start own:py-3 own:ps-3.5',
        )}
      >
        {hasMedia(item) && <ToastMedia toast={item} />}
        <div className="own:flex min-w-0 flex-1 flex-col gap-0.5 py-0.5">
          <ToastPrimitive.Title
            data-slot="toast-title"
            className="own:flex items-start gap-1.5 own:text-ui own:font-medium own:text-fg *:[svg,[data-slot=spinner]]:mt-0.5"
          >
            {hasMedia(item) ? item.title : <ToastHeadline toast={item} />}
          </ToastPrimitive.Title>
          <ToastPrimitive.Description
            data-slot="toast-description"
            // Lines up under the title's text when there is an icon before it.
            className={cn('own:text-ui-sm own:text-fg-muted', hasIcon(item) && !hasMedia(item) && 'own:ps-5.5')}
          />
        </div>
        <ToastPrimitive.Action
          data-slot="toast-action"
          render={<Button size="xs" variant="secondary" className="shrink-0" />}
        />
        <ToastPrimitive.Close
          data-slot="toast-close"
          aria-label={labels.dismiss}
          render={<Button size="icon-xs" variant="ghost" className="shrink-0" />}
        >
          <XIcon />
        </ToastPrimitive.Close>
      </ToastPrimitive.Content>
    </ToastPrimitive.Root>
  ))
}

interface ToasterProps {
  /** The corner or edge the stack grows from; start and end follow the writing direction. Default `bottom-end`. */
  position?: ToasterPosition
  /** How many toasts show at once; older ones wait, hidden. Default 3. */
  limit?: number
  /** Default time on screen in milliseconds; 0 keeps toasts until dismissed. Default 5000. */
  timeout?: number
  className?: string
  /** With sound on (`YoujProvider`’s `sound`), toasts sound as they arrive. `false` keeps them silent. Default true. */
  sound?: boolean
}

/* toast() feeds one manager, so every mounted Toaster would show every toast:
 * a second one (in a layout and a page, or a story shown twice on a docs page)
 * doubles each toast and its announcement. The first one mounted renders; the
 * rest wait, and the next takes over when it unmounts. */
declare const process: { env: { NODE_ENV?: string } }
const toasters: symbol[] = []
const toasterListeners = new Set<() => void>()
function subscribeToasters(listener: () => void) {
  toasterListeners.add(listener)
  return () => {
    toasterListeners.delete(listener)
  }
}

function useLeadToaster() {
  const [id] = useState(() => Symbol('toaster'))
  useEffect(() => {
    toasters.push(id)
    toasterListeners.forEach((listener) => listener())
    // A moment later, so one that's only handing over (the other unmounting in the same update) doesn't warn.
    const check =
      process.env.NODE_ENV !== 'production'
        ? setTimeout(() => {
            if (toasters.includes(id) && toasters[0] !== id)
              console.warn('Youj: another <Toaster> is already mounted, so this one shows nothing (its position, limit and timeout do not apply). Render one Toaster for the app.')
          }, 1000)
        : undefined
    return () => {
      clearTimeout(check)
      toasters.splice(toasters.indexOf(id), 1)
      toasterListeners.forEach((listener) => listener())
    }
  }, [id])
  // Until it registers, a Toaster leads when no other is mounted, so it is listening from its first render.
  const leads = () => (toasters[0] ?? id) === id
  return useSyncExternalStore(subscribeToasters, leads, leads)
}

/** Renders the toasts that `toast()` creates. Render one, anywhere in the app; a second one mounted at the same time shows nothing. */
function Toaster({ position = 'bottom-end', limit = 3, timeout = 5000, className, sound = true }: ToasterProps) {
  const scope = useYoujScope()
  const leads = useLeadToaster()
  if (!leads) return null
  return (
    <ToastPrimitive.Provider toastManager={manager} limit={limit} timeout={timeout}>
      <ToastPrimitive.Portal {...scope}>
        <ToastPrimitive.Viewport
          data-slot="toaster"
          className={cn('fixed z-100 w-88 max-w-[calc(100vw_-_var(--spacing)*8)] outline-none', positionClass[position], className)}
        >
          <ToastList position={position} sound={sound} />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  )
}

export { toast, Toaster }
export type { PromiseOptions, ToasterPosition, ToasterProps, ToastOptions, ToastType }
