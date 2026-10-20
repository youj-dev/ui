'use client'

import { useEffect, useState, type ComponentType } from 'react'
import type { AuroraProps } from '@youj/motion/components/youj/backgrounds/aurora'
import { afterFirstPaint, saveData } from './stealth-idle'

/* The stealth intro's Aurora, toned to the tree: a low, warm curtain (rust,
 * muted amber, a cool slate to keep it from going orange) well under the
 * canopy, at a fraction of its brightness. Its WebGL loads after first paint
 * and not at all for readers who asked to save data. */
const COLORS: AuroraProps['colors'] = ['oklch(0.42 0.07 38)', 'oklch(0.56 0.08 68)', 'oklch(0.46 0.03 250)']

export function StealthAurora({ intensity }: { intensity: number }) {
  const [Aurora, setAurora] = useState<ComponentType<AuroraProps> | null>(null)
  useEffect(() => {
    if (saveData()) return
    return afterFirstPaint(() => import('@youj/motion/components/youj/backgrounds/aurora').then((m) => setAurora(() => m.Aurora)))
  }, [])
  return (
    <div className="absolute inset-0 opacity-0 transition-opacity duration-[1500ms] ease-out data-[on]:opacity-90" data-on={Aurora ? '' : undefined}>
      {Aurora && <Aurora colors={COLORS} intensity={intensity} speed={0.45} horizon={0.06} interactive={false} className="bg-transparent" />}
    </div>
  )
}
