'use client'

import { chatCopyButtonLabels } from '@youj/core/labels'
import type { ReactElement } from 'react'
import { AsyncAnnouncer } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { CopyIcon } from '@youj/icons/components/youj/icons/copy'
import { Button } from '../button'
import { useCopyText } from '../code-block/code-block'
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip'
import { useChatList } from './chat-context'

export interface ChatCopyButtonProps {
  /** The text, or a function that reads it at the moment of the click. */
  text: string | (() => string)
  /** The button's name and tooltip. Default "Copy". */
  label?: string
  /** Rendered element for the trigger, e.g. a Toolbar.Button. Default: a ghost icon Button. */
  render?: ReactElement
  className?: string
  /** With sound on (`YoujProvider`’s `sound`), the button plays `tap` and a copy `success`. `false` keeps it silent. Default true. */
  sound?: boolean
}

/**
 * An icon button that copies text. youj's CopyIcon answers: the back sheet
 * tucks in behind the front one and a check is written on the page, then it
 * all eases back after a beat. The tooltip reads "Copied" meanwhile and the
 * result is announced (politely, or assertively when the clipboard refuses):
 * inside a ChatMessageList through the list's own live regions, so a long
 * conversation doesn't carry two regions per message.
 */
export function ChatCopyButton({ text, label, render, className, sound = true }: ChatCopyButtonProps) {
  const labels = useComponentLabels(chatCopyButtonLabels)
  label ??= labels.copy
  const list = useChatList()
  const { state, copy } = useCopyText(
    list ? (result) => list.announce(result === 'copied' ? labels.copied : labels.copyFailed, result === 'copied' ? 'polite' : 'assertive') : undefined,
    sound,
  )
  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={render ?? <Button variant="ghost" size="icon-xs" sound={sound} />}
          // The tooltip stays through the click, to say "Copied".
          closeOnClick={false}
          aria-label={label}
          className={className}
          onClick={() => copy(typeof text === 'function' ? text() : text)}
        >
          <CopyIcon active={state === 'copied'} size={14} strokeWidth={1.75} />
        </TooltipTrigger>
        <TooltipContent>{state === 'copied' ? labels.copied : state === 'error' ? labels.copyFailed : label}</TooltipContent>
      </Tooltip>
      {!list && (
        <AsyncAnnouncer state={state === 'copied' ? 'success' : state === 'error' ? 'error' : 'idle'} successLabel={labels.copied} errorLabel={labels.copyFailed} />
      )}
    </>
  )
}
