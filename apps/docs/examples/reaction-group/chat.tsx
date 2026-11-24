'use client'

import { ReactionGroup, type ReactionGroupItem } from '@youj/react'

const MESSAGES: { who: string; text: string; reactions: ReactionGroupItem[] }[] = [
  { who: 'Theo', text: 'Deploy is green. Rolling to the rest of the fleet now.', reactions: [{ emoji: '🚀', count: 3, by: ['Mara', 'Priya', 'Jonas'] }] },
  {
    who: 'Priya',
    text: 'Nice. I’ll watch the error rate for the next hour.',
    reactions: [
      { emoji: '👍', count: 1, reacted: true },
      { emoji: '❤️', count: 1, by: ['Theo'] },
    ],
  },
]

export default function ReactionGroupChat() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      {MESSAGES.map((message) => (
        <div key={message.who} className="flex flex-col items-start gap-1">
          <div className="max-w-[85%] rounded-xl bg-band px-3 py-2 text-ui text-fg">
            <span className="block text-ui-sm font-medium text-fg-muted">{message.who}</span>
            {message.text}
          </div>
          <ReactionGroup size="sm" defaultValue={message.reactions} />
        </div>
      ))}
    </div>
  )
}
