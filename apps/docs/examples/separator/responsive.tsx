'use client'

import { Separator } from '@youj/react'

export default function SeparatorResponsive() {
  return (
    <div className="@container w-full max-w-xl">
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 @md:flex-row @md:gap-5">
        <Detail label="Source" value="New pricing page" note="main · 4f2a91c · Ana Lima" />
        {/* One line per layout. The hidden one leaves the accessibility tree, so what's announced matches what's drawn. */}
        <Separator className="@md:hidden" />
        <Separator orientation="vertical" className="hidden @md:block" />
        <Detail label="Domains" value="youj.io" note="www.youj.io redirects here" />
      </div>
    </div>
  )
}

function Detail({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-ui-sm text-fg-muted">{label}</p>
      <p className="mt-1 truncate text-ui font-medium text-fg">{value}</p>
      <p className="truncate text-ui-sm text-fg-muted">{note}</p>
    </div>
  )
}
