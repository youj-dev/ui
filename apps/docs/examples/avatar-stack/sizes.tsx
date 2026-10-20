'use client'

import { AvatarStack, type AvatarStackUser } from '@youj/react'

const PEOPLE: AvatarStackUser[] = [
  { id: 'mira', name: 'Mira Chen', presence: 'online' },
  { id: 'jonas', name: 'Jonas Weber', presence: 'online' },
  { id: 'priya', name: 'Priya Natarajan', presence: 'away' },
  { id: 'sam', name: 'Sam Okafor', presence: 'busy' },
  { id: 'ines', name: 'Inès Laurent' },
  { id: 'kenji', name: 'Kenji Mori' },
  { id: 'ada', name: 'Ada Brooks' },
]

export default function AvatarStackSizes() {
  return (
    <div className="grid grid-cols-[auto_auto] items-center gap-x-8 gap-y-5 text-ui-sm text-fg-muted">
      <span>sm, max 5</span>
      <AvatarStack users={PEOPLE} size="sm" max={5} label="Viewers" />
      <span>default, max 4</span>
      <AvatarStack users={PEOPLE} label="Collaborators" />
      <span>lg, max 3</span>
      <AvatarStack users={PEOPLE} size="lg" max={3} label="Owners" />
      <span>fits, no +N</span>
      <AvatarStack users={PEOPLE.slice(0, 3)} label="Reviewers" />
    </div>
  )
}
