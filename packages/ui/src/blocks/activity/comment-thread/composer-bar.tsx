'use client'

import { useSyncExternalStore, type ComponentType } from 'react'
import { AtSignIcon, BoldIcon, CodeIcon, ItalicIcon, type IconProps } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { InputGroupAddon, InputGroupButton } from '../../../components/ui/input-group'
import { Kbd, KbdGroup } from '../../../components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import type { CommentThreadCopy } from './data'

/* The row under the comment field: bold, italic, code and @, the shortcut to
 * send, and the buttons. A press here never takes focus (or the selection)
 * from the field. */

const noSubscribe = () => () => {}
const isApple = () => /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
/** Whether the keyboard's command key is ⌘ (true on the server, so the first render agrees). */
export const useApple = () => useSyncExternalStore(noSubscribe, isApple, () => true)

export const FORMATS: { key: 'bold' | 'italic' | 'code'; marker: string; letter: string; icon: ComponentType<IconProps> }[] = [
  { key: 'bold', marker: '**', letter: 'B', icon: BoldIcon },
  { key: 'italic', marker: '_', letter: 'I', icon: ItalicIcon },
  { key: 'code', marker: '`', letter: 'E', icon: CodeIcon },
]

export function ComposerBar({
  copy,
  apple,
  hintId,
  submitLabel,
  canSend,
  onFormat,
  onMention,
  onCancel,
  onSubmit,
}: {
  copy: CommentThreadCopy
  apple: boolean
  /** The field's description: its shortcuts, said once. */
  hintId: string
  submitLabel: string
  canSend: boolean
  onFormat: (marker: string) => void
  onMention: () => void
  onCancel?: () => void
  onSubmit: () => void
}) {
  const keys = apple ? '⌘' : 'Ctrl'
  return (
    <InputGroupAddon align="block-end" className="flex-wrap gap-0.5 pt-0.5">
      <div role="group" aria-label={copy.formatting} className="flex items-center gap-0.5">
        {FORMATS.map(({ key, marker, letter, icon: Icon }) => (
          <Tooltip key={key}>
            <TooltipTrigger
              render={
                <InputGroupButton
                  size="icon-xs"
                  aria-label={copy[key]}
                  aria-keyshortcuts={`${apple ? 'Meta' : 'Control'}+${letter}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onFormat(marker)}
                />
              }
            >
              <Icon size={14} />
            </TooltipTrigger>
            <TooltipContent>
              {copy[key]}
              <KbdGroup className="ms-1.5">
                <Kbd>{keys}</Kbd>
                <Kbd>{letter}</Kbd>
              </KbdGroup>
            </TooltipContent>
          </Tooltip>
        ))}
        <Tooltip>
          <TooltipTrigger
            render={<InputGroupButton size="icon-xs" aria-label={copy.mention} onMouseDown={(e) => e.preventDefault()} onClick={onMention} />}
          >
            <AtSignIcon size={14} />
          </TooltipTrigger>
          <TooltipContent>{copy.mention}</TooltipContent>
        </Tooltip>
      </div>
      <span id={hintId} className="sr-only">
        {apple ? copy.composerHint : copy.composerHintOther}
      </span>
      <span aria-hidden className="ms-auto flex items-center gap-1.5 touch:hidden @max-xs/composer:hidden">
        <KbdGroup>
          <Kbd>{keys}</Kbd>
          <Kbd>↵</Kbd>
        </KbdGroup>
      </span>
      <div className="flex items-center gap-1 touch:ms-auto @max-xs/composer:ms-auto">
        {onCancel && (
          <Button variant="ghost" size="xs" onClick={onCancel}>
            {copy.cancel}
          </Button>
        )}
        <Button size="xs" disabled={!canSend} aria-keyshortcuts={`${apple ? 'Meta' : 'Control'}+Enter`} onClick={onSubmit}>
          {submitLabel}
        </Button>
      </div>
    </InputGroupAddon>
  )
}
