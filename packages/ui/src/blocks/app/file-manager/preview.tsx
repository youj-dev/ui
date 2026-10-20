'use client'

import { useEffect, useState } from 'react'
import { useYouj } from '@youj/core'
import { MorphLabel } from '@youj/motion'
import { CheckIcon, CopyIcon, DownloadIcon, LinkIcon, TrashIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../../../components/ui/sheet'
import { Switch } from '../../../components/ui/switch'
import { cn } from '../../../lib/utils'
import { useFileManager } from './context'
import { formatSize, type FileManagerFile } from './data'
import { Thumb } from './thumb'

function ShareLink({ file }: { file: FileManagerFile }) {
  const k = useYouj()
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(true)
  const { copy, shareUrl } = useFileManager()
  const href = shareUrl(file)
  const url = href.replace(/^https?:\/\//, '')
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), k.ms('deliberate') * 3)
    return () => clearTimeout(t)
  }, [copied, k])
  return (
    <section aria-labelledby="share-title" className="flex flex-col gap-3 rounded-lg border border-line p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 id="share-title" className="flex items-center gap-2 text-ui font-medium">
          <LinkIcon size={14} /> {copy.shareTitle}
        </h3>
        <Switch checked={open} onCheckedChange={setOpen} aria-label={copy.shareSwitch} />
      </div>
      <div className={cn('flex items-center gap-2 transition-opacity yj-duration-fast ease-standard', !open && 'opacity-50')}>
        <code className="min-w-0 flex-1 truncate rounded-md bg-band px-2.5 py-1.5 font-mono text-ui-sm text-fg-muted">{url}</code>
        <Button
          variant="outline"
          size="sm"
          disabled={!open}
          className="overflow-hidden"
          onClick={() => {
            navigator.clipboard?.writeText(href).catch(() => {})
            setCopied(true)
          }}
        >
          <MorphLabel value={copied ? 'copied' : 'copy'} contentClassName="gap-1.5">
            {copied ? (
              <>
                <CheckIcon trigger="mount" size={14} strokeWidth={2.25} /> {copy.copied}
              </>
            ) : (
              <>
                <CopyIcon size={14} /> {copy.copyLink}
              </>
            )}
          </MorphLabel>
        </Button>
      </div>
    </section>
  )
}

export function Preview({ file, open, onOpenChange, onDelete }: { file?: FileManagerFile; open: boolean; onOpenChange: (open: boolean) => void; onDelete: (file: FileManagerFile) => void }) {
  const { copy, names, path, modified, download } = useFileManager()
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="end" className="sm:max-w-md">
        {file && (
          <>
            <SheetHeader>
              <SheetTitle className="truncate pe-8">{file.name}</SheetTitle>
              <SheetDescription>
                {copy.kinds[file.kind]} · {formatSize(file.size, copy.locale)}
              </SheetDescription>
            </SheetHeader>
            <SheetBody className="flex flex-col gap-5">
              <Thumb file={file} large className="aspect-[4/3] rounded-lg border border-line" />
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-ui">
                {[
                  [copy.location, path(file.folder).map((f) => names[f]).join(' / ')],
                  [copy.modified, modified(file.modified)],
                  [copy.owner, file.owner],
                  [copy.size, formatSize(file.size, copy.locale)],
                ].map(([term, value]) => (
                  <div key={term} className="contents">
                    <dt className="text-fg-muted">{term}</dt>
                    <dd className="min-w-0 truncate text-fg">{value}</dd>
                  </div>
                ))}
              </dl>
              <ShareLink key={file.id} file={file} />
            </SheetBody>
            <SheetFooter className="flex-row justify-between">
              <Button variant="ghost" className="text-danger-text" onClick={() => onDelete(file)}>
                <TrashIcon size={14} /> {copy.delete}
              </Button>
              <AsyncButton successLabel={copy.downloaded} onAction={() => download([file])}>
                <DownloadIcon size={14} /> {copy.download}
              </AsyncButton>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
