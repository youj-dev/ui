'use client'

import type { ReactNode } from 'react'
import { Toggle } from '@youj/react'
import { FilterIcon, ItalicIcon, UnderlineIcon } from '@youj/icons'

export default function ToggleVariants() {
  return (
    <div className="@container w-full max-w-xl">
      <div className="grid grid-cols-2 gap-x-6 gap-y-7 @md:grid-cols-3">
        <Specimen label="default · off, on">
          <Toggle aria-label="Italic">
            <ItalicIcon />
          </Toggle>
          <Toggle aria-label="Underline" defaultPressed>
            <UnderlineIcon />
          </Toggle>
        </Specimen>
        <Specimen label="outline · off, on">
          <Toggle variant="outline" aria-label="Italic">
            <ItalicIcon />
          </Toggle>
          <Toggle variant="outline" aria-label="Underline" defaultPressed>
            <UnderlineIcon />
          </Toggle>
        </Specimen>
        <Specimen label="with a label">
          <Toggle variant="outline" defaultPressed>
            <FilterIcon />
            Failed only
          </Toggle>
        </Specimen>
        <Specimen label="sm · default · lg">
          <Toggle size="sm" aria-label="Underline, small" defaultPressed>
            <UnderlineIcon />
          </Toggle>
          <Toggle aria-label="Underline" defaultPressed>
            <UnderlineIcon />
          </Toggle>
          <Toggle size="lg" aria-label="Underline, large" defaultPressed>
            <UnderlineIcon />
          </Toggle>
        </Specimen>
        <Specimen label="disabled">
          <Toggle aria-label="Italic" disabled>
            <ItalicIcon />
          </Toggle>
          <Toggle aria-label="Underline" disabled defaultPressed>
            <UnderlineIcon />
          </Toggle>
        </Specimen>
      </div>
    </div>
  )
}

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2.5">
      <div className="flex items-center gap-1">{children}</div>
      <p className="font-mono text-ui-xs text-fg-muted">{label}</p>
    </div>
  )
}
