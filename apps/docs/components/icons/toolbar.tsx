'use client'

import { ToggleIcon } from '@youj/icons'
import { Toggle } from '@youj/react'

/** Morph all, at hand in the morph pairs' bar over the grid: the preview mode's morph wave. */
export function MorphAllToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <Toggle variant="outline" size="sm" pressed={on} onPressedChange={onChange} aria-label="Morph all" className="shrink-0 gap-1.5 px-2.5 font-normal text-fg">
      <ToggleIcon size={15} strokeWidth={1.75} active={on} />
      Morph all
    </Toggle>
  )
}
