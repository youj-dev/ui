'use client'

import { ReactionGroup, type ReactionGroupItem } from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const REACTIONS: ReactionGroupItem[] = [
  { emoji: '👍', count: 4, reacted: true, by: ['Mara Okafor', 'Theo Lindqvist', 'Priya Raman'] },
  { emoji: '🎉', count: 2, by: ['Mara Okafor', 'Jonas Weber'] },
  { emoji: '👀', count: 1, by: ['Theo Lindqvist'] },
]

export default function ReactionGroupDemo() {
  return (
    <article className="flex w-full max-w-md flex-col gap-2 rounded-xl border border-line bg-surface p-4">
      <header className="flex items-baseline gap-2">
        <span className="text-ui font-medium text-fg">Mara Okafor</span>
        <span className="text-ui-sm text-fg-subtle">2 hours ago</span>
      </header>
      <p className="text-ui text-fg">
        The annual column in the pricing table still shows last year’s discount. Can someone check it against the rate card before this goes to legal?
      </p>
      <ReactionGroup defaultValue={REACTIONS} onReact={() => wait(500)} />
    </article>
  )
}
