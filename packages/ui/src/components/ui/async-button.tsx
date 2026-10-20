'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode, type Ref } from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { m } from 'motion/react'
import { MotionFeatures, useSoundCue } from '@youj/core'
import { AsyncAnnouncer, AsyncFeedback, useAsyncAction, useMorphRoot, type AsyncState } from '@youj/motion'
import { useTheme, useYouj, useYoujLook } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { buttonAsyncLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'
import { type ButtonProps } from './button'
import { buttonVariants } from './button.variants'
import { usePressSound } from './button.press'
import { useHold } from './async-button.hold'
import { Spinner } from './spinner'

/* The button that runs async work and shows its whole lifecycle. Button itself
 * has none of it, so `youj add button` copies none of it either. */

type ButtonSize = NonNullable<ButtonProps['size']>

interface AsyncLabels<TResult> {
  /** Shown beside the spinner while the action runs, and announced. Announced as "Working…" when omitted. */
  pendingLabel?: string
  /**
   * Shown beside the check and announced. Default "Done". A function gets what
   * `onAction` resolved with: `successLabel={(user) => `Saved ${user.name}`}`.
   * Under `status` there is no outcome to read, so pass a string.
   */
  successLabel?: string | ((result: TResult) => string)
  /**
   * Shown beside the cross and announced assertively. Default "Failed". A
   * function gets what `onAction` rejected or threw with, whatever that is:
   * `errorLabel={(error) => error instanceof Error ? error.message : 'Failed'}`.
   * Under `status`, pass a string (`errorLabel={mutation.error?.message}`).
   */
  errorLabel?: string | ((error: unknown) => string)
  /** How long success / error hold before the label returns, in ms. Default: 3 × the deliberate token. */
  resetAfter?: number
  /** Fires on every state change: idle → pending → success | error → idle. */
  onActionStateChange?: (state: AsyncState) => void
  /**
   * Hold to confirm: the action runs only once a press is held (a pointer, or
   * Space or Enter held down) for this long. `true` takes twice the deliberate
   * motion token; a number is milliseconds. The button fills from its inline
   * start while held and springs back if let go early; a full hold runs the
   * action and the button carries on through pending to success or error. It
   * is described as "Hold to confirm".
   */
  hold?: boolean | number
}

/** One driver per button, never both. */
type AsyncDriver<TResult> =
  | {
      /**
       * Async work the button runs on press, with its whole lifecycle shown in
       * place: the label morphs to a spinner (and `pendingLabel`), then to a drawn
       * check and `successLabel`, or shakes to a cross and `errorLabel`, and
       * returns to rest. Resolve for success; reject or throw for error. A second
       * press while it runs (a double click) is ignored.
       */
      onAction?: () => TResult | Promise<TResult>
      status?: never
    }
  | {
      /**
       * The same pending → success | error → idle lifecycle for work started
       * elsewhere, controlled: pass a mutation's status and the button shows it.
       * The names are TanStack Query's, so `status={mutation.status}` works as it
       * is; so does any state you map to them.
       *
       * - A `pending` status shows the spinner and blocks presses. `success` and
       *   `error` draw their mark, hold for `resetAfter`, and return to rest even
       *   while `status` stays put (a mutation keeps `success` until it's reset):
       *   the next change of `status` plays again. A button that mounts already
       *   settled is at rest.
       * - Pressing runs `onClick`, as on any button: start the work there
       *   (`onClick={() => mutation.mutate(input)}`).
       */
      status: AsyncState
      onAction?: never
    }

/** A Button whose press runs async work and shows it in place. Drive it with `onAction` or, controlled, with `status`. */
type AsyncButtonProps<TResult = unknown> = Omit<ButtonProps, 'loading' | 'loadingLabel'> & AsyncLabels<TResult> & AsyncDriver<TResult>

/** The size's own icon-to-label gap, for content the morphing label wraps. */
const labelGap: Record<ButtonSize, string> = {
  xs: 'gap-1',
  sm: 'gap-1.5',
  default: 'gap-1.5',
  lg: 'gap-2',
  icon: '',
  'icon-xs': '',
  'icon-sm': '',
  'icon-lg': '',
}

/* The page's look, as a counter that moves when the document's theme, style or
 * scale attributes change: a button reads its radius again then. One observer
 * serves every async button. */
let look = 0
const lookListeners = new Set<() => void>()
let lookObserver: MutationObserver | undefined
function subscribeLook(listener: () => void) {
  lookListeners.add(listener)
  if (!lookObserver) {
    lookObserver = new MutationObserver(() => {
      look++
      lookListeners.forEach((l) => l())
    })
    lookObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-yj-theme', 'data-yj-look', 'data-yj-scaling', 'data-theme', 'class', 'style'] })
  }
  return () => {
    lookListeners.delete(listener)
    if (lookListeners.size > 0) return
    lookObserver?.disconnect()
    lookObserver = undefined
  }
}
const getLook = () => look
const getServerLook = () => 0

/** A controlled status as the lifecycle the button shows: pending while it's pending; success and error hold for `hold` ms, then rest even while the status stays; a button that mounts settled is at rest. */
function useStatusState(status: AsyncState | undefined, hold: number): AsyncState {
  const [shown, setShown] = useState<AsyncState>(status === 'pending' ? 'pending' : 'idle')
  const [seen, setSeen] = useState(status)
  // A new status shows at once (set while rendering, so there's no frame of the old one).
  if (status !== seen) {
    setSeen(status)
    setShown(status ?? 'idle')
  }
  const settled = status === 'success' || status === 'error'
  useEffect(() => {
    if (!settled) return
    const timer = setTimeout(() => setShown('idle'), hold)
    return () => clearTimeout(timer)
  }, [status, settled, hold])
  return status === undefined ? 'idle' : shown
}

/** A label that may be a function of the outcome, as the string to show: empty or missing is the default. A function has an outcome to read only when the button ran the work (`onAction`). */
function resolve<T>(label: string | ((value: T) => string) | undefined, ran: boolean, value: T, fallback: string): string {
  return (typeof label === 'function' ? (ran ? label(value) : undefined) : label) || fallback
}

declare const process: { env: { NODE_ENV?: string } }
let warnedBoth = false

/* The async button: motion's useAsyncAction runs the work (re-entry guarded
 * synchronously, so a double click starts one action; a synchronous throw is
 * an error; nothing updates after unmount), AsyncFeedback morphs the label
 * through MorphLabel while the button's box morphs to the new width on the
 * same spring (useMorphRoot), and AsyncAnnouncer, beside the button because a
 * button flattens its content, speaks each state. */
function AsyncButtonImpl({
  className,
  variant = 'default',
  size = 'default',
  disabled,
  focusableWhenDisabled,
  children,
  onAction,
  status,
  onClick,
  onPointerDown,
  pendingLabel,
  successLabel,
  errorLabel,
  resetAfter,
  onActionStateChange,
  sound,
  hold: holdFor,
  ref,
  ...props
}: AsyncButtonProps) {
  const k = useYouj()
  const labels = useComponentLabels(buttonAsyncLabels)
  const cue = useSoundCue()
  const controlled = status !== undefined
  if (process.env.NODE_ENV !== 'production' && controlled && onAction && !warnedBoth) {
    warnedBoth = true
    console.error('[youj] AsyncButton got both `status` and `onAction`. They drive the same lifecycle, so `status` wins and `onAction` does not run. Pass one.')
  }
  const hold = resetAfter ?? k.ms('deliberate') * 3
  // The outcome sounds as its check draws or its cross shakes.
  const report = (next: AsyncState) => {
    onActionStateChange?.(next)
    if (sound !== false && (next === 'success' || next === 'error')) cue(next)
  }
  const action = useAsyncAction(onAction ?? (() => {}), { resetAfter, onStateChange: controlled ? undefined : report })
  const statusState = useStatusState(status, hold)
  const state = controlled ? statusState : action.state
  // A controlled status reports its changes from here, once each (not on mount).
  const reported = useRef(state)
  useEffect(() => {
    if (!controlled || reported.current === state) return
    reported.current = state
    report(state)
  }, [controlled, state])
  const run = action.run
  // A function is called only while its state shows, with an outcome the button ran the work for.
  const successText = resolve(successLabel, !controlled && state === 'success', action.result, labels.done)
  const errorText = resolve(errorLabel, !controlled && state === 'error', action.error, labels.failed)

  const pending = state === 'pending'
  const iconOnly = size?.startsWith('icon') ?? false
  // A link-styled button has no press motion, so it has no press sound.
  const audible = sound !== false && variant !== 'link'
  // A held button runs its action once the hold completes: confirming, then the lifecycle below.
  const held = useHold(holdFor, { variant, disabled: disabled === true || pending, label: labels.holdToConfirm, handlers: { ...props, onPointerDown } })
  // A held button sounds as the hold completes, not as it's pressed.
  const press = usePressSound(audible && !held, { onPointerDown: held?.props.onPointerDown ?? onPointerDown, onClick })

  // The morphing box keeps its corners round only with an inline radius. Read
  // the class's radius once per look (so a className override is honored; a
  // new theme, style or scale reads it again, or the box would keep the old look's corners),
  // then hand it to the morph root. It's read in a ResizeObserver's first
  // callback, after the browser has laid the page out anyway: read in the
  // commit, it forced a style pass of everything mounted with the button.
  const local = useRef<HTMLButtonElement | null>(null)
  const [radius, setRadius] = useState<string>()
  const theme = useTheme()
  const style = useYoujLook()
  const page = useSyncExternalStore(subscribeLook, getLook, getServerLook)
  useLayoutEffect(() => {
    const el = local.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      observer.disconnect()
      const inline = el.style.borderRadius
      el.style.borderRadius = ''
      setRadius(getComputedStyle(el).borderRadius || undefined)
      el.style.borderRadius = inline
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [size, className, theme, style, page])
  const morph = useMorphRoot(radius)
  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      local.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )

  // Icon-only buttons stay square: their labels are announced, not shown.
  const shown = {
    pendingLabel: iconOnly ? '…' : (pendingLabel ?? labels.working),
    successLabel: iconOnly ? '' : successText,
    errorLabel: iconOnly ? '' : errorText,
  }
  const spoken = { pendingLabel: pendingLabel ?? labels.working, successLabel: successText, errorLabel: errorText }

  // The box morph is a layout animation, so this button loads Motion's layout
  // features (only the async button pays for them).
  return (
    <MotionFeatures features="max">
      <ButtonPrimitive
        ref={setRef as Ref<HTMLElement>}
        render={<m.button {...morph} />}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        data-state={state}
        // Busy reads as loading to the look: no dimming while it blocks presses.
        data-loading={pending || undefined}
        data-reduced-motion={k.reduced || undefined}
        aria-busy={pending || undefined}
        disabled={disabled === true || pending}
        focusableWhenDisabled={focusableWhenDisabled === true || pending}
        // shape: AsyncButton is a button; its success and danger tints fill the edge too
        className={cn(
          buttonVariants({ variant, size }),
          // The state tints fill the padding box and need clipping. On a tint
          // the label is always the contrast ink, hovered or not, and the
          // outcome shows at full strength even if the button is disabled
          // meanwhile (say, once published).
          'overflow-hidden',
          'own:data-[state=error]:border-transparent own:data-[state=error]:text-on-accent! data-[state=error]:opacity-100!',
          'own:data-[state=success]:border-transparent own:data-[state=success]:text-on-accent! data-[state=success]:opacity-100!',
          held?.className,
          className,
        )}
        {...props}
        {...held?.props}
        onPointerDown={press.onPointerDown}
        onClick={(event) => {
          if (held && !held.confirms(event)) return
          if (held && audible) cue('tap')
          press.onClick(event)
          if (!event.defaultPrevented && !controlled && onAction) run()
        }}
      >
        {held?.fill}
        <AsyncFeedback
          state={state}
          {...shown}
          icons={{
            pending: (
              <span className={cn('own:inline-flex items-center', labelGap[size ?? 'default'])}>
                <Spinner label={null} />
                {/* Never a bare spinner: the button keeps a name while it works. */}
                {pendingLabel && !iconOnly ? pendingLabel : <span className="sr-only">{spoken.pendingLabel}</span>}
              </span>
            ),
          }}
        >
          <span data-slot="button-label" className={cn('own:inline-flex items-center', labelGap[size ?? 'default'], held?.count && 'opacity-0')}>
            {children}
          </span>
        </AsyncFeedback>
        {held?.count}
      </ButtonPrimitive>
      {held?.description}
      <AsyncAnnouncer state={state} {...spoken} />
    </MotionFeatures>
  )
}

const AsyncButton = AsyncButtonImpl as <TResult = unknown>(props: AsyncButtonProps<TResult>) => ReactNode

export { AsyncButton, type AsyncButtonProps }
