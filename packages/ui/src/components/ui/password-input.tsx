'use client'

import { useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { Meter as MeterPrimitive } from '@base-ui/react/meter'
import { CapsLockIcon } from '@youj/icons/components/youj/icons/caps-lock'
import { CheckIcon } from '@youj/icons/components/youj/icons/check'
import { EyeIcon } from '@youj/icons/components/youj/icons/eye'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { passwordInputLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from './input-group'

/* A password field, a strength meter and a requirements checklist, built to
 * be composed inside one Field.
 * - PasswordInput is an InputGroup: the reveal button is motion's EyeIcon,
 *   which blinks shut and draws its slash as the password shows. Pressing it
 *   with a pointer leaves the caret where it was, so you can peek mid-word.
 *   Caps Lock shows a quiet mark and is announced once.
 * - PasswordStrength is a Base UI meter (role="meter") in four segments that
 *   fill from the inline start, one stagger step apart, and tint from danger
 *   to success. Scoring is a small built-in estimate (length × character
 *   variety, minus common passwords, runs and repeats), or your own `scorer`.
 * - PasswordRequirements ticks each rule with CheckIcon's draw as it is met.
 * Reduced motion: the eye swaps, segments fill and checks appear at once. */

interface PasswordInputProps extends Omit<InputPrimitive.Props, 'type'> {
  /** Controlled visibility. */
  visible?: boolean
  defaultVisible?: boolean
  onVisibleChange?: (visible: boolean) => void
  /** Default 'current-password'; use 'new-password' when choosing one. */
  autoComplete?: string
  /** Wrapper class; `className` goes to the input. */
  groupClassName?: string
}

function PasswordInput({
  visible: visibleProp,
  defaultVisible = false,
  onVisibleChange,
  autoComplete = 'current-password',
  disabled,
  className,
  groupClassName,
  onKeyDown,
  onKeyUp,
  onBlur,
  ...props
}: PasswordInputProps) {
  const labels = useComponentLabels(passwordInputLabels)
  const [uncontrolled, setUncontrolled] = useState(defaultVisible)
  const visible = visibleProp ?? uncontrolled
  const [capsLock, setCapsLock] = useState(false)
  const toggle = () => {
    if (visibleProp === undefined) setUncontrolled(!visible)
    onVisibleChange?.(!visible)
  }
  const readCaps = (event: KeyboardEvent<HTMLInputElement>) => setCapsLock(!!event.getModifierState?.('CapsLock'))

  return (
    <InputGroup data-slot="password-input" className={groupClassName}>
      <InputGroupInput
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={disabled}
        className={cn('[&::-ms-reveal]:hidden', !visible && 'tracking-wide', className)}
        onKeyDown={(event) => {
          readCaps(event)
          onKeyDown?.(event)
        }}
        onKeyUp={(event) => {
          readCaps(event)
          onKeyUp?.(event)
        }}
        onBlur={(event) => {
          setCapsLock(false)
          onBlur?.(event)
        }}
        {...props}
      />
      <InputGroupAddon align="inline-end" className="gap-1">
        {capsLock && <CapsLockIcon active className="size-4 own:text-warning-text" />}
        <span role="status" className="sr-only">
          {capsLock ? labels.capsLockOn : ''}
        </span>
        <InputGroupButton
          size="icon-xs"
          aria-label={labels.showPassword}
          aria-pressed={visible}
          disabled={disabled}
          // A pointer press keeps focus (and the caret) in the field.
          onPointerDown={(event) => event.preventDefault()}
          onClick={toggle}
        >
          <EyeIcon active={visible} size={16} strokeWidth={1.75} />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

/* ── Strength ──────────────────────────────────────────────────────────── */

type PasswordScore = 0 | 1 | 2 | 3 | 4

interface PasswordStrengthResult {
  score: PasswordScore
  /** Overrides the label for this score. */
  label?: string
}

const COMMON = new Set([
  'password', 'password1', 'passw0rd', '123456', '12345678', '123456789', '1234567890', 'qwerty', 'qwertyuiop', 'abc123',
  'letmein', 'welcome', 'iloveyou', 'admin', 'monkey', 'dragon', 'football', 'baseball', 'sunshine', 'princess', 'master',
  'login', 'starwars', 'trustno1', 'whatever', 'shadow', 'superman', 'michael', 'secret', 'changeme',
])

/** Characters that continue a run of 3+ ascending or descending neighbors (abc, 321) or repeats (aaa). */
function patternedCharacters(password: string) {
  let patterned = 0
  const s = password.toLowerCase()
  for (let i = 2; i < s.length; i++) {
    const a = s.charCodeAt(i - 2)
    const b = s.charCodeAt(i - 1)
    const c = s.charCodeAt(i)
    if (b - a === c - b && Math.abs(c - b) <= 1) patterned++
  }
  return patterned
}

/**
 * A small, dependency-free estimate: bits from length × character variety,
 * with runs, repeats and common passwords discounted. 0 very weak … 4 strong.
 * For a thorough estimate pass your own `scorer` (zxcvbn, a server check).
 */
function scorePassword(password: string): PasswordStrengthResult {
  if (!password) return { score: 0 }
  const lowered = password.toLowerCase()
  if (COMMON.has(lowered) || COMMON.has(lowered.replace(/[^a-z]/g, ''))) return { score: 0 }
  const pool =
    (/[a-z]/.test(password) ? 26 : 0) +
    (/[A-Z]/.test(password) ? 26 : 0) +
    (/[0-9]/.test(password) ? 10 : 0) +
    (/[^a-zA-Z0-9]/.test(password) ? 33 : 0)
  const effective = password.length - patternedCharacters(password) * 0.75
  const bits = effective * Math.log2(Math.max(pool, 1))
  const score: PasswordScore = bits < 40 ? 0 : bits < 55 ? 1 : bits < 70 ? 2 : bits < 90 ? 3 : 4
  // Short passwords stay weak however varied they are.
  return { score: password.length < 8 ? (Math.min(score, 1) as PasswordScore) : score }
}

const STRENGTH_LABELS = ['passwordVeryWeak', 'passwordWeak', 'passwordFair', 'passwordGood', 'passwordStrong'] as const

const SEGMENT_TINT = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-success', 'bg-success'] as const
const LABEL_TINT = ['own:text-danger-text', 'own:text-danger-text', 'own:text-warning-text', 'own:text-success-text', 'own:text-success-text'] as const

interface PasswordStrengthProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The password to score. */
  value: string
  /** Your own estimate: a 0–4 score, or `{ score, label }`. */
  scorer?: (password: string) => number | PasswordStrengthResult
  /** Five labels, very weak → strong. */
  labels?: readonly [string, string, string, string, string]
}

function PasswordStrength({ value, scorer, labels: labelsProp, className, ...props }: PasswordStrengthProps) {
  const k = useYouj()
  const copy = useComponentLabels(passwordInputLabels)
  const labels = labelsProp ?? STRENGTH_LABELS.map((key) => copy[key])
  const raw: number | PasswordStrengthResult = value ? (scorer ?? scorePassword)(value) : { score: 0 }
  const result: { score: number; label?: string } = typeof raw === 'number' ? { score: raw } : raw
  const score = Math.max(0, Math.min(4, Math.round(result.score))) as PasswordScore
  const label = value ? (result.label ?? labels[score]) : ''
  // Four segments: any password lights the first, strong fills them all.
  const filled = value ? Math.max(1, score) : 0

  return (
    <MeterPrimitive.Root
      data-slot="password-strength"
      data-reduced-motion={k.reduced || undefined}
      value={value ? score : 0}
      min={0}
      max={4}
      aria-valuetext={label || copy.noPassword}
      className={cn('own:flex items-center gap-3', className)}
      {...props}
    >
      <MeterPrimitive.Label className="sr-only">{copy.passwordStrength}</MeterPrimitive.Label>
      <div className="own:flex flex-1 gap-1" aria-hidden>
        {[0, 1, 2, 3].map((i) => {
          const on = i < filled
          return (
            <span key={i} className="relative h-1 flex-1 overflow-hidden rounded-full bg-well">
              <span
                data-on={on || undefined}
                style={{ transitionDelay: k.reduced ? undefined : `${(on ? i : 3 - i) * k.stagger('base')}s` }}
                className={cn(
                  'absolute inset-0 origin-left scale-x-0 rounded-full rtl:origin-right',
                  'transition-[scale,background-color] yj-duration-base ease-standard data-on:scale-x-100',
                  SEGMENT_TINT[score],
                )}
              />
            </span>
          )
        })}
      </div>
      <span
        aria-hidden
        className={cn(
          'min-w-16 own:text-end own:text-ui-sm own:font-medium transition-colors yj-duration-fast ease-standard',
          value ? LABEL_TINT[score] : 'own:text-fg-muted',
        )}
      >
        {label}
      </span>
      {/* The meter's value isn't announced as it changes; the label is, once per change. */}
      <span role="status" className="sr-only">
        {label ? copy.passwordStrengthIs(label) : ''}
      </span>
    </MeterPrimitive.Root>
  )
}

/* ── Requirements ──────────────────────────────────────────────────────── */

interface PasswordRequirement {
  label: ReactNode
  test: (password: string) => boolean
}

const defaultPasswordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Upper and lower case', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: 'A number', test: (p) => /[0-9]/.test(p) },
  { label: 'A symbol', test: (p) => /[^a-zA-Z0-9\s]/.test(p) },
]

// The default rules' names, in the same order, for the provider's labels.
const requirementLabels = ['passwordMinLength', 'passwordMixedCase', 'passwordNumber', 'passwordSymbol'] as const

interface PasswordRequirementsProps extends Omit<ComponentProps<'ul'>, 'children'> {
  value: string
  requirements?: PasswordRequirement[]
}

/** A checklist that ticks each rule as the password meets it. Point the input's `aria-describedby` at its `id`. */
function PasswordRequirements({
  value,
  requirements: requirementsProp,
  className,
  ...props
}: PasswordRequirementsProps) {
  const k = useYouj()
  const labels = useComponentLabels(passwordInputLabels)
  const requirements =
    requirementsProp ?? defaultPasswordRequirements.map((rule, i) => ({ ...rule, label: labels[requirementLabels[i]!] }))
  return (
    <ul
      data-slot="password-requirements"
      data-reduced-motion={k.reduced || undefined}
      className={cn('own:grid gap-x-4 gap-y-1.5 own:text-ui-sm sm:grid-cols-2', className)}
      {...props}
    >
      {requirements.map((rule, i) => {
        const met = rule.test(value)
        return (
          <li
            key={i}
            data-met={met || undefined}
            className="flex items-center gap-2 text-fg-muted transition-colors yj-duration-fast ease-standard data-met:text-fg"
          >
            <span aria-hidden className="own:grid size-3.5 shrink-0 place-items-center">
              {met ? (
                <CheckIcon trigger="mount" size={14} strokeWidth={2.25} className="own:text-success" />
              ) : (
                <span className="size-1.5 rounded-full bg-fg-subtle" />
              )}
            </span>
            <span className="sr-only">{`${met ? labels.requirementMet : labels.requirementUnmet}: `}</span>
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}

export {
  PasswordInput,
  PasswordStrength,
  PasswordRequirements,
  scorePassword,
  defaultPasswordRequirements,
  type PasswordInputProps,
  type PasswordStrengthProps,
  type PasswordStrengthResult,
  type PasswordRequirement,
  type PasswordRequirementsProps,
  type PasswordScore,
}
