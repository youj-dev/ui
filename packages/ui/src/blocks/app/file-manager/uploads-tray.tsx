'use client'

import { PresenceItem, PresenceList } from '@youj/motion'
import { CloudUploadIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Progress } from '../../../components/ui/progress'
import { Rising } from './rising'
import { useFileManager } from './context'
import type { Upload } from './use-uploads'

export function UploadsTray({ uploads }: { uploads: Upload[] }) {
  const { copy } = useFileManager()
  return (
    <Rising show={uploads.length > 0} label={copy.uploads} className="fixed end-4 bottom-4 z-30 w-80 max-w-[calc(100vw-2rem)]">
      <div className="flex flex-col rounded-xl border border-line bg-overlay text-fg shadow-lg">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2 text-ui font-medium">
          <CloudUploadIcon size={15} className="text-accent-text" />
          {copy.uploading} <Badge variant="secondary">{uploads.length}</Badge>
        </div>
        <PresenceList className="flex max-h-60 flex-col overflow-y-auto">
          {uploads.map((u) => (
            <PresenceItem key={u.id} className="flex flex-col gap-1.5 px-3 py-2">
              <div className="flex items-center justify-between gap-2 text-ui-sm">
                <span className="truncate">{u.name}</span>
                <span className="shrink-0 text-fg-muted tabular-nums">{Math.round(u.progress)}%</span>
              </div>
              <Progress value={u.progress} aria-label={copy.uploadingFile(u.name)} />
            </PresenceItem>
          ))}
        </PresenceList>
      </div>
    </Rising>
  )
}
