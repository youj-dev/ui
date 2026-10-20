'use client'

import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

/* The developer colour panel's switch. Everything the panel is lives in its
 * own chunk (dev-panel.tsx), fetched only once the panel is on, so a visitor
 * downloads this listener and nothing else. It turns on with Shift+Alt+D or
 * `?dev=1` (`?dev=0` turns it off), and the choice is remembered in this
 * browser. It is mounted only under `next dev` (see app/providers.tsx). */

export const DEV_PANEL_KEY = 'youj:dev-panel'

const DevPanel = lazy(() => import('./dev-panel'))

const read = () => {
  try {
    return localStorage.getItem(DEV_PANEL_KEY) === '1'
  } catch {
    return false
  }
}

const write = (on: boolean) => {
  try {
    if (on) localStorage.setItem(DEV_PANEL_KEY, '1')
    else localStorage.removeItem(DEV_PANEL_KEY)
  } catch {
    // No storage (a private window): the panel stays for this page only.
  }
}

export function DevPanelGate() {
  // A framed demo is a preview of its own; the panel belongs to the page around it.
  const framed = usePathname()?.startsWith('/view/')
  const [on, setOn] = useState(false)
  const set = useCallback((next: boolean) => {
    write(next)
    setOn(next)
  }, [])

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('dev')
    if (param === '1' || param === '0') write(param === '1')
    setOn(read())
    // Alt changes the character on a Mac, so the key is read by its position.
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyD') {
        e.preventDefault()
        set(!read())
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [set])

  if (!on || framed) return null
  return (
    <Suspense fallback={null}>
      <DevPanel onClose={() => set(false)} />
    </Suspense>
  )
}
