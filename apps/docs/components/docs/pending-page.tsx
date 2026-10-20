'use client'

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { setPendingNav, usePendingNav } from '@/components/site/intent-link'

const never = () => () => {}

/**
 * The docs content area. A click answers before the page arrives: the
 * sidebar's key has already moved, and the area is marked busy for assistive
 * technology while the old page stays as it is. The new page swaps in at once
 * and its content arrives (styles/site.css, `.docs-page[data-arrive]`): the
 * title, the lede, the first few blocks and the rail rise a few px into place
 * one after another, in CSS alone. Each path is its own area, so a hash or a
 * query change on the same page never animates, and back and forward arrive
 * like a click. The page a visit lands on (hydrated, not mounted) is already
 * there; the header and sidebar sit outside and stay still.
 */
export function PendingPage({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const pending = usePendingNav()
  // Arriving anywhere (or going back instead) ends the wait.
  useEffect(() => setPendingNav(undefined), [pathname])
  const waiting = pending?.startsWith('/docs') && pending !== pathname

  return (
    <Arrival key={pathname} waiting={waiting}>
      {children}
    </Arrival>
  )
}

function Arrival({ children, waiting }: { children: ReactNode; waiting?: boolean }) {
  // False while hydrating the server's page, true for one mounted in the browser; kept from the first render, so a hydrated page never starts arriving after the fact.
  const mounted = useSyncExternalStore(never, () => true, () => false)
  const [arrive] = useState(mounted)
  return (
    <div aria-busy={waiting || undefined} data-arrive={arrive || undefined} className="docs-page">
      {children}
      {waiting && (
        <p role="status" className="sr-only">
          Loading page
        </p>
      )}
    </div>
  )
}
