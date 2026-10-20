'use client'

import { useId, useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '@youj/core'
import { AsyncAnnouncer, AsyncFeedback, useAsyncAction, useMorphRoot } from '@youj/motion'
import { SendIcon } from '@youj/icons'
import { Input, Label, Switch } from '@youj/react'

const LABELS = { pendingLabel: 'Sending…', successLabel: 'Invited', errorLabel: 'Couldn’t send' }

// A stand-in for your API: it settles after a moment, and fails when asked to.
const sendInvite = (fail: boolean) => new Promise<void>((resolve, reject) => setTimeout(fail ? reject : resolve, 1400))

export default function AsyncFeedbackDemo() {
  const id = useId()
  const [email, setEmail] = useState('priya@northwind.dev')
  const [fail, setFail] = useState(false)
  const { state, run } = useAsyncAction(() => sendInvite(fail))
  const morph = useMorphRoot(8)

  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex flex-col gap-1.5 px-5 pt-4 pb-5">
        <p className="text-sm font-medium text-fg">Invite a teammate</p>
        <p className="mb-3 text-xs text-fg-muted">They’ll get an email with a link to join northwind.</p>
        <Label htmlFor={`${id}-email`}>Email</Label>
        <Input id={`${id}-email`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line bg-canvas px-5 py-3">
        <span className="flex items-center gap-2">
          <Switch id={`${id}-fail`} size="sm" checked={fail} onCheckedChange={setFail} />
          <Label htmlFor={`${id}-fail`} className="text-xs font-normal text-fg-muted">
            Fail the next request
          </Label>
        </span>
        {/* The box morphs to each label's width on the same spring as the label. */}
        <motion.button
          type="button"
          {...morph}
          onClick={run}
          aria-busy={state === 'pending' || undefined}
          className={cn(
            'relative inline-flex h-8 shrink-0 items-center justify-center overflow-hidden bg-fg px-3 text-[13px] font-medium text-canvas outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
            (state === 'success' || state === 'error') && 'text-on-accent',
          )}
        >
          <AsyncFeedback state={state} {...LABELS}>
            <SendIcon size={14} />
            Send invite
          </AsyncFeedback>
        </motion.button>
        {/* Outside the button: a button flattens its content, so its own live region would go unheard. */}
        <AsyncAnnouncer state={state} {...LABELS} />
      </div>
    </div>
  )
}
