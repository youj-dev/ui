'use client'

import { Counter } from '@youj/motion'
import { DownloadIcon, TrashIcon, XIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { useFileManager } from './context'
import { formatSize, type FileManagerFile } from './data'
import { Rising } from './rising'

export function SelectionBar({ files, onDelete, onClear }: { files: FileManagerFile[]; onDelete: () => void; onClear: () => void }) {
  const { copy, download } = useFileManager()
  const count = files.length
  const bytes = files.reduce((s, f) => s + f.size, 0)
  return (
    <Rising show={count > 0} label={copy.selection} className="absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
      <div className="flex items-center gap-1 rounded-xl border border-line bg-overlay p-1.5 ps-3 text-fg shadow-lg">
        <span className="me-2 text-ui whitespace-nowrap">
          <Counter value={count} duration="fast" inView={false} className="font-semibold" /> {copy.selected}
          <span className="text-fg-muted max-sm:hidden"> · {formatSize(bytes, copy.locale)}</span>
        </span>
        <AsyncButton variant="ghost" size="sm" aria-label={copy.downloadSelected} successLabel={copy.zipped} onAction={() => download(files)}>
          <DownloadIcon size={14} /> <span className="max-sm:hidden">{copy.download}</span>
        </AsyncButton>
        <Button variant="ghost" size="sm" className="text-danger-text" aria-label={copy.deleteSelected} onClick={onDelete}>
          <TrashIcon size={14} /> <span className="max-sm:hidden">{copy.delete}</span>
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={copy.clearSelection} onClick={onClear}>
          <XIcon size={14} />
        </Button>
      </div>
    </Rising>
  )
}
