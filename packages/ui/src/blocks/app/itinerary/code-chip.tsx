'use client'

import { useRef, useState } from 'react'
import { CheckIcon, CopyIcon, IconSwap } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
import type { ItineraryCopy } from './data'

interface CodeChipProps {
  code: string
  copy: ItineraryCopy
  onCopied: (code: string) => void
  className?: string
}

/** A booking reference in mono with a copy button; the copy turns into a check for a moment. */
export function CodeChip({ code, copy, onCopied, className }: CodeChipProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  return (
    <span data-slot="itinerary-code" className={cn('inline-flex h-control-sm shrink-0 items-center gap-0.5 rounded-md bg-band ps-2.5 pe-0.5', className)}>
      <span className="font-mono text-ui-sm tracking-wide text-fg tabular-nums">{code}</span>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={copy.copyCode(code)}
        className="text-fg-muted"
        onClick={() => {
          void navigator.clipboard?.writeText(code).catch(() => {})
          setCopied(true)
          clearTimeout(timer.current)
          timer.current = setTimeout(() => setCopied(false), 1600)
          onCopied(code)
        }}
      >
        <IconSwap from={CopyIcon} to={CheckIcon} active={copied} size={12} />
      </Button>
    </span>
  )
}
