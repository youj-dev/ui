'use client'

import { Button, toast } from '@youj/react'
import { UploadIcon } from '@youj/icons'

const FILES = ['launch-video.mp4', 'poster.png', 'captions.vtt']

// Stands in for an upload that reports progress file by file.
function upload() {
  // timeout: 0 keeps the toast up while the work runs.
  const id = toast(`Uploading ${FILES.length} files`, { description: `0 of ${FILES.length}: ${FILES[0]}`, timeout: 0 })
  FILES.forEach((_, i) => {
    setTimeout(() => {
      const done = i + 1
      if (done < FILES.length) {
        // update() changes the toast in place.
        toast.update(id, { description: `${done} of ${FILES.length}: ${FILES[done]}` })
      } else {
        // The same id upserts: the toast becomes a success and its timer starts again.
        toast.success(`Uploaded ${FILES.length} files`, { id, description: 'Attached to the v4.14 release notes.', timeout: 5000 })
      }
    }, (i + 1) * 900)
  })
}

// No Toaster here: the app's one Toaster renders these. On this page, that's the one in the first preview.
export default function ToastUpdate() {
  return (
    <Button variant="outline" onClick={upload}>
      <UploadIcon />
      Upload 3 files
    </Button>
  )
}
