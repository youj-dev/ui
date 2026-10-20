'use client'

import { ChoiceCard, ChoiceCardGroup, FieldLegend, FieldSet } from '@youj/react'

export default function ChoiceCardOptions() {
  return (
    <FieldSet className="w-full max-w-xl">
      <FieldLegend variant="label">When the build minutes run out</FieldLegend>
      <ChoiceCardGroup defaultValue="queue" name="overage">
        <ChoiceCard value="queue" title="Queue until the cycle resets" badge="Suggested" note="No extra cost" />
        <ChoiceCard value="burst" title="Buy a burst pack" note="+1,000 min for $12" />
        <ChoiceCard value="stop" title="Stop non-production builds" note="Production keeps running" />
      </ChoiceCardGroup>
    </FieldSet>
  )
}
