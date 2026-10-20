'use client'

import { useEffect, useRef, useState } from 'react'
import { useVisible } from '../../../hooks/use-visible'
import type { HealthDialCopy } from './data'
import { numberFormat } from '../../../lib/utils'

/* The "checked … ago" count. It counts up in the browser only, so the server and the first client render agree, and it is its own component so a tick re-renders this text and not the whole panel. It holds while the panel is off screen or its tab is hidden. */
export function CheckedAgo({ from, copy, locale }: { from: number; copy: HealthDialCopy; locale: string }) {
  const root = useRef<HTMLSpanElement>(null)
  const visible = useVisible(root)
  const [seconds, setSeconds] = useState(from)
  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [visible])
  const ago = numberFormat(locale, { style: 'unit', unit: 'second', unitDisplay: 'narrow' }).format(seconds)
  const [before, after = ''] = copy.checked.split('{ago}')
  return (
    <span ref={root}>
      {seconds < 2 ? (
        copy.justNow
      ) : (
        <span>
          {before}
          <span className="tabular-nums">{ago}</span>
          {after}
        </span>
      )}
    </span>
  )
}
