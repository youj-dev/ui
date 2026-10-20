'use client'

import { useEffect, useLayoutEffect, useRef, useState, type DragEvent as ReactDragEvent, type RefObject } from 'react'
import { dragSummary } from './intake'

/* Files on their way. `ready` while a drag carrying files is anywhere over
 * the window, so the zone can wake before the pointer reaches it; `over`
 * while it's over the zone, with how many files and how many the rules turn
 * away (when the browser reveals their types). Enter and leave fire for every
 * child crossed, so both keep a depth count. A drop that misses the zone is
 * swallowed: by default the browser would open the file in the tab and the
 * page would be gone. */

export interface DragOver {
  count: number
  refused: number
}

const carriesFiles = (event: DragEvent | ReactDragEvent) => Array.from(event.dataTransfer?.types ?? []).includes('Files')

export function useDrag(zone: RefObject<HTMLElement | null>, rules: string[], disabled: boolean, onDrop: (data: DataTransfer) => void) {
  const [ready, setReady] = useState(false)
  const [over, setOver] = useState<DragOver | null>(null)
  const depth = useRef(0)
  const drop = useRef(onDrop)
  useLayoutEffect(() => {
    drop.current = onDrop
  })

  useEffect(() => {
    if (disabled) return
    let pageDepth = 0
    const enter = (event: DragEvent) => {
      if (!carriesFiles(event)) return
      pageDepth++
      setReady(true)
    }
    const leave = (event: DragEvent) => {
      if (!carriesFiles(event)) return
      pageDepth = Math.max(0, pageDepth - 1)
      if (pageDepth === 0) setReady(false)
    }
    const hover = (event: DragEvent) => {
      if (!carriesFiles(event)) return
      event.preventDefault()
      if (event.dataTransfer && !zone.current?.contains(event.target as Node)) event.dataTransfer.dropEffect = 'none'
    }
    const end = (event: DragEvent) => {
      pageDepth = 0
      setReady(false)
      if (event.type === 'drop' && carriesFiles(event)) event.preventDefault()
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragleave', leave)
    window.addEventListener('dragover', hover)
    window.addEventListener('drop', end)
    window.addEventListener('dragend', end)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('dragover', hover)
      window.removeEventListener('drop', end)
      window.removeEventListener('dragend', end)
    }
  }, [disabled, zone])

  const props = {
    onDragEnter: (event: ReactDragEvent) => {
      if (disabled || !carriesFiles(event)) return
      event.preventDefault()
      depth.current++
      setOver(dragSummary(event.dataTransfer, rules))
    },
    onDragOver: (event: ReactDragEvent) => {
      if (disabled || !carriesFiles(event)) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    },
    onDragLeave: (event: ReactDragEvent) => {
      if (disabled || !carriesFiles(event)) return
      depth.current = Math.max(0, depth.current - 1)
      if (depth.current === 0) setOver(null)
    },
    onDrop: (event: ReactDragEvent) => {
      depth.current = 0
      setOver(null)
      setReady(false)
      if (disabled || !carriesFiles(event)) return
      event.preventDefault()
      drop.current(event.dataTransfer)
    },
  }

  return { ready: ready && !disabled, over: disabled ? null : over, props }
}
