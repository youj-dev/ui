'use client'

import { ShareIcon } from '@youj/icons'
import { Button, ShareDialog, type SharePerson } from '@youj/react'

const people: SharePerson[] = [
  { id: 'ada', name: 'Ada Lovelace', email: 'ada@acme.com', role: 'editor', owner: true },
  { id: 'grace', name: 'Grace Hopper', email: 'grace@acme.com', role: 'editor' },
  { id: 'alan', name: 'Alan Turing', email: 'alan@acme.com', role: 'commenter' },
  { id: 'you', name: 'You', email: 'you@acme.com', role: 'viewer' },
]

export default function ShareDialogReadOnly() {
  return (
    <ShareDialog
      readOnly
      trigger={
        <Button variant="outline">
          <ShareIcon />
          Share
        </Button>
      }
      resource="Board minutes"
      link="https://acme.test/docs/board-minutes"
      organization="Acme"
      people={people}
      defaultAccess={{ scope: 'organization', role: 'viewer' }}
    />
  )
}
