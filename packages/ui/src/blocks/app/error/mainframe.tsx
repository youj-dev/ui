'use client'

import { useEffect, useRef } from 'react'
import { MiniatureMainframe, type MiniatureMainframeHandle } from '@youj/miniatures/mainframe'

/** Where the 500's retry stands: down, being retried, or back. */
export type MainframeState = 'down' | 'retrying' | 'up'

/** The 500's mainframe: stopped in machine check while the page is down; a retry resets it and feeds its cards, and it runs once the retry works. */
export function Mainframe({ state }: { state: MainframeState }) {
  const ref = useRef<MiniatureMainframeHandle>(null)
  useEffect(() => {
    const mainframe = ref.current
    if (!mainframe) return
    if (state === 'down') mainframe.press('f')
    else if (state === 'retrying') {
      mainframe.press('r')
      mainframe.press('l')
    } else mainframe.press(' ')
  }, [state])
  return <MiniatureMainframe ref={ref} interactive={false} size="100%" />
}
