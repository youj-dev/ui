'use client'

import { useEffect, useRef } from 'react'
import { MiniatureServerCabinet, type MiniatureServerCabinetHandle } from '@youj/miniatures/server-cabinet'

/** The 503's server cabinet: under load with two nodes failed while the service is down; they recover once a retry gets through. */
export function ServerCabinet({ down }: { down: boolean }) {
  const ref = useRef<MiniatureServerCabinetHandle>(null)
  useEffect(() => {
    const cabinet = ref.current
    if (!cabinet) return
    if (down) for (const key of ['l', 'f', 'f'] as const) cabinet.press(key)
    else cabinet.press('r')
  }, [down])
  return <MiniatureServerCabinet ref={ref} interactive={false} size="100%" />
}
