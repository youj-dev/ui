'use client'

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type PointerEvent,
  type Ref,
} from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { m, useAnimate } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { AsyncAnnouncer, SlidingIndicator } from '@youj/motion'
import { CheckIcon } from '@youj/icons/components/youj/icons/check'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { inputOtpLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'
import { AsyncButton, type AsyncButtonProps } from './async-button'
import { useFieldRequired } from './field'
import { fieldControlClass } from './input'
import { Spinner } from './spinner'

/* A one-time code field. It is one real <input> (autocomplete="one-time-code",
 * so SMS autofill and password managers work), laid transparently over a row
 * of slots that only draw it: a screen reader meets one field with one label,
 * not six. The caret is a single focus frame, motion's SlidingIndicator, that
 * glides from slot to slot on the smooth spring as you type or arrow; each
 * character rises 4px into its slot. Pasting fills the whole code (spaces and
 * dashes are dropped). On `status="success"` the slots turn green left to
 * right and a check draws; on "error" the row shakes 4/3/2px. Reduced motion:
 * the frame jumps, characters appear, no shake, and the caret holds still. */

type OTPMode = 'numeric' | 'alphanumeric'
type OTPStatus = 'idle' | 'verifying' | 'success' | 'error'

const PATTERNS: Record<OTPMode, { char: RegExp; pattern: string; inputMode: 'numeric' | 'text' }> = {
  numeric: { char: /[0-9]/, pattern: '[0-9]*', inputMode: 'numeric' },
  alphanumeric: { char: /[a-zA-Z0-9]/, pattern: '[a-zA-Z0-9]*', inputMode: 'text' },
}

function sanitize(text: string, mode: OTPMode) {
  const chars = [...text].filter((c) => PATTERNS[mode].char.test(c)).join('')
  return mode === 'alphanumeric' ? chars.toUpperCase() : chars
}

interface InputOTPProps
  extends Omit<InputPrimitive.Props, 'value' | 'defaultValue' | 'onChange' | 'onValueChange' | 'type' | 'maxLength' | 'size'> {
  /** Number of characters, 4–8. Default 6. */
  length?: number
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Called once each time the last slot is filled. */
  onComplete?: (value: string) => void
  /** Submit the owning form when the code is complete. */
  autoSubmit?: boolean
  /** Digits only (default), or letters and digits (upper-cased), e.g. recovery codes. */
  mode?: OTPMode
  /** Slot grouping, e.g. [3, 3]. Groups are split by a dash. Default: one group. */
  groups?: number[]
  /** verifying: read-only with a spinner. success: green slots and a drawn check. error: a shake. */
  status?: OTPStatus
  /** Announced for each status. */
  statusLabels?: { verifying?: string; success?: string; error?: string }
  className?: string
  ref?: Ref<HTMLInputElement>
}

function InputOTP({
  length = 6,
  value: valueProp,
  defaultValue = '',
  onValueChange,
  onComplete,
  autoSubmit = false,
  mode = 'numeric',
  groups,
  status = 'idle',
  statusLabels,
  disabled,
  readOnly,
  required,
  className,
  onFocus,
  onBlur,
  onKeyDown,
  ref,
  ...props
}: InputOTPProps) {
  const k = useYouj()
  const labels = useComponentLabels(inputOtpLabels)
  const fieldRequired = useFieldRequired()
  const size = Math.min(8, Math.max(4, Math.round(length)))
  const [uncontrolled, setUncontrolled] = useState(() => sanitize(defaultValue, mode).slice(0, size))
  const value = valueProp !== undefined ? sanitize(valueProp, mode).slice(0, size) : uncontrolled
  const input = useRef<HTMLInputElement | null>(null)
  const [focused, setFocused] = useState(false)
  const [selection, setSelection] = useState<[number, number]>([0, 0])
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const locked = readOnly || status === 'verifying' || status === 'success'

  const setRef = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )

  /** Puts the caret on slot `index`: over its character (so typing replaces it) or at the end. */
  const select = useCallback(
    (index: number, text = input.current?.value ?? '') => {
      const el = input.current
      if (!el) return
      const i = Math.max(0, Math.min(index, text.length, size - 1))
      if (i < text.length) el.setSelectionRange(i, i + 1)
      else el.setSelectionRange(i, i)
      setSelection([i, i < text.length ? i + 1 : i])
    },
    [size],
  )

  // Where the caret should land after a change, applied once React has
  // rendered the new value (a controlled input resets it otherwise).
  const pendingCaret = useRef<number | null>(null)
  useLayoutEffect(() => {
    if (pendingCaret.current === null || document.activeElement !== input.current) return
    select(pendingCaret.current, value)
    pendingCaret.current = null
  })

  const commit = (next: string, caret: number) => {
    if (valueProp === undefined) setUncontrolled(next)
    pendingCaret.current = caret
    if (next !== value) onValueChange?.(next)
  }

  // Completion fires on the transition to full, not on every render while full.
  const wasComplete = useRef(value.length === size)
  useEffect(() => {
    const complete = value.length === size
    if (complete && !wasComplete.current) {
      onComplete?.(value)
      if (autoSubmit) input.current?.form?.requestSubmit()
    }
    wasComplete.current = complete
  }, [value, size, onComplete, autoSubmit])

  // The error shake: 4, 3, 2px and home, on the transition into error.
  useLayoutEffect(() => {
    if (status !== 'error' || k.reduced || !scope.current) return
    animate(scope.current, { x: [0, -4, 4, -3, 3, -2, 0] }, k.tween('slow', 'standard'))
  }, [status])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const el = event.currentTarget
    const raw = el.value
    const next = sanitize(raw, mode).slice(0, size)
    commit(next, sanitize(raw.slice(0, el.selectionStart ?? raw.length), mode).length)
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = sanitize(event.clipboardData.getData('text'), mode)
    event.preventDefault()
    if (!pasted || locked || disabled) return
    // A whole code replaces what is there; a fragment goes in at the caret.
    if (pasted.length >= size) return commit(pasted.slice(0, size), size)
    const [start, end] = selection
    const next = (value.slice(0, start) + pasted + value.slice(end)).slice(0, size)
    commit(next, start + pasted.length)
  }

  const handleKeyDown = (event: Parameters<NonNullable<InputPrimitive.Props['onKeyDown']>>[0]) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    const back = rtl ? 'ArrowRight' : 'ArrowLeft'
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const at = selection[0]
    if (event.key === back) select(at - 1)
    else if (event.key === forward) select(at + 1)
    else if (event.key === 'Home' || event.key === 'ArrowUp') select(0)
    else if (event.key === 'End' || event.key === 'ArrowDown') select(value.length)
    else return
    event.preventDefault()
  }

  // A click lands on the slot under the pointer (or the first empty one).
  const handlePointerDown = (event: PointerEvent<HTMLInputElement>) => {
    if (disabled) return
    const slots = scope.current?.querySelectorAll<HTMLElement>('[data-slot=input-otp-slot]')
    if (!slots) return
    let index = value.length
    slots.forEach((slot, i) => {
      const r = slot.getBoundingClientRect()
      if (event.clientX >= r.left && event.clientX <= r.right) index = i
    })
    event.preventDefault()
    input.current?.focus()
    select(index)
  }

  // Track the caret the browser moves on its own (typing, autofill, focus).
  useEffect(() => {
    if (!focused) return
    const sync = () => {
      const el = input.current
      if (!el || document.activeElement !== el) return
      const start = el.selectionStart ?? 0
      const end = el.selectionEnd ?? start
      // A collapsed caret before a character selects it, so typing replaces it.
      if (start === end && start < el.value.length) return select(start, el.value)
      if (start === end && start >= size) return select(size - 1, el.value)
      setSelection((prev) => (prev[0] === start && prev[1] === end ? prev : [start, end]))
    }
    document.addEventListener('selectionchange', sync)
    return () => document.removeEventListener('selectionchange', sync)
  }, [focused, select, size])

  const activeIndex = Math.min(selection[0], size - 1)
  const sizes = groups?.length && groups.reduce((a, b) => a + b, 0) === size ? groups : [size]
  const offsets = sizes.map((_, g) => sizes.slice(0, g).reduce((a, b) => a + b, 0))
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
  }, [])

  const slot = (index: number) => {
    const char = value[index]
    const active = focused && !locked && index === activeIndex
    const caret = active && !char && selection[0] === selection[1]
    return (
      <div
        key={index}
        data-slot="input-otp-slot"
        data-active={active || undefined}
        data-filled={char ? '' : undefined}
        style={{
          transitionDelay: status === 'success' && !k.reduced ? `${index * k.stagger('tight')}s` : undefined,
        }}
        className={cn(
          fieldControlClass,
          // Narrows (never below 2rem) rather than overflow a phone-width card.
          'relative own:grid h-control-lg w-control-lg min-w-8 shrink place-items-center own:p-0 own:text-base own:font-medium own:tabular-nums',
          'group-hover/input-otp:border-fg-subtle data-active:border-transparent',
          'group-data-[status=success]/input-otp:border-success group-data-[status=error]/input-otp:border-danger',
          'group-has-[input[aria-invalid=true]]/input-otp:border-danger group-has-[input[data-invalid]]/input-otp:border-danger',
          'group-data-disabled/input-otp:bg-band group-data-disabled/input-otp:opacity-50',
          'group-data-[status=verifying]/input-otp:text-fg-muted',
        )}
      >
        {char && (
          <m.span
            key={char}
            initial={mounted.current && !k.reduced ? { opacity: 0, y: 4 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={k.tween('fast', 'enter')}
          >
            {char}
          </m.span>
        )}
        {caret && (
          <m.span
            className="absolute h-4 w-px bg-fg"
            initial={{ opacity: 1 }}
            animate={k.reduced ? { opacity: 1 } : { opacity: [1, 1, 0, 0] }}
            transition={
              k.reduced ? { type: false } : { duration: k.duration('deliberate') * 2, times: [0, 0.5, 0.55, 1], repeat: Infinity }
            }
          />
        )}
      </div>
    )
  }

  return (
    <MotionFeatures>
      <div
        data-slot="input-otp"
        data-status={status}
        data-disabled={disabled || undefined}
        data-reduced-motion={k.reduced || undefined}
        className={cn('group/input-otp relative own:inline-flex w-full max-w-max items-center gap-3', className)}
      >
        <div ref={scope} className="relative isolate own:flex min-w-0 items-center gap-2" aria-hidden>
          {sizes.map((count, g) => (
            <Fragment key={g}>
              {g > 0 && <span className="h-px w-2.5 shrink-0 rounded-full bg-fg-subtle" />}
              <div data-slot="input-otp-group" className="own:flex min-w-0 items-center gap-1.5">
                {Array.from({ length: count }, (_, i) => slot(offsets[g]! + i))}
              </div>
            </Fragment>
          ))}
          <SlidingIndicator
            match="[data-active]"
            className={cn(
              'own:rounded-field-area border own:border-(--otp-frame) own:bg-transparent',
              'own:shadow-[0_0_0_var(--ui--focus-halo)_color-mix(in_oklab,var(--otp-frame)_22%,transparent)]',
              // Invalid: the frame and its halo turn destructive, like focus-field.
              '[--otp-frame:var(--color-focus)] group-has-[input[aria-invalid=true]]/input-otp:[--otp-frame:var(--color-danger)] group-has-[input[data-invalid]]/input-otp:[--otp-frame:var(--color-danger)]',
            )}
          />
        </div>
        <InputPrimitive
          ref={setRef}
          data-slot="input-otp-input"
          type="text"
          autoComplete="one-time-code"
          inputMode={PATTERNS[mode].inputMode}
          pattern={PATTERNS[mode].pattern}
          spellCheck={false}
          autoCapitalize={mode === 'alphanumeric' ? 'characters' : 'off'}
          autoCorrect="off"
          value={value}
          disabled={disabled}
          readOnly={locked}
          required={required ?? fieldRequired}
          {...(status === 'error' ? { 'aria-invalid': true } : {})}
          aria-busy={status === 'verifying' || undefined}
          minLength={size}
          onChange={handleChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onFocus={(event) => {
            onFocus?.(event)
            setFocused(true)
            select(value.length, event.currentTarget.value)
          }}
          onBlur={(event) => {
            onBlur?.(event)
            setFocused(false)
          }}
          className={cn(
            // Covers the slots, invisible: the slots draw it.
            'absolute inset-y-0 start-0 w-full cursor-text own:bg-transparent own:text-transparent caret-transparent outline-none',
            'selection:bg-transparent disabled:cursor-not-allowed own:[&:autofill]:shadow-[inset_0_0_0_100vmax_var(--color-canvas)]',
            // Keeps iOS from zooming, and the text tiny so it never scrolls.
            // youj-allow: fixed size, the hidden input's text is never read
            'own:text-[1px] own:tracking-[-1em] own:touch:text-base',
          )}
          {...props}
        />
        <span aria-hidden className="own:grid size-5 shrink-0 place-items-center">
          {status === 'verifying' && <Spinner label={null} className="own:text-fg-muted" />}
          {status === 'success' && (
            <CheckIcon trigger="mount" size={20} strokeWidth={2} className="own:text-success" />
          )}
        </span>
        <AsyncAnnouncer
          state={({ idle: 'idle', verifying: 'pending', success: 'success', error: 'error' } as const)[status]}
          pendingLabel={statusLabels?.verifying ?? labels.verifyingCode}
          successLabel={statusLabels?.success ?? labels.codeVerified}
          errorLabel={statusLabels?.error ?? labels.codeInvalid}
        />
      </div>
    </MotionFeatures>
  )
}

/**
 * Wires a code field to verification: when the code is complete it runs
 * `verify(code)` and drives `status` through verifying → success | error.
 * Resolve `true` (or nothing) for success; resolve `false` or throw for an
 * error. After an error the code is cleared once the shake has played, ready
 * for the next attempt. Spread `field` onto InputOTP.
 */
function useOTPVerification(
  verify: (code: string) => unknown,
  { clearOnError = true, onVerified }: { clearOnError?: boolean; onVerified?: (code: string) => void } = {},
) {
  const k = useYouj()
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<OTPStatus>('idle')
  const run = useRef(0)
  const clearTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(clearTimer.current), [])

  const onComplete = useCallback(
    async (code: string) => {
      const id = ++run.current
      setStatus('verifying')
      let ok: boolean
      try {
        ok = (await verify(code)) !== false
      } catch {
        ok = false
      }
      if (id !== run.current) return
      setStatus(ok ? 'success' : 'error')
      if (ok) onVerified?.(code)
      else if (clearOnError) {
        clearTimeout(clearTimer.current)
        clearTimer.current = setTimeout(() => setValue(''), k.reduced ? 0 : k.ms('slow'))
      }
    },
    [verify, onVerified, clearOnError, k],
  )

  const onValueChange = useCallback((next: string) => {
    setValue(next)
    // Typing again after an error starts a fresh attempt.
    setStatus((s) => (s === 'error' ? 'idle' : s))
  }, [])

  const reset = useCallback(() => {
    run.current++
    setValue('')
    setStatus('idle')
  }, [])

  return { status, value, reset, field: { value, onValueChange, onComplete, status } }
}

/** A countdown in whole seconds. `restart()` starts it again from `seconds`. */
function useCountdown(seconds: number, { autoStart = true }: { autoStart?: boolean } = {}) {
  // An auto start begins on mount, not while rendering: a prerender can't read the clock. Until then the full wait shows.
  const [endsAt, setEndsAt] = useState<number | 'mount' | null>(autoStart ? 'mount' : null)
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    if (endsAt === null) return
    if (endsAt === 'mount') {
      setEndsAt(Date.now() + seconds * 1000)
      return
    }
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [endsAt, seconds])
  const remaining = endsAt === null ? 0 : endsAt === 'mount' || now === null ? seconds : Math.max(0, Math.ceil((endsAt - now) / 1000))
  const restart = useCallback(() => {
    setNow(Date.now())
    setEndsAt(Date.now() + seconds * 1000)
  }, [seconds])
  return { remaining, running: remaining > 0, restart }
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

interface InputOTPResendProps extends Omit<AsyncButtonProps, 'onAction' | 'status' | 'children'> {
  /** Sends a new code. Resolve for success; reject to show the error. */
  onResend: () => unknown
  /** Seconds to wait between sends. Default 30. */
  seconds?: number
  /** Start waiting straight away (a code was just sent). Default true. */
  autoStart?: boolean
  /** The label while waiting. Default `Resend in 0:24`. */
  waitingLabel?: (time: string) => string
  children?: string
}

/**
 * "Resend code", held back by a countdown ("Resend in 0:24") that restarts
 * after each send. The send runs through AsyncButton, so it shows a
 * spinner and then a drawn check or an error in place. While waiting it stays
 * focusable, so keyboard users can read how long is left.
 */
function InputOTPResend({
  onResend,
  seconds = 30,
  autoStart = true,
  children,
  waitingLabel,
  variant = 'ghost',
  size = 'sm',
  disabled,
  ...props
}: InputOTPResendProps) {
  const labels = useComponentLabels(inputOtpLabels)
  const { remaining, running, restart } = useCountdown(seconds, { autoStart })
  return (
    <AsyncButton
      variant={variant}
      size={size}
      disabled={disabled || running}
      focusableWhenDisabled
      pendingLabel={labels.sending}
      successLabel={labels.sent}
      errorLabel={labels.sendFailed}
      onAction={async () => {
        await onResend()
        restart()
      }}
      {...props}
    >
      {running ? <span className="own:tabular-nums">{(waitingLabel ?? labels.resendIn)(clock(remaining))}</span> : (children ?? labels.resendCode)}
    </AsyncButton>
  )
}

export {
  InputOTP,
  InputOTPResend,
  useCountdown,
  useOTPVerification,
  type InputOTPProps,
  type InputOTPResendProps,
  type OTPMode,
  type OTPStatus,
}
