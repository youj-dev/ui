'use client'

import { KeyIcon, TimerIcon, UserPlusIcon } from '@youj/icons'
import { ActionList, ActionListItem, Button } from '@youj/react'

export default function ActionListSteps() {
  return (
    <ActionList className="w-full max-w-sm rounded-2xl border border-line bg-surface p-4" title="Finish setting up">
      <ActionListItem
        key="keys"
        emphasis
        tone="accent"
        icon={<KeyIcon />}
        title="Create a production key"
        detail="Test keys stop working at launch."
        meta="Do first"
        action={<Button size="sm">Create</Button>}
      />
      <ActionListItem
        key="alert"
        icon={<TimerIcon />}
        title="Set a spend alert"
        detail="So a runaway job pages someone."
        action={
          <Button variant="ghost" size="sm">
            Set
          </Button>
        }
      />
      <ActionListItem
        key="team"
        icon={<UserPlusIcon />}
        title="Invite your on-call"
        detail="Incidents need an owner first."
        action={
          <Button variant="ghost" size="sm">
            Invite
          </Button>
        }
      />
    </ActionList>
  )
}
