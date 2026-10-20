'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { CheckIcon } from '@youj/icons'
import { Spinner } from '../../../components/ui/spinner'
import { cn } from '../../../lib/utils'
import { problem, type SettingsField, type SettingsFormCopy, type SettingsValue, type SettingsValues } from './data'

/** Starts (or reuses) the check of one value; the entry's `result` is set once it answers. */
export type RunCheck = (field: Extract<SettingsField, { type: 'text' }>, value: string) => { promise: Promise<true | string>; result?: true | string }

/** "12/32" in the field: `quiet` shows it only while the field has focus, or once the limit is close. Close to it, a screen reader hears what's left. */
export function Counter({ count, max, quiet, plural, copy }: { count: number; max: number; quiet: boolean; plural: Intl.PluralRules; copy: SettingsFormCopy }) {
  const left = max - count
  const near = left <= Math.max(5, Math.round(max * 0.1))
  return (
    <>
      <span
        aria-hidden
        className={cn(
          'shrink-0 font-mono text-ui-xs text-fg-subtle tabular-nums transition-opacity yj-duration-fast ease-standard',
          left < 0 ? 'text-danger-text' : near && 'text-warning-text',
          quiet && !near && 'opacity-0 group-focus-within/input-group:opacity-100',
        )}
      >
        {count}/{max}
      </span>
      <span className="sr-only" aria-live="polite">
        {near ? copy.left(left, plural.select(Math.abs(left))) : ''}
      </span>
    </>
  )
}

type CheckState = { value: string; status: 'checking' | 'ok' | 'refused' }

/** A URL-style check: asks about a changed, otherwise valid value once typing pauses, then has the field validated with the answer. */
export function Availability({
  field,
  value,
  saved,
  copy,
  runCheck,
}: {
  field: Extract<SettingsField, { type: 'text' }>
  value: string
  saved: SettingsValue | undefined
  copy: SettingsFormCopy
  runCheck: RunCheck
}) {
  const form = useFormContext<SettingsValues>()
  const [state, setState] = useState<CheckState | null>(null)
  const asks = value !== saved && !!value && !problem(field, value, form.getValues(), copy)
  // The field, the check and the form change identity on every render; the timer reads the latest.
  const latest = useRef({ field, runCheck, form })
  useLayoutEffect(() => {
    latest.current = { field, runCheck, form }
  })

  useEffect(() => {
    if (!asks) return
    let live = true
    const timer = setTimeout(() => {
      const { field, runCheck, form } = latest.current
      const entry = runCheck(field, value)
      if (entry.result === undefined) setState({ value, status: 'checking' })
      entry.promise.then((result) => {
        if (!live) return
        setState({ value, status: result === true ? 'ok' : 'refused' })
        // Validate the field with the answer, so a refusal shows under it at once.
        void form.trigger(field.name)
      })
    }, 400)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [asks, value])

  const status = asks && state?.value === value ? state.status : null
  return (
    <>
      {status === 'checking' && <Spinner size={14} label={copy.checking} />}
      {status === 'ok' && <CheckIcon size={15} className="text-success-text" aria-hidden />}
      <span className="sr-only" aria-live="polite">
        {status === 'ok' ? copy.available : ''}
      </span>
    </>
  )
}
