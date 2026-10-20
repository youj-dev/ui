'use client'

import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { CopyIcon } from '@youj/icons/components/youj/icons/copy'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useSoundCue } from '@youj/core/lib/youj/sound-cue'
import { cn } from '@/lib/cn'
import { copyToast } from '@/lib/copy-toast'

/** "Copy the install command" -> "Install command copied". */
function copiedTitle(label: string) {
  const what = label.replace(/^Copy:?\s+(the\s+)?/i, '')
  return what && what !== label ? `${what[0].toUpperCase()}${what.slice(1)} copied` : 'Copied'
}

/**
 * Copies `value`, or the text of the nearest `[data-copy-root]`'s <pre> when
 * no value is given (server-rendered code blocks). `disabled` while the text
 * it copies is still on its way. The icon writes its check
 * mark, then un-writes it after a moment. On touch its hit area grows to 44px past the 28px it's drawn at (an ::after), so
 * a block's corner isn't covered by it.
 */
export function CopyButton({ value, label = 'Copy', className, disabled }: { value?: string; label?: string; className?: string; disabled?: boolean }) {
  const k = useYouj()
  const cue = useSoundCue()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const onClick = async (e: MouseEvent<HTMLButtonElement>) => {
    const text = value ?? e.currentTarget.closest('[data-copy-root]')?.querySelector('pre')?.textContent ?? ''
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      cue('error')
      return
    }
    cue('success')
    copyToast(copiedTitle(label), text.length <= 80 && !text.includes('\n') ? text : undefined)
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), k.ms('deliberate') * 3)
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={copied ? 'Copied' : label} className={cn('icon-button relative size-7 rounded-md disabled:pointer-events-none disabled:opacity-40 touch:after:absolute touch:after:-inset-2 touch:after:content-[""]', className)}>
      <CopyIcon size={15} strokeWidth={1.6} active={copied} />
      <span aria-live="polite" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </button>
  )
}
