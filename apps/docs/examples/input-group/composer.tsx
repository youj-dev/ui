'use client'

import { useRef, useState } from 'react'
import { AsyncButton, InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupTextarea, Kbd } from '@youj/react'
import { ArrowUpIcon, PaperclipIcon } from '@youj/icons'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function InputGroupComposer() {
  const [comment, setComment] = useState('')
  const send = useRef<HTMLButtonElement>(null)

  return (
    <InputGroup className="w-full max-w-md">
      <InputGroupTextarea
        aria-label="Comment on this preview"
        placeholder="Leave a comment on youj-web-4f2a91c…"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        onKeyDown={(event) => {
          // Enter sends; Shift+Enter keeps its newline.
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            send.current?.click()
          }
        }}
      />
      <InputGroupAddon align="block-end" className="justify-between">
        <InputGroupText className="text-ui-sm">
          <Kbd>⏎</Kbd> to send
        </InputGroupText>
        <div className="flex items-center gap-1">
          <InputGroupButton size="icon-xs" aria-label="Attach a file">
            <PaperclipIcon />
          </InputGroupButton>
          {/* An AsyncButton in the addon: it spins, lands on a check, and announces "Comment posted". */}
          <AsyncButton
            ref={send}
            size="icon-xs"
            variant="default"
            aria-label="Send comment"
            disabled={comment.trim() === ''}
            focusableWhenDisabled
            onAction={async () => {
              await wait(900)
              setComment('')
            }}
            successLabel="Comment posted"
            errorLabel="Couldn’t post the comment"
          >
            <ArrowUpIcon />
          </AsyncButton>
        </div>
      </InputGroupAddon>
    </InputGroup>
  )
}
