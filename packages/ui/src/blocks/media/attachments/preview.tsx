'use client'

import { useEffect, useMemo } from 'react'
import { ExternalLinkIcon, FileIcon } from '@youj/icons'
import { buttonVariants } from '../../../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { cn } from '../../../lib/utils'
import { formatBytes, type AttachmentComposerCopy, type AttachmentComposerFile } from './data'

/* An attachment opened from its chip: a picture large, any other file as a
 * card with its size and a link to open it in a new tab. Closing returns
 * focus to the chip. */

export function Preview({ file, copy, onClose }: { file: AttachmentComposerFile | null; copy: AttachmentComposerCopy; onClose: () => void }) {
  // A file that isn't a picture opens from a URL of its own, given back when the preview closes.
  const url = useMemo(() => (file && !file.preview && file.file ? safeUrl(file.file) : undefined), [file])
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url])
  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn(file?.preview ? 'max-w-3xl' : 'max-w-sm')}>
        {file && (
          <>
            <DialogHeader>
              <DialogTitle dir="auto" className="wrap-break-word">
                {file.name}
              </DialogTitle>
              <DialogDescription className="tabular-nums">{formatBytes(file.size, copy.locale)}</DialogDescription>
            </DialogHeader>
            {file.preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- copy-in blocks run in Vite too
              <img src={file.preview} alt="" className="max-h-[70vh] w-full rounded-md bg-well object-contain" />
            ) : (
              <div className="grid place-items-center gap-3 rounded-lg bg-band py-8 text-fg-muted">
                <FileIcon size={32} strokeWidth={1.25} />
                {url && (
                  <a href={url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    <ExternalLinkIcon />
                    {copy.open}
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function safeUrl(file: File) {
  try {
    return URL.createObjectURL(file)
  } catch {
    return undefined
  }
}
