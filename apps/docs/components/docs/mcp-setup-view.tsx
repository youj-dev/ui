'use client'

import { useId, useState, type ReactNode } from 'react'
import { CopyButton } from '@/components/ui/copy-button'
import { TabList } from '@/components/ui/controls'
import type { McpEditor } from '@/lib/mcp-config'

function Command({ command, note, label }: { command: string; note: string; label: string }) {
  return (
    <div className="py-3 ps-4 pe-2">
      <div className="flex items-start gap-2">
        {/* Long lines scroll sideways; focusable, so the keyboard can scroll them too. */}
        <div tabIndex={0} role="group" aria-label={label} className="min-w-0 flex-1 overflow-x-auto rounded-sm code-text leading-7 whitespace-nowrap text-fg yj-scrollbar focus-ring">
          <span aria-hidden className="me-2.5 text-fg-subtle select-none">$</span>
          {command}
        </div>
        <CopyButton value={command} label="Copy command" className="mt-0.5" />
      </div>
      <p className="pe-10 text-[12.5px] leading-5 text-pretty text-fg-muted">{note}</p>
    </div>
  )
}

export function McpSetupView({ editors }: { editors: (McpEditor & { highlighted: ReactNode })[] }) {
  const id = useId()
  const [current, setCurrent] = useState<McpEditor['id']>('claude')
  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-line bg-surface">
      <div className="border-b border-line p-1.5">
        <TabList idBase={id} label="Editor" value={current} onChange={setCurrent} compact tabs={editors.map((e) => ({ value: e.id, label: e.name }))} />
      </div>
      {editors.map((editor) => (
        <div key={editor.id} role="tabpanel" id={`${id}-panel-${editor.id}`} aria-labelledby={`${id}-tab-${editor.id}`} hidden={current !== editor.id}>
          <Command
            command={`npx youj mcp --client ${editor.id}`}
            note={
              editor.manual
                ? `Prints the config to paste in ${editor.name}'s settings: it keeps its servers there, not in a file.`
                : `Writes ${editor.path}, merged with what's already there. Running it again changes nothing.`
            }
            label={`Set up ${editor.name}`}
          />
          {editor.command && <Command command={editor.command} note={`Or ${editor.commandNote}`} label={`${editor.name} command`} />}
          <div className="border-t border-line bg-(--code-bg)">
            <div className="flex h-10 items-center gap-2 border-b border-line ps-4 pe-1.5 type-small text-fg-muted">
              <span className="flex-1 truncate">{editor.manual ? `Paste in ${editor.path}` : editor.path}</span>
              <CopyButton value={editor.config} label={`Copy config for ${editor.name}`} />
            </div>
            <div tabIndex={0} aria-label={`${editor.path} for ${editor.name}`} role="group" className="code-panel overflow-x-auto yj-scrollbar focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset">
              {editor.highlighted}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
