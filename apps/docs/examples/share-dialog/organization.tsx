'use client'

import { useState } from 'react'
import { ShareIcon } from '@youj/icons'
import { Button, ShareDialog, type ShareAccess, type SharePerson } from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const people: SharePerson[] = [
  { id: 'ada', name: 'Ada Lovelace', email: 'ada@acme.com', role: 'editor', owner: true },
  { id: 'grace', name: 'Grace Hopper', email: 'grace@acme.com', role: 'commenter' },
]

export default function ShareDialogOrganization() {
  const [access, setAccess] = useState<ShareAccess>({ scope: 'organization', role: 'commenter' })

  return (
    <ShareDialog
      trigger={
        <Button variant="outline">
          <ShareIcon />
          Share
        </Button>
      }
      resource="Hiring plan"
      link="https://acme.test/docs/hiring-plan"
      organization="Acme"
      people={people}
      access={access}
      onAccessChange={async (next) => {
        await wait(600)
        setAccess(next)
      }}
    />
  )
}
