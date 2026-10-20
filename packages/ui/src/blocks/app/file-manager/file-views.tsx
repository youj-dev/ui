'use client'

import { useState } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { CheckIcon, EyeIcon, FolderIcon, LinkIcon, TrashIcon } from '@youj/icons'
import { Checkbox } from '../../../components/ui/checkbox'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '../../../components/ui/context-menu'
import { cn } from '../../../lib/utils'
import { useFileManager } from './context'
import { formatSize, KIND, type FileManagerFile } from './data'
import { Thumb } from './thumb'

interface FileViewProps {
  files: FileManagerFile[]
  shown: FileManagerFile[]
  subfolders: string[]
  selected: Set<string>
  onFolder: (id: string) => void
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  onRemove: (ids: string[]) => void
}

function FileMenu({ file: f, selected, onOpen, onToggle, onRemove }: { file: FileManagerFile } & Pick<FileViewProps, 'selected' | 'onOpen' | 'onToggle' | 'onRemove'>) {
  const { copy, copyLink } = useFileManager()
  return (
    <ContextMenuContent>
      <ContextMenuItem onClick={() => onOpen(f.id)}>
        <EyeIcon size={14} /> {copy.preview}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onToggle(f.id)}>
        <CheckIcon size={14} /> {selected.has(f.id) ? copy.deselect : copy.select}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => copyLink(f)}>
        <LinkIcon size={14} /> {copy.copyLink}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem variant="danger" onClick={() => onRemove([f.id])}>
        <TrashIcon size={14} /> {copy.delete}
      </ContextMenuItem>
    </ContextMenuContent>
  )
}

export function FileGrid({ files, shown, subfolders, selected, onFolder, onToggle, onOpen, onRemove }: FileViewProps) {
  // The tile under the pointer or holding focus: its scene lifts its lit part.
  const [hot, setHot] = useState<string | null>(null)
  const cool = (id: string) => setHot((h) => (h === id ? null : h))
  const { copy, names, modified } = useFileManager()
  return (
    <PresenceList aria-label={copy.files} className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
      {subfolders.map((id) => (
        <PresenceItem key={id}>
          <button
            type="button"
            onClick={() => onFolder(id)}
            className="focus-ring flex w-full items-center gap-3 rounded-lg border border-line bg-surface p-3 text-start transition-colors yj-duration-fast ease-standard hover:bg-hover"
          >
            <FolderIcon size={18} className="shrink-0 text-accent-text" />
            <span className="min-w-0 flex-1 truncate font-medium">{names[id]}</span>
            <span className="text-ui-xs text-fg-muted tabular-nums">{files.filter((f) => f.folder === id).length}</span>
          </button>
        </PresenceItem>
      ))}
      {shown.map((f) => {
        const on = selected.has(f.id)
        return (
          <PresenceItem key={f.id} className="min-w-0">
            <ContextMenu>
              <ContextMenuTrigger
                className={cn(
                  'group/tile relative flex flex-col overflow-hidden rounded-lg border bg-surface transition-[border-color,box-shadow] yj-duration-fast ease-standard focus-ring-within',
                  on ? 'border-accent shadow-[0_0_0_1px_var(--color-accent)]' : 'border-line hover:border-line-control',
                )}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setHot(f.id)}
                onPointerLeave={() => cool(f.id)}
                onFocus={() => setHot(f.id)}
                onBlur={() => cool(f.id)}
              >
                <Thumb file={f} lifted={hot === f.id} className="aspect-[4/3] border-b border-line" />
                <div className="flex flex-col gap-0.5 px-3 py-2.5">
                  <button type="button" onClick={() => onOpen(f.id)} className="truncate text-start font-medium text-fg outline-none after:absolute after:inset-0">
                    {f.name}
                  </button>
                  <span className="truncate text-ui-xs text-fg-muted">
                    {formatSize(f.size, copy.locale)} · {modified(f.modified)}
                  </span>
                </div>
                <span
                  className={cn(
                    'absolute start-2 top-2 z-10 grid size-6 place-items-center rounded-md bg-surface shadow-xs transition-opacity yj-duration-fast ease-standard',
                    on ? 'opacity-100' : 'opacity-0 group-hover/tile:opacity-100 group-focus-within/tile:opacity-100 pointer-coarse:opacity-100',
                  )}
                >
                  <Checkbox checked={on} onCheckedChange={() => onToggle(f.id)} aria-label={copy.selectFile(f.name)} />
                </span>
              </ContextMenuTrigger>
              <FileMenu file={f} selected={selected} onOpen={onOpen} onToggle={onToggle} onRemove={onRemove} />
            </ContextMenu>
          </PresenceItem>
        )
      })}
    </PresenceList>
  )
}

export function FileList({ shown, subfolders, selected, onFolder, onToggle, onOpen, onRemove }: FileViewProps) {
  const { copy, names, modified } = useFileManager()
  return (
    <PresenceList aria-label={copy.files} className="flex flex-col p-2">
      {subfolders.map((id) => (
        <PresenceItem key={id}>
          <button type="button" onClick={() => onFolder(id)} className="focus-ring flex h-11 w-full items-center gap-3 rounded-md px-2 text-start hover:bg-hover">
            <span className="size-4" />
            <FolderIcon size={18} className="text-accent-text" />
            <span className="min-w-0 flex-1 truncate font-medium">{names[id]}</span>
          </button>
        </PresenceItem>
      ))}
      {shown.map((f) => {
        const on = selected.has(f.id)
        const { icon: Icon, tone } = KIND[f.kind]
        return (
          <PresenceItem key={f.id}>
            <ContextMenu>
              <ContextMenuTrigger className={cn('relative flex h-12 items-center gap-3 rounded-md px-2 transition-colors yj-duration-fast ease-standard focus-ring-within', on ? 'bg-accent-subtle' : 'hover:bg-hover')}>
                <Checkbox checked={on} onCheckedChange={() => onToggle(f.id)} aria-label={copy.selectFile(f.name)} className="relative z-10" />
                <span aria-hidden className={cn('grid size-8 shrink-0 place-items-center rounded-md', tone)}>
                  <Icon size={16} />
                </span>
                <button type="button" onClick={() => onOpen(f.id)} className="min-w-0 flex-1 truncate text-start font-medium outline-none after:absolute after:inset-0">
                  {f.name}
                </button>
                <span className="w-28 truncate text-ui-sm text-fg-muted max-md:hidden">{f.owner}</span>
                <span className="w-24 text-ui-sm text-fg-muted max-sm:hidden">{modified(f.modified)}</span>
                <span className="w-16 text-end text-ui-sm text-fg-muted tabular-nums">{formatSize(f.size, copy.locale)}</span>
              </ContextMenuTrigger>
              <FileMenu file={f} selected={selected} onOpen={onOpen} onToggle={onToggle} onRemove={onRemove} />
            </ContextMenu>
          </PresenceItem>
        )
      })}
    </PresenceList>
  )
}
