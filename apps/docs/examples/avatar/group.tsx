'use client'

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '@youj/react'

function portrait(hueA: number, hueB: number) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x2='1' y2='1'><stop stop-color='hsl(${hueA} 70% 62%)'/><stop offset='1' stop-color='hsl(${hueB} 70% 42%)'/></linearGradient></defs><rect width='64' height='64' fill='url(#g)'/><circle cx='32' cy='26' r='11' fill='white' fill-opacity='.85'/><path d='M12 60c3-12 12-18 20-18s17 6 20 18z' fill='white' fill-opacity='.85'/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const TEAM = [
  { name: 'Ana Lima', initials: 'AL', src: portrait(230, 262) },
  { name: 'Jonas Weber', initials: 'JW', src: portrait(200, 230) },
  { name: 'Priya Raman', initials: 'PR', src: portrait(160, 200) },
  { name: 'Sara Okafor', initials: 'SO', src: portrait(20, 350) },
]

export default function AvatarGroupExample() {
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-ui font-medium text-fg">Design system</p>
        <p className="text-ui-sm text-fg-muted">Shared with 9 people</p>
      </div>
      {/* Overlapping discs, each cut from the page by a ring. The count takes the avatars' size. */}
      <AvatarGroup>
        {TEAM.map((person) => (
          <Avatar key={person.name}>
            <AvatarImage src={person.src} alt={person.name} />
            <AvatarFallback role="img" aria-label={person.name}>
              {person.initials}
            </AvatarFallback>
          </Avatar>
        ))}
        <AvatarGroupCount>
          <span aria-hidden>+5</span>
          <span className="sr-only">and 5 more</span>
        </AvatarGroupCount>
      </AvatarGroup>
    </div>
  )
}
