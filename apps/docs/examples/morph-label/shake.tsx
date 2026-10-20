'use client'

import { useId, useRef, useState } from 'react'
import { animate, motion } from 'motion/react'
import { useYouj } from '@youj/core'
import { MorphLabel, useMorphRoot } from '@youj/motion'
import { CheckIcon } from '@youj/icons'

type State = 'idle' | 'invalid' | 'applied'

export default function MorphLabelShake() {
  const k = useYouj()
  const id = useId()
  const morph = useMorphRoot(8)
  const label = useRef<HTMLSpanElement>(null)
  const [code, setCode] = useState('')
  const [state, setState] = useState<State>('idle')

  function apply() {
    if (code.trim().toUpperCase() === 'YOUJ') return setState('applied')
    setState('invalid')
    // The ref is a stable inner span: it shakes without fighting the box's width morph.
    if (label.current && !k.reduced) animate(label.current, { x: [0, -4, 4, -3, 3, -2, 0] }, k.tween('base'))
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        apply()
      }}
      className="w-full max-w-sm rounded-xl border border-line bg-surface p-4"
    >
      <label htmlFor={id} className="text-sm font-medium text-fg">
        Promo code
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id={id}
          value={code}
          placeholder="Try YOUJ"
          aria-invalid={state === 'invalid' || undefined}
          aria-describedby={`${id}-message`}
          onChange={(e) => {
            setCode(e.target.value)
            if (state !== 'idle') setState('idle')
          }}
          className="h-8 min-w-0 flex-1 rounded-md border border-line bg-canvas px-2.5 font-mono text-sm text-fg uppercase outline-none placeholder:text-fg-muted placeholder:normal-case aria-invalid:border-danger focus-visible:ring-2 focus-visible:ring-accent"
        />
        <motion.button
          {...morph}
          type="submit"
          className="relative inline-flex h-8 shrink-0 items-center overflow-hidden border border-line bg-raised px-3 text-[13px] font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <MorphLabel ref={label} value={state} contentClassName="gap-1.5">
            {state === 'applied' && <CheckIcon trigger="mount" size={14} strokeWidth={2} className="text-success" />}
            {state === 'applied' ? 'Applied' : state === 'invalid' ? 'Try again' : 'Apply'}
          </MorphLabel>
        </motion.button>
      </div>
      {/* One live region for both outcomes, mounted from the start so its first message is heard. */}
      <p id={`${id}-message`} role="status" className={`mt-2 min-h-4 text-xs ${state === 'invalid' ? 'text-danger' : 'text-fg-muted'}`}>
        {state === 'invalid' && 'That code isn’t valid. Check it and try again.'}
        {state === 'applied' && '20% off your first year of Pro.'}
      </p>
    </form>
  )
}
