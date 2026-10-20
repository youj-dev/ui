'use client'

import type { MouseEvent } from 'react'
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@youj/react'
import { GitBranchIcon } from '@youj/icons'

// In an app these are router links. Here they stay on the page.
const stay = (event: MouseEvent) => event.preventDefault()

export default function BreadcrumbDemo() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-line bg-surface p-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/acme" onClick={stay}>
              <span aria-hidden className="grid size-4 place-items-center rounded-[4px] bg-fg text-[9px] font-bold text-canvas">
                A
              </span>
              Acme
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/acme/web" onClick={stay}>
              web
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/acme/web/deployments" onClick={stay}>
              Deployments
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-mono text-ui-sm">dpl_8f2a91c</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xl font-semibold tracking-tight text-fg">Tighten the pricing grid on mobile</p>
        <Badge variant="success">Ready</Badge>
      </div>
      <p className="flex items-center gap-1.5 text-ui text-fg-muted">
        <GitBranchIcon size={14} />
        main · 4 minutes ago by Ada Lovelace
      </p>
    </div>
  )
}
