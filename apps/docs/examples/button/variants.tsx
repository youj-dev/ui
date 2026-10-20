'use client'

import type { ReactNode } from 'react'
import { Button } from '@youj/react'
import { ArrowUpRightIcon, DownloadIcon, PlusIcon, TrashIcon, UserPlusIcon } from '@youj/icons'

export default function ButtonVariants() {
  return (
    <div className="@container w-full max-w-xl">
      <div className="grid grid-cols-2 gap-x-6 gap-y-6 @md:grid-cols-3">
        <Variant name="default" note="The one primary action">
          <Button>
            <PlusIcon />
            New project
          </Button>
        </Variant>
        <Variant name="secondary" note="A second action beside it">
          <Button variant="secondary">
            <UserPlusIcon />
            Invite
          </Button>
        </Variant>
        <Variant name="outline" note="Neutral actions in toolbars">
          <Button variant="outline">
            <DownloadIcon />
            Export
          </Button>
        </Variant>
        <Variant name="ghost" note="Quiet actions and dismissals">
          <Button variant="ghost">Cancel</Button>
        </Variant>
        <Variant name="danger" note="Deletes or revokes something">
          <Button variant="danger">
            <TrashIcon />
            Delete
          </Button>
        </Variant>
        <Variant name="link" note="An action that reads as text">
          <Button variant="link">
            View logs
            <ArrowUpRightIcon />
          </Button>
        </Variant>
      </div>
    </div>
  )
}

function Variant({ name, note, children }: { name: string; note: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2.5">
      {children}
      <div>
        <p className="font-mono text-ui-xs text-fg">{name}</p>
        <p className="text-ui-xs text-fg-muted">{note}</p>
      </div>
    </div>
  )
}
