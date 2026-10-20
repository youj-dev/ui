'use client'

import { useState } from 'react'
import {
  AvatarStack,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type AvatarStackUser,
  type Presence,
} from '@youj/react'

/** A generated portrait, so the demo works offline. */
function portrait(hueA: number, hueB: number) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${hueA} 70% 62%)'/><stop offset='1' stop-color='hsl(${hueB} 70% 42%)'/></linearGradient></defs><rect width='64' height='64' fill='url(#g)'/><circle cx='32' cy='26' r='11' fill='white' fill-opacity='.85'/><path d='M12 60c3-12 12-18 20-18s17 6 20 18z' fill='white' fill-opacity='.85'/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const TEAM: AvatarStackUser[] = [
  { id: 'mira', name: 'Mira Chen', src: portrait(230, 262), presence: 'online', description: 'Design lead · Editing' },
  { id: 'jonas', name: 'Jonas Weber', src: portrait(160, 200), presence: 'online', description: 'Frontend' },
  { id: 'priya', name: 'Priya Natarajan', src: portrait(20, 350), presence: 'away', description: 'Platform' },
  { id: 'sam', name: 'Sam Okafor', presence: 'busy', description: 'In a meeting until 15:00' },
  { id: 'ines', name: 'Inès Laurent', src: portrait(290, 320), presence: 'offline', description: 'Research' },
  { id: 'kenji', name: 'Kenji Mori', src: portrait(190, 240), presence: 'online', description: 'Infrastructure' },
  { id: 'ada', name: 'Ada Brooks', presence: 'offline', description: 'Support' },
]

const CYCLE: Presence[] = ['online', 'away', 'busy', 'offline']

export default function AvatarStackDemo() {
  const [users, setUsers] = useState(TEAM)
  const [turn, setTurn] = useState(0)

  // Moves one of the first four people to their next status; their dot pops in again.
  const changeStatus = () => {
    setUsers((list) =>
      list.map((user, i) => (i === turn % 4 ? { ...user, presence: CYCLE[(CYCLE.indexOf(user.presence ?? 'online') + 1) % 4] } : user)),
    )
    setTurn((t) => t + 1)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Q3 roadmap</CardTitle>
        <CardDescription>Last edited 2 minutes ago by Mira Chen.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        {/* On a card, the rings that cut the overlaps out take the card's colour. */}
        <AvatarStack users={users} label="Collaborators" className="*:data-[slot=avatar]:ring-surface **:data-[slot=avatar-group-count]:ring-surface" />
        <Button variant="outline" size="sm" onClick={changeStatus}>
          Change a status
        </Button>
      </CardContent>
    </Card>
  )
}
