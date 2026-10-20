'use client'

import { useEffect, useRef } from 'react'
import { MiniaturePackagingLine, type MiniaturePackagingLineHandle } from '@youj/miniatures/packaging-line'

interface PackagingLineProps {
  /** How far along the request is, 0 to 1; undefined runs the line on its own (nothing tracked yet). */
  progress?: number
  /** Every step is done: the pallet is wrapped and the light turns green. */
  done: boolean
  /** A step failed: the line stops. */
  stopped: boolean
}

/** The tracking page's packaging line: the pallet fills as the request moves through its steps. */
export function PackagingLine({ progress, done, stopped }: PackagingLineProps) {
  const ref = useRef<MiniaturePackagingLineHandle>(null)
  useEffect(() => {
    if (!stopped) return
    const line = ref.current
    line?.press(' ')
    return () => line?.press(' ')
  }, [stopped])
  return <MiniaturePackagingLine ref={ref} interactive={false} size="100%" progress={progress} done={done} />
}
