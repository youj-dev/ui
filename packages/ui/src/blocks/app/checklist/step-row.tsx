'use client'

import { useId, useState } from 'react'
import { motion } from 'motion/react'
import { useYouj } from '@youj/core'
import { Collapse } from '@youj/motion'
import { CheckIcon, ChevronDownIcon } from '@youj/icons'
import { AsyncButton } from '../../../components/ui/async-button'
import { cn } from '../../../lib/utils'
import type { ChecklistCopy, ChecklistStep } from './data'

export function ProgressRing({ value, size = 36 }: { value: number; size?: number }) {
  const k = useYouj()
  const r = size / 2 - 3
  return (
    <svg aria-hidden width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90 rtl:scale-x-[-1]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3} className="stroke-band" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        className="stroke-accent"
        initial={false}
        animate={{ pathLength: Math.max(value, 0.001) }}
        transition={k.reduced ? { type: false } : k.spring('smooth')}
      />
    </svg>
  )
}

export function StepRow({
  step,
  done,
  open,
  onToggle,
  onRun,
  onDone,
  copy,
}: {
  step: ChecklistStep
  done: boolean
  open: boolean
  onToggle: () => void
  /** Does the step's work; a rejection keeps the step open with its message. */
  onRun: () => Promise<unknown> | unknown
  onDone: () => void
  copy: ChecklistCopy
}) {
  const k = useYouj()
  const panel = useId()
  const [failure, setFailure] = useState<string>()
  return (
    <div className={cn('rounded-lg transition-colors yj-duration-fast ease-standard', open && !done && 'bg-transparent')}>
      <button
        type="button"
        aria-expanded={done ? undefined : open}
        aria-controls={done ? undefined : panel}
        disabled={done}
        onClick={onToggle}
        className="focus-ring flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start text-ui disabled:cursor-default"
      >
        <span
          aria-hidden
          className={cn(
            'grid size-5 shrink-0 place-items-center rounded-full border transition-colors yj-duration-fast ease-standard',
            done ? 'border-transparent bg-accent text-on-accent' : 'border-line-strong text-fg-muted',
          )}
        >
          {done ? <CheckIcon trigger="mount" size={12} strokeWidth={3} /> : null}
        </span>
        <span className={cn('min-w-0 flex-1 truncate', done ? 'text-fg-muted line-through decoration-line-strong' : 'font-medium text-fg')}>
          {step.title}
          {done && <span className="sr-only">{copy.doneSr}</span>}
        </span>
        {!done && (
          <ChevronDownIcon
            size={14}
            className={cn('shrink-0 text-fg-muted transition-transform yj-duration-base ease-standard', open && 'rotate-180')}
          />
        )}
      </button>
      {!done && (
        <Collapse id={panel} open={open}>
          <div className="flex flex-col items-start gap-3 ps-10 pe-3 pb-3">
            <p className="text-ui-sm text-fg-muted">{step.description}</p>
            <AsyncButton
              size="sm"
              pendingLabel={copy.working}
              successLabel={copy.done}
              onAction={async () => {
                setFailure(undefined)
                try {
                  await onRun()
                } catch (failed) {
                  setFailure(failed instanceof Error && failed.message ? failed.message : copy.failed)
                  throw failed
                }
              }}
              // Let "Done" land on the button, then the row moves down into Done.
              onActionStateChange={(state) => state === 'success' && setTimeout(onDone, k.reduced ? 0 : k.ms('slow'))}
            >
              {step.icon}
              {step.action}
            </AsyncButton>
            {failure && <p className="text-ui-sm text-danger-text">{failure}</p>}
          </div>
        </Collapse>
      )}
    </div>
  )
}

export function FauxApp() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex opacity-60">
      <div className="hidden w-56 flex-col gap-3 border-e border-line bg-chrome p-4 md:flex">
        <div className="h-6 w-24 rounded-md bg-well" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-4 rounded bg-well" style={{ width: `${60 + ((i * 17) % 35)}%` }} />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-6 p-6 md:p-10">
        <div className="h-8 w-48 rounded-md bg-well" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-line bg-surface" />
          ))}
        </div>
        <div className="h-64 rounded-xl border border-line bg-surface" />
      </div>
    </div>
  )
}
