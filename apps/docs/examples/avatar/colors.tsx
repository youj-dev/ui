'use client'

import { Avatar, AvatarFallback } from '@youj/react'

const PEOPLE = [
  { email: 'mira@example.com', initials: 'MK' },
  { email: 'jonas@example.com', initials: 'JO' },
  { email: 'sana@example.com', initials: 'SN' },
  { email: 'theo@example.com', initials: 'TB' },
  { email: 'lena@example.com', initials: 'LH' },
]

export default function AvatarColors() {
  return (
    <div className="flex items-center gap-2">
      {PEOPLE.map((person) => (
        <Avatar key={person.email}>
          <AvatarFallback colorSeed={person.email}>{person.initials}</AvatarFallback>
        </Avatar>
      ))}
    </div>
  )
}
