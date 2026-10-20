'use client'

import type { MouseEvent } from 'react'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@youj/react'
import { ChevronRightIcon, HomeIcon } from '@youj/icons'

const stay = (event: MouseEvent) => event.preventDefault()

export default function BreadcrumbSeparatorExample() {
  return (
    <Breadcrumb aria-label="Docs breadcrumb">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/docs" onClick={stay} aria-label="Docs home">
            <HomeIcon size={14} />
          </BreadcrumbLink>
        </BreadcrumbItem>
        {/* Any mark can separate crumbs. It stays hidden from assistive technology. */}
        <BreadcrumbSeparator>
          <ChevronRightIcon trigger="none" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          {/* A static ellipsis: a gap the app chose not to show. */}
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRightIcon trigger="none" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href="/docs/components" onClick={stay}>
            Components
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRightIcon trigger="none" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Marketing site redesign</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
