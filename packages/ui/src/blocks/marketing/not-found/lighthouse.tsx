'use client'

import { useEffect, useRef } from 'react'
import { MiniatureLighthouse, type MiniatureLighthouseHandle } from '@youj/miniatures/lighthouse'

/** The 404's lighthouse: lamp lit in rolling fog, its beam sweeping for the page that drifted off. */
export function Lighthouse() {
  const ref = useRef<MiniatureLighthouseHandle>(null)
  useEffect(() => {
    ref.current?.press('l')
    ref.current?.press('f')
  }, [])
  return <MiniatureLighthouse ref={ref} interactive={false} size="100%" />
}
