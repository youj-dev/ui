'use client'

import { useState } from 'react'
import { Illustration } from '@youj/illustrations'
import { SegmentedControl, SegmentedControlItem } from '@youj/react'

/* One scene three ways: gray (the default), the theme's hues, and hues of your
 * own. The accent stays the hero in all three. */

const LOOKS = {
  mono: {},
  theme: { colors: 'theme' },
  own: { colors: ['var(--color-success)', 'var(--color-warning)'] },
} as const

type Look = keyof typeof LOOKS

export default function IllustrationsColour() {
  const [look, setLook] = useState<Look>('mono')
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 sm:p-6">
      <SegmentedControl aria-label="Colour" value={look} onValueChange={(value) => setLook(value as Look)} className="w-full">
        <SegmentedControlItem value="mono" className="flex-1">
          Mono
        </SegmentedControlItem>
        <SegmentedControlItem value="theme" className="flex-1">
          Theme
        </SegmentedControlItem>
        <SegmentedControlItem value="own" className="flex-1">
          Your colors
        </SegmentedControlItem>
      </SegmentedControl>
      <div className="rounded-xl border border-line bg-surface py-6">
        <Illustration scene="pipeline" assemble={false} unit={18} {...LOOKS[look]} />
      </div>
    </div>
  )
}
