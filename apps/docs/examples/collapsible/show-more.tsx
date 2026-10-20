'use client'

import { useState } from 'react'
import { Button, Collapsible, CollapsibleChevron, CollapsibleContent, CollapsibleTrigger } from '@youj/react'
import { FileTextIcon, FolderIcon } from '@youj/icons'

const FILES = ['page.tsx', 'layout.tsx', 'pricing-grid.tsx', 'checkout-button.tsx', 'use-subscription.ts', 'stripe.server.ts', 'plans.json']

function File({ name }: { name: string }) {
  return (
    <li className="flex items-center gap-2.5 px-3 py-2">
      <FileTextIcon size={16} className="text-fg-muted" />
      <span className="font-mono text-ui-sm text-fg">{name}</span>
    </li>
  )
}

export default function CollapsibleShowMore() {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full max-w-sm overflow-hidden rounded-xl border border-line bg-surface">
      <p className="flex items-center gap-2 border-b border-line px-3 py-2.5 text-ui font-medium text-fg">
        <FolderIcon size={16} className="text-fg-muted" />
        app/(marketing)/pricing
      </p>
      <ul className="divide-y divide-line">
        {FILES.slice(0, 3).map((name) => (
          <File key={name} name={name} />
        ))}
      </ul>
      {/* The rest of the list grows in below the first three. */}
      <CollapsibleContent>
        <ul className="divide-y divide-line border-t border-line">
          {FILES.slice(3).map((name) => (
            <File key={name} name={name} />
          ))}
        </ul>
      </CollapsibleContent>
      <div className="border-t border-line p-1.5">
        <CollapsibleTrigger render={<Button variant="ghost" size="sm" className="w-full" />}>
          {open ? 'Show less' : `Show ${FILES.length - 3} more`}
          <CollapsibleChevron />
        </CollapsibleTrigger>
      </div>
    </Collapsible>
  )
}
