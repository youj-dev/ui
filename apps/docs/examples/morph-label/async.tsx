'use client'

import { useEffect, useId, useState } from 'react'
import { motion } from 'motion/react'
import { useYouj } from '@youj/core'
import { MorphLabel, useMorphRoot } from '@youj/motion'
import { CheckIcon, LoaderRingIcon, SaveIcon } from '@youj/icons'

type State = 'idle' | 'saving' | 'saved'

const LABEL: Record<State, string> = { idle: 'Save changes', saving: 'Saving…', saved: 'Saved' }

// Stands in for a request to your API.
const save = () => new Promise((resolve) => setTimeout(resolve, 1400))

export default function MorphLabelAsync() {
  const k = useYouj()
  const id = useId()
  const morph = useMorphRoot(8)
  const [state, setState] = useState<State>('idle')
  const [name, setName] = useState('youj-web')

  // Hold the outcome for a beat, on the token grid, then return to rest.
  useEffect(() => {
    if (state !== 'saved') return
    const t = setTimeout(() => setState('idle'), k.ms('deliberate') * 3)
    return () => clearTimeout(t)
  }, [state, k])

  async function submit() {
    if (state === 'saving') return
    setState('saving')
    await save()
    setState('saved')
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="w-full max-w-sm rounded-xl border border-line bg-surface p-4"
    >
      <label htmlFor={id} className="text-sm font-medium text-fg">
        Project name
      </label>
      <input
        id={id}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mt-2 h-9 w-full rounded-md border border-line bg-canvas px-3 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      <div className="mt-4 flex items-center justify-end gap-3">
        <motion.button
          {...morph}
          type="submit"
          aria-busy={state === 'saving' || undefined}
          className="relative inline-flex h-8 items-center overflow-hidden bg-fg px-3 text-[13px] font-medium text-canvas outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {/* The key is the state: a new state crossfades while the box morphs to its width. */}
          <MorphLabel value={state} contentClassName="gap-1.5">
            {state === 'idle' && <SaveIcon size={14} />}
            {state === 'saving' && <LoaderRingIcon size={14} />}
            {state === 'saved' && <CheckIcon trigger="mount" size={14} strokeWidth={2} />}
            {LABEL[state]}
          </MorphLabel>
        </motion.button>
      </div>
      <span role="status" className="sr-only">
        {state === 'saved' ? 'Changes saved' : ''}
      </span>
    </form>
  )
}
