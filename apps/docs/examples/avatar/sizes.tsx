'use client'

import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '@youj/react'

function portrait(hueA: number, hueB: number) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x2='1' y2='1'><stop stop-color='hsl(${hueA} 70% 62%)'/><stop offset='1' stop-color='hsl(${hueB} 70% 42%)'/></linearGradient></defs><rect width='64' height='64' fill='url(#g)'/><circle cx='32' cy='26' r='11' fill='white' fill-opacity='.85'/><path d='M12 60c3-12 12-18 20-18s17 6 20 18z' fill='white' fill-opacity='.85'/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const SIZES = ['sm', 'default', 'lg'] as const

export default function AvatarSizes() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-10">
      {SIZES.map((size) => (
        <figure key={size} className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar size={size}>
              <AvatarImage src={portrait(230, 262)} alt="Ana Lima" />
              <AvatarFallback role="img" aria-label="Ana Lima">
                AL
              </AvatarFallback>
            </Avatar>
            {/* No image: the initials show, on the muted disc. */}
            <Avatar size={size}>
              <AvatarFallback role="img" aria-label="Kenji Sato">
                KS
              </AvatarFallback>
            </Avatar>
            <Avatar size={size}>
              <AvatarImage src={portrait(160, 200)} alt="Priya Raman, online" />
              <AvatarFallback role="img" aria-label="Priya Raman, online">
                PR
              </AvatarFallback>
              <AvatarBadge aria-hidden />
            </Avatar>
          </div>
          <figcaption className="font-mono text-xs text-fg-muted">{size}</figcaption>
        </figure>
      ))}
    </div>
  )
}
