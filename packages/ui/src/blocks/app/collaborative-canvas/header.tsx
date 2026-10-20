'use client'

import { Fragment, useState, type ElementType } from 'react'
import { CheckIcon, LinkIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../../../components/ui/breadcrumb'
import { Button } from '../../../components/ui/button'
import { PresenceAvatars } from '../../../components/ui/live-cursors'
import { safeLink } from '../../../lib/safe-href'
import type { CollaborativeCanvasCopy, CollaborativeCanvasCrumb, CollaborativeCanvasPerson } from './data'

interface HeaderProps {
  copy: CollaborativeCanvasCopy
  path: CollaborativeCanvasCrumb[]
  people: CollaborativeCanvasPerson[]
  /** Shows the dashed Demo data badge beside the board's name. */
  demo: boolean
  linkComponent: ElementType
  onShare: () => Promise<unknown>
}

/** What the board's page offers: the demo marker, who is here, and Share. */
function BoardActions({ copy, people, demo, onShare }: Omit<HeaderProps, 'path' | 'linkComponent'>) {
  const [shared, setShared] = useState(false)
  const [busy, setBusy] = useState(false)
  const share = async () => {
    setBusy(true)
    try {
      await onShare()
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      {demo && (
        <Badge variant="outline" data-slot="demo-marker" className="hidden border-dashed border-line-strong sm:inline-flex">
          {copy.demoData}
        </Badge>
      )}
      <PresenceAvatars users={people} size="sm" label={copy.people} />
      <Button size="sm" onClick={share} loading={busy} aria-live="polite">
        {shared ? <CheckIcon /> : <LinkIcon />}
        {shared ? copy.shared : copy.share}
      </Button>
    </>
  )
}

/** The bar over the board: where it is, who is here, and Share. One row, one control height. */
function Header({ copy, path, people, demo, linkComponent: Link, onShare }: HeaderProps) {
  return (
    <header data-yj-tone="chrome" className="flex h-14 shrink-0 items-center gap-3 border-line-subtle border-b bg-chrome px-4 text-fg">
      <Breadcrumb aria-label={copy.path} className="min-w-0 flex-1">
        <BreadcrumbList>
          {path.map((crumb, i) => (
            <Fragment key={`${crumb.label}-${i}`}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {i === path.length - 1 ? (
                  <BreadcrumbPage className="font-medium">{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={safeLink(crumb.href) ?? undefined} />}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <BoardActions copy={copy} people={people} demo={demo} onShare={onShare} />
    </header>
  )
}

export { BoardActions, Header }
