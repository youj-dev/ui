'use client'

import { useEffect, useRef } from 'react'
import { MiniatureDroneDock, type MiniatureDroneDockHandle } from '@youj/miniatures/drone-dock'

/** The launch page's drone: charging on its pad while the countdown runs, taking off when it reaches zero. */
export function DroneDock({ live }: { live: boolean }) {
  const ref = useRef<MiniatureDroneDockHandle>(null)
  useEffect(() => {
    if (live) ref.current?.press('t')
  }, [live])
  return <MiniatureDroneDock ref={ref} interactive={false} size="100%" />
}
