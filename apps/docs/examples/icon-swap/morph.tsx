'use client'

import { useState } from 'react'
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CheckIcon,
  FilterIcon,
  HeartIcon,
  IconSwap,
  InboxIcon,
  MailIcon,
  SearchIcon,
  SendIcon,
  StarIcon,
  UserCheckIcon,
  UserPlusIcon,
  type SwapIcon,
} from '@youj/icons'

// Any two icons, even ones that share nothing: shared strokes hold, the rest bend or draw.
const PAIRS: { from: SwapIcon; to: SwapIcon; states: [string, string] }[] = [
  { from: ArrowRightIcon, to: CheckIcon, states: ['next', 'done'] },
  { from: UserPlusIcon, to: UserCheckIcon, states: ['invite', 'invited'] },
  { from: SendIcon, to: CheckCircleIcon, states: ['send', 'sent'] },
  { from: SearchIcon, to: FilterIcon, states: ['search', 'filter'] },
  { from: MailIcon, to: InboxIcon, states: ['mail', 'inbox'] },
  { from: HeartIcon, to: StarIcon, states: ['heart', 'star'] },
]

export default function IconSwapMorph() {
  const [on, setOn] = useState<boolean[]>(() => PAIRS.map(() => false))
  const all = on.every(Boolean)

  return (
    <div className="@container w-full max-w-2xl">
      <div className="grid grid-cols-2 gap-2 @md:grid-cols-3">
        {PAIRS.map(({ from, to, states }, i) => (
          <button
            key={states[0]}
            type="button"
            aria-pressed={on[i]}
            onClick={() => setOn((s) => s.map((v, j) => (j === i ? !v : v)))}
            className="flex flex-col items-center gap-4 rounded-xl border border-line bg-surface px-3 pt-6 pb-3.5 text-fg-muted transition-colors duration-(--yj-duration-fast) ease-standard hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none aria-pressed:border-line-strong aria-pressed:text-fg"
          >
            <IconSwap from={from} to={to} active={on[i]} transition="morph" size={44} strokeWidth={1.25} />
            <span className="font-mono text-xs">
              <span className={on[i] ? 'text-fg-muted' : 'text-fg'}>{states[0]}</span>
              <span aria-hidden> → </span>
              <span className="sr-only"> to </span>
              <span className={on[i] ? 'text-fg' : 'text-fg-muted'}>{states[1]}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={() => setOn(PAIRS.map(() => !all))}
          className="h-8 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-fg transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          {all ? 'Reset all' : 'Morph all'}
        </button>
      </div>
    </div>
  )
}
