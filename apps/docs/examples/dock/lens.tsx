'use client'

import { useState } from 'react'
import { BoldIcon, CodeIcon, ItalicIcon, LinkIcon, ListIcon, QuoteIcon } from '@youj/icons'
import { Dock, type DockItem } from '@youj/motion/interactions'

const TOOLS: DockItem[] = [
  { id: 'bold', label: 'Bold', icon: <BoldIcon /> },
  { id: 'italic', label: 'Italic', icon: <ItalicIcon /> },
  { id: 'link', label: 'Link', icon: <LinkIcon /> },
  { id: 'quote', label: 'Quote', icon: <QuoteIcon /> },
  { id: 'list', label: 'List', icon: <ListIcon /> },
  { id: 'code', label: 'Code', icon: <CodeIcon /> },
]

// The same six tools, with two lenses: a quiet one for a dense toolbar, and the default.
const LENSES = [
  { name: 'Toolbar', props: { size: 32, magnification: 1.3, distance: 90 }, note: 'size 32 · magnification 1.3 · distance 90' },
  { name: 'Default', props: {}, note: 'size 48 · magnification 1.6 · distance 140' },
]

export default function DockLens() {
  const [tool, setTool] = useState('bold')

  return (
    <div className="flex w-full flex-col items-center gap-10 py-4">
      {LENSES.map(({ name, props, note }) => (
        <figure key={name} className="flex flex-col items-center gap-3">
          <Dock items={TOOLS} value={tool} onValueChange={setTool} label={`${name} formatting`} {...props} />
          <figcaption className="font-mono text-[11px] text-fg-muted">{note}</figcaption>
        </figure>
      ))}
    </div>
  )
}
