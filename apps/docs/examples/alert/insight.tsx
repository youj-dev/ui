'use client'

import { Alert, AlertDescription } from '@youj/react'
import { ArrowRightIcon, SparklesIcon } from '@youj/icons'

const INSIGHTS = [
  { text: 'Preview builds are up 18% this week.', quiet: false },
  { text: 'Cache hits fell to 71% after Tuesday’s lockfile change.', quiet: true },
]

export default function AlertInsight() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      {INSIGHTS.map(({ text, quiet }) => (
        <Alert
          key={text}
          icon={<SparklesIcon />}
          className={quiet ? 'items-center border-line-subtle bg-band [--alert-icon:var(--color-accent)]' : 'items-center'}
        >
          <AlertDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex-1 text-fg">{text}</span>
            <a href="#insight" className="inline-flex items-center gap-1 font-medium no-underline! hover:underline!">
              See why
              <ArrowRightIcon className="size-3.5 rtl:-scale-x-100" />
            </a>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
