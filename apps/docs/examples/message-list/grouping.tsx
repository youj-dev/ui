'use client'

import { ChatMessage, ChatMessageList, ChatTypingIndicator } from '@youj/react'

const at = (minutes: number) => new Date(Date.UTC(2026, 0, 15, 9, minutes))

export default function MessageListGrouping() {
  return (
    <div className="flex h-[420px] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-line bg-canvas">
      <ChatMessageList contentClassName="px-5">
        <ChatMessage key="s" role="system" content="Youj Pro · this chat can read your deployments" timestamp={at(0)} />
        {/* Three in a row from you: one header, bubbles that tuck their corners in. */}
        <ChatMessage key="u1" role="user" name="Ada Lovelace" content="The fra1 deploy failed again." timestamp={at(2)} />
        <ChatMessage key="u2" role="user" name="Ada Lovelace" content="Same error as yesterday." timestamp={at(2)} />
        <ChatMessage key="u3" role="user" name="Ada Lovelace" content="Can you check the build log?" timestamp={at(2)} />
        <ChatMessage
          key="a1"
          role="assistant"
          name="Youj"
          timestamp={at(3)}
          content="It's the same failure: `sharp` can't find its binary for **linux-arm64**. The build image changed on Monday."
        />
        <ChatMessage key="a2" role="assistant" name="Youj" timestamp={at(3)} content="Pinning the image to `node-22-x64` fixes it. Want me to open a pull request?" />
        {/* Anything else can sit in the flow too, keyed like a message. */}
        <ChatTypingIndicator key="typing" variant="dots" />
      </ChatMessageList>
    </div>
  )
}
