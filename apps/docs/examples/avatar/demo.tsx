'use client'

import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '@youj/react'

/* Portraits drawn in place as SVG data URIs, so the example needs no network. */
function portrait(hueA: number, hueB: number) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x2='1' y2='1'><stop stop-color='hsl(${hueA} 70% 62%)'/><stop offset='1' stop-color='hsl(${hueB} 70% 42%)'/></linearGradient></defs><rect width='64' height='64' fill='url(#g)'/><circle cx='32' cy='26' r='11' fill='white' fill-opacity='.85'/><path d='M12 60c3-12 12-18 20-18s17 6 20 18z' fill='white' fill-opacity='.85'/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const REVIEWERS = [
  { name: 'Priya Raman', initials: 'PR', src: portrait(160, 200) },
  { name: 'Jonas Weber', initials: 'JW', src: portrait(200, 230) },
  { name: 'Sara Okafor', initials: 'SO', src: portrait(20, 350) },
]

export default function AvatarDemo() {
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {/* The name is written out beside it, so this avatar and its status dot are decorative. */}
        <Avatar size="lg" aria-hidden>
          <AvatarImage src={portrait(230, 262)} alt="" />
          <AvatarFallback>AL</AvatarFallback>
          <AvatarBadge />
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-ui font-medium text-fg">Ana Lima</p>
          <p className="truncate text-ui-sm text-fg-muted">Online · Owner</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-ui-sm text-fg-muted max-sm:sr-only">Reviewers</span>
        <AvatarGroup>
          {REVIEWERS.map((person) => (
            <Avatar key={person.name} size="sm">
              {person.src && <AvatarImage src={person.src} alt={person.name} />}
              {/* Until an image loads, and when there is none, the initials stand in and carry the name. */}
              <AvatarFallback role="img" aria-label={person.name}>
                {person.initials}
              </AvatarFallback>
            </Avatar>
          ))}
          <AvatarGroupCount>
            <span aria-hidden>+4</span>
            <span className="sr-only">and 4 more</span>
          </AvatarGroupCount>
        </AvatarGroup>
      </div>
    </div>
  )
}
