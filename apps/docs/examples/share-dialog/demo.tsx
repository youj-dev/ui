'use client'

import { useState } from 'react'
import { ShareIcon } from '@youj/icons'
import { Button, ShareDialog, type SharePerson } from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const suggestions = [
  { id: 'katherine', name: 'Katherine Johnson', email: 'katherine@acme.com' },
  { id: 'margaret', name: 'Margaret Hamilton', email: 'margaret@acme.com' },
  { id: 'dorothy', name: 'Dorothy Vaughan', email: 'dorothy@acme.com' },
  { id: 'design', name: 'Design team', members: 12 },
  { id: 'eng', name: 'Engineering', members: 48 },
]

export default function ShareDialogDemo() {
  const [people, setPeople] = useState<SharePerson[]>([
    { id: 'ada', name: 'Ada Lovelace', email: 'ada@acme.com', role: 'editor', owner: true },
    { id: 'grace', name: 'Grace Hopper', email: 'grace@acme.com', role: 'editor' },
    { id: 'alan', name: 'Alan Turing', email: 'alan@acme.com', role: 'commenter' },
    { id: 'mary', name: 'Mary Jackson', email: 'mary@partner.io', role: 'viewer', pending: true },
  ])

  return (
    <ShareDialog
      trigger={
        <Button variant="outline">
          <ShareIcon />
          Share
        </Button>
      }
      resource="Q3 roadmap"
      link="https://acme.test/docs/q3-roadmap"
      organization="Acme"
      people={people}
      suggestions={suggestions}
      onInvite={async ({ recipients, role }) => {
        await wait(900)
        setPeople((current) => [
          ...current,
          ...recipients.map((r, i) => ({ id: `${r.id ?? r.email}-${current.length + i}`, name: r.name, email: r.email, role, pending: true })),
        ])
      }}
      onRoleChange={async (person, role) => {
        await wait(500)
        setPeople((current) => current.map((p) => (p.id === person.id ? { ...p, role } : p)))
      }}
      onRemove={async (person) => {
        await wait(500)
        setPeople((current) => current.filter((p) => p.id !== person.id))
      }}
      onResend={() => wait(700)}
    />
  )
}
