'use client'

import { Fragment } from 'react'
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  StrikethroughIcon,
  type YoujIconComponent,
} from '@youj/icons'
import { Kbd, KbdGroup, Separator, Toggle, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@youj/react'

interface Tool {
  label: string
  Icon: YoujIconComponent
  keys: string[]
  pressed?: boolean
}

const GROUPS: Tool[][] = [
  [
    { label: 'Bold', Icon: BoldIcon, keys: ['⌘', 'B'], pressed: true },
    { label: 'Italic', Icon: ItalicIcon, keys: ['⌘', 'I'] },
    { label: 'Strikethrough', Icon: StrikethroughIcon, keys: ['⌘', '⇧', 'X'] },
    { label: 'Inline code', Icon: CodeIcon, keys: ['⌘', 'E'] },
  ],
  [
    { label: 'Link', Icon: LinkIcon, keys: ['⌘', 'K'] },
    { label: 'Quote', Icon: QuoteIcon, keys: ['⌘', '⇧', '.'] },
  ],
  [
    { label: 'Bulleted list', Icon: ListIcon, keys: ['⌘', '⇧', '8'] },
    { label: 'Numbered list', Icon: ListOrderedIcon, keys: ['⌘', '⇧', '7'] },
  ],
]

export default function TooltipDemo() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
      {/* One provider for the toolbar: rest on one button, then sweep across the rest. */}
      <TooltipProvider>
        <div role="group" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-b border-line p-1.5">
          {GROUPS.map((group, i) => (
            <Fragment key={group[0]!.label}>
              {i > 0 && <Separator orientation="vertical" className="mx-1 h-5 self-center" />}
              {group.map(({ label, Icon, keys, pressed }) => (
                <Tooltip key={label}>
                  {/* The tooltip is visual only: the button keeps a matching aria-label. */}
                  <TooltipTrigger render={<Toggle size="sm" aria-label={label} defaultPressed={pressed} />}>
                    <Icon />
                  </TooltipTrigger>
                  <TooltipContent>
                    {label}
                    <KbdGroup>
                      {keys.map((key) => (
                        <Kbd key={key}>{key}</Kbd>
                      ))}
                    </KbdGroup>
                  </TooltipContent>
                </Tooltip>
              ))}
            </Fragment>
          ))}
        </div>
      </TooltipProvider>
      <p className="px-4 py-3.5 text-ui leading-6 text-fg-muted">
        Release notes for <span className="font-semibold text-fg">2.4</span>: previews build twice as fast, and
        comments sync with your issue tracker.
      </p>
    </div>
  )
}
