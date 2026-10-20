'use client'

import { BoldIcon, CodeIcon, ItalicIcon, LinkIcon, UnderlineIcon } from '@youj/icons'
import { Button, FieldSeparator, Separator } from '@youj/react'

export default function SeparatorToolbar() {
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-8">
      {/* Groups of related tools, split by vertical hairlines. */}
      <div role="group" aria-label="Formatting" className="flex h-control items-center gap-1 rounded-lg border border-line bg-surface px-1">
        <Button variant="ghost" size="icon-sm" aria-label="Bold">
          <BoldIcon />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Italic">
          <ItalicIcon />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Underline">
          <UnderlineIcon />
        </Button>
        <Separator orientation="vertical" className="mx-1 my-1.5" />
        <Button variant="ghost" size="icon-sm" aria-label="Link">
          <LinkIcon />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Code">
          <CodeIcon />
        </Button>
      </div>

      {/* A labelled break between two ways in. */}
      <div className="grid w-full gap-4">
        <Button variant="outline">Continue with GitHub</Button>
        <FieldSeparator>or</FieldSeparator>
        <Button variant="outline">Continue with email</Button>
      </div>
    </div>
  )
}
