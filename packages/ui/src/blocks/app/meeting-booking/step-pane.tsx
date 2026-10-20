'use client'

import { motion } from 'motion/react'
import { useDirection, useYouj } from '@youj/core'

function StepPane({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const k = useYouj()
  // The next step enters from the reading end: the right, or the left under RTL.
  const from = useDirection() === 'rtl' ? -12 : 12
  return (
    <motion.div
      key={id}
      initial={k.reduced ? false : { opacity: 0, x: from }}
      animate={{ opacity: 1, x: 0 }}
      transition={k.reduced ? { type: false } : k.tween('base', 'enter')}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export { StepPane }
