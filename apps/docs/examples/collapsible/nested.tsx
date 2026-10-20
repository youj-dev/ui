'use client'

import { useState } from 'react'
import { Collapsible, CollapsibleChevron, CollapsibleContent, CollapsibleTrigger } from '@youj/react'
import { FileTextIcon, FolderIcon, GitBranchIcon } from '@youj/icons'

type Entry = { name: string; open?: boolean; children?: Entry[] }

const SOURCE: Entry[] = [
  {
    name: 'app',
    open: true,
    children: [
      {
        name: '(marketing)',
        open: true,
        children: [{ name: 'pricing', children: [{ name: 'page.tsx' }, { name: 'pricing-grid.tsx' }] }, { name: 'page.tsx' }],
      },
      { name: 'dashboard', children: [{ name: 'layout.tsx' }, { name: 'page.tsx' }] },
      { name: 'layout.tsx' },
    ],
  },
  { name: 'components', children: [{ name: 'checkout-button.tsx' }, { name: 'plan-toggle.tsx' }] },
  { name: 'lib', children: [{ name: 'stripe.server.ts' }] },
  { name: 'package.json' },
]

const row = 'flex h-7 w-full items-center gap-2 rounded-md px-2 font-mono text-ui-sm text-fg'

function Folder({ entry }: { entry: Entry }) {
  const [open, setOpen] = useState(entry.open ?? false)
  return (
    // Each folder is its own Collapsible: opening one never closes another.
    <Collapsible open={open} onOpenChange={setOpen} render={<li />}>
      {/* An inset ring: the panels around nested folders clip their content. */}
      <CollapsibleTrigger
        className={`${row} transition-colors yj-duration-fast ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus focus-visible:outline-solid`}
      >
        <FolderIcon size={16} active={open} className="text-fg-muted" />
        {entry.name}
        <CollapsibleChevron size={14} className="ms-auto text-fg-muted" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Entries entries={entry.children ?? []} className="ms-[15px] border-s border-line ps-1 pt-0.5" />
      </CollapsibleContent>
    </Collapsible>
  )
}

function Entries({ entries, className }: { entries: Entry[]; className: string }) {
  return (
    <ul className={`flex flex-col gap-0.5 ${className}`}>
      {entries.map((entry) =>
        entry.children ? (
          <Folder key={entry.name} entry={entry} />
        ) : (
          <li key={entry.name} className={row}>
            <FileTextIcon size={16} className="text-fg-muted" />
            {entry.name}
          </li>
        ),
      )}
    </ul>
  )
}

export default function CollapsibleNested() {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-xl border border-line bg-surface">
      <p className="flex items-center gap-2 border-b border-line px-3 py-2.5 text-ui font-medium text-fg">
        <GitBranchIcon size={16} className="text-fg-muted" />
        acme/web
        <span className="ms-auto font-mono text-ui-sm font-normal text-fg-muted">main</span>
      </p>
      <Entries entries={SOURCE} className="p-1.5" />
    </div>
  )
}
