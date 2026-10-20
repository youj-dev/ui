'use client'

import { useState } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { ToggleGroup, ToggleGroupItem } from '@youj/react'
import { InstallField } from '@/components/landing/install-field'
import { PillarMark } from '@/components/landing/pillar-mark'
import type { PillarId } from '@/lib/nav'

export interface ExplorerItem {
  name: string
  title: string
  command: string
  npm: string[]
  brings: { name: string; kind: PillarId; note: string }[]
  kind: PillarId
}

/**
 * Per-component installs, read from the registry: pick an item and see the
 * command, and everything `youj add` brings with it, part by part.
 */
export function RegistryExplorer({ items }: { items: ExplorerItem[] }) {
  const [name, setName] = useState(items[0]?.name ?? '')
  const item = items.find((i) => i.name === name) ?? items[0]
  if (!item) return null

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <div className="border-b border-line p-3">
        <ToggleGroup
          aria-label="Registry item"
          spacing={1}
          value={[item.name]}
          onValueChange={(value) => value[0] && setName(String(value[0]))}
          className="flex w-full flex-wrap gap-1"
        >
          {items.map((i) => (
            <ToggleGroupItem key={i.name} value={i.name} size="sm" variant="outline">
              {i.title}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <InstallField run={item.command.replace(/^npx @youj\/cli /, '')} className="w-full" />
        <div>
          <p className="type-label">Lands in your app</p>
          <PresenceList as="ul" className="mt-2.5 flex flex-col">
            {[{ name: item.name, kind: item.kind, note: 'the item' }, ...item.brings].map((dep) => (
              <PresenceItem key={dep.name} className="flex items-center gap-3 border-b border-line bg-surface py-2 last:border-b-0">
                <PillarMark id={dep.kind} className="size-6 rounded-md [&_svg]:size-3.5" />
                <span className="min-w-0 flex-1 truncate code-text">{dep.name}</span>
                <span className="shrink-0 text-[12px] text-fg-muted">{dep.note}</span>
              </PresenceItem>
            ))}
          </PresenceList>
        </div>
        {item.npm.length > 0 && (
          <p className="text-[12.5px] leading-relaxed text-fg-muted">
            From npm: <span className="code-text">{item.npm.join(', ')}</span>
          </p>
        )}
      </div>
    </div>
  )
}
