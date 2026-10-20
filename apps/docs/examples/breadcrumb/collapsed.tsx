'use client'

import { Fragment, type MouseEvent } from 'react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@youj/react'

const PATH = ['Acme', 'Engineering', 'Platform', 'Services', 'Billing API', 'Environments', 'Production']

const stay = (event: MouseEvent) => event.preventDefault()

export default function BreadcrumbCollapsed() {
  return (
    <div className="w-full max-w-2xl rounded-xl border border-line bg-surface px-5 py-4">
      {/* Seven levels, four shown: the root, then the page and its parent. Press the ellipsis to unfold the rest. */}
      <Breadcrumb aria-label="Service breadcrumb">
        <BreadcrumbList maxItems={4}>
          {PATH.map((name, i) =>
            i === PATH.length - 1 ? (
              <BreadcrumbItem key={name}>
                <BreadcrumbPage>{name}</BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              // Each crumb and the separator after it fold as one unit.
              <Fragment key={name}>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/${PATH.slice(0, i + 1).join('/').toLowerCase()}`} onClick={stay}>
                    {name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </Fragment>
            ),
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
