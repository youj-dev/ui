'use client'

import type { ReactNode } from 'react'
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyLarge,
  TypographyLead,
  TypographyMuted,
  TypographyP,
  TypographySmall,
} from '@youj/react'

const SCALE: [string, ReactNode][] = [
  ['H1', <TypographyH1 key="h1">Taxing Laughter</TypographyH1>],
  ['H2', <TypographyH2 key="h2">The People of the Kingdom</TypographyH2>],
  ['H3', <TypographyH3 key="h3">The Joke Tax</TypographyH3>],
  ['H4', <TypographyH4 key="h4">People stopped telling jokes</TypographyH4>],
  ['P', <TypographyP key="p">The king, seeing how much happier his subjects were, realized the error of his ways.</TypographyP>],
  ['Lead', <TypographyLead key="lead">A modal dialog that interrupts the user with important content.</TypographyLead>],
  ['Large', <TypographyLarge key="large">Are you absolutely sure?</TypographyLarge>],
  ['Small', <TypographySmall key="small">Email address</TypographySmall>],
  ['Muted', <TypographyMuted key="muted">Enter your email address.</TypographyMuted>],
  ['InlineCode', <TypographyInlineCode key="code">@youj/react</TypographyInlineCode>],
]

export default function TypographyScale() {
  return (
    <div className="grid w-full max-w-xl grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-x-5 gap-y-5">
      {SCALE.map(([name, node]) => (
        <div key={name} className="contents">
          <span className="font-mono text-ui-xs text-fg-muted">{name}</span>
          {/* The set's own top margins are for running text; a specimen sits flush. */}
          <div className="min-w-0 [&>*]:mt-0!">{node}</div>
        </div>
      ))}
    </div>
  )
}
