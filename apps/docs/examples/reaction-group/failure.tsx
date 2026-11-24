'use client'

import { ReactionGroup } from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function ReactionGroupFailure() {
  return (
    <ReactionGroup
      defaultValue={[
        { emoji: '👍', count: 2, by: ['Mara Okafor', 'Theo Lindqvist'] },
        { emoji: '🚀', count: 1, reacted: true },
      ]}
      onReact={async () => {
        await wait(700)
        throw new Error('offline')
      }}
    />
  )
}
