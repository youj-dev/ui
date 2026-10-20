'use client'

import { motion } from 'motion/react'
import { useYouj } from '@youj/core'
import { cn } from '../../../lib/utils'

/** A dot with a slow halo; the halo stops under reduced motion. */
function PulseDot({ tone }: { tone: 'success' | 'warning' }) {
  const k = useYouj()
  const fill = tone === 'success' ? 'bg-success' : 'bg-warning'
  return (
    <span aria-hidden className="relative flex size-2.5 shrink-0">
      {!k.reduced && (
        <motion.span
          className={cn('absolute inset-0 rounded-full', fill)}
          animate={{ scale: [1, 2.8], opacity: [0.55, 0] }}
          transition={{ ...k.tween('deliberate', 'exit'), repeat: Infinity, repeatDelay: k.duration('deliberate') }}
        />
      )}
      <span className={cn('relative size-2.5 rounded-full', fill)} />
    </span>
  )
}

export { PulseDot }
