'use client'

import { useState } from 'react'
import { cn } from '../../../lib/utils'

/* A number the row can read and, in a custom split, type into: soft-filled and
 * borderless, right-aligned with tabular figures. Away from focus it shows the
 * formatted number; focused, it shows what is being typed, and every keystroke
 * reaches `onType` so the bar and the other column follow live. Read-only (an
 * equal split), it is the same box without the fill, so the row keeps its size. */

export const FIELD = 'flex h-control min-w-0 items-center justify-end gap-1 rounded-(--radius-control) px-3 text-ui tabular-nums'
const SOFT = 'bg-band hover:bg-hover focus-ring-within'

interface NumberFieldProps {
  label: string
  /** The number as it reads at rest, without its currency or unit sign or percent sign. */
  text: string
  /** What the field holds when focus starts editing it. */
  seed: string
  editable: boolean
  /** The currency or unit sign, or the percent sign, set apart so the number aligns. */
  sign?: string
  /** Whether the sign comes before the number. Default false. */
  signFirst?: boolean
  onType: (text: string) => void
}

export function NumberField({ label, text, seed, editable, sign, signFirst = false, onType }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const mark = sign ? <span className="shrink-0 text-fg-muted">{sign}</span> : null
  if (!editable) {
    return (
      <div className={FIELD}>
        <span className="sr-only">{label}</span>
        {signFirst && mark}
        <span>{text}</span>
        {!signFirst && mark}
      </div>
    )
  }
  return (
    <label className={cn(FIELD, SOFT, 'cursor-text')}>
      {signFirst && mark}
      <input
        aria-label={label}
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={draft ?? text}
        onFocus={(event) => {
          setDraft(seed)
          event.currentTarget.select()
        }}
        onBlur={() => setDraft(null)}
        onChange={(event) => {
          setDraft(event.target.value)
          onType(event.target.value)
        }}
        className="w-full min-w-0 bg-transparent text-end tabular-nums outline-none"
      />
      {!signFirst && mark}
    </label>
  )
}
