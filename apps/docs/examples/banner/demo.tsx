'use client'

import { useState } from 'react'
import { Badge, Banner, BannerAction, BannerTitle, Button } from '@youj/react'

export default function BannerDemo() {
  const [open, setOpen] = useState(true)

  return (
    <div className="w-full overflow-hidden rounded-xl border border-line bg-canvas">
      <Banner variant="inverse" open={open} onOpenChange={setOpen}>
        <Badge variant="outline" className="hidden border-current/30 text-current sm:inline-flex">
          New
        </Badge>
        <BannerTitle>
          <strong>Deploy previews</strong> <span>now comment on every pull request.</span>
        </BannerTitle>
        <BannerAction href="#changelog">Read the changelog</BannerAction>
      </Banner>
      {/* The page under the banner glides up when it's dismissed. */}
      <div className="flex h-12 items-center justify-between border-b border-line px-4">
        <span className="text-ui font-semibold text-fg">Northwind</span>
        <Button size="sm">Sign in</Button>
      </div>
      <div className="p-4">
        <Button variant="outline" size="sm" disabled={open} onClick={() => setOpen(true)}>
          Show the banner again
        </Button>
      </div>
    </div>
  )
}
