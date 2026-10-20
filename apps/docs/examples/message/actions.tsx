'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, ChatMessage, ChatMessageAction, toast } from '@youj/react'
import { BookmarkIcon, ShareIcon } from '@youj/icons'

export default function MessageActions() {
  const [saved, setSaved] = useState(false)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <ChatMessage role="system" content="Ada shared this chat with the Platform team" />
      <ChatMessage
        role="assistant"
        name="Release bot"
        avatar={
          <Avatar className="size-7">
            <AvatarFallback className="bg-accent text-on-accent">RB</AvatarFallback>
          </Avatar>
        }
        content="**v2.4.0** is live in all regions. 214 checks passed and the build took 38s."
        actions={
          <>
            <ChatMessageAction label={saved ? 'Saved' : 'Save'} pressed={saved} onPressedChange={setSaved}>
              <BookmarkIcon size={16} strokeWidth={1.75} active={saved} />
            </ChatMessageAction>
            <ChatMessageAction label="Share" onClick={() => toast('Link copied')}>
              <ShareIcon size={16} strokeWidth={1.75} />
            </ChatMessageAction>
          </>
        }
      />
    </div>
  )
}
