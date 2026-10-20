'use client'

import { ArrowUpRightIcon, BadgeCheckIcon } from '@youj/icons'
import { Badge } from '@youj/react'

export default function BadgeLinks() {
  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <p className="text-ui font-medium text-fg">youj-web</p>
        <Badge variant="success">
          <BadgeCheckIcon />
          Verified
        </Badge>
        <Badge variant="secondary" className="ms-auto tabular-nums">
          12 open
        </Badge>
      </div>
      <p className="mt-1.5 text-ui-sm text-fg-muted">Next.js · Updated 4 minutes ago</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {/* `render` swaps the span for a link, which picks up hover and focus. */}
        <Badge variant="outline" render={<a href="#changelog" />}>
          Changelog
          <ArrowUpRightIcon />
        </Badge>
        <Badge variant="outline" render={<a href="#releases" />}>
          v2.4.0
        </Badge>
        <Badge variant="warning">Expires in 3 days</Badge>
      </div>
    </div>
  )
}
