'use client'

import { FileUpload, type UploadContext } from '@youj/react'

const MB = 1024 * 1024

// A stand-in for your upload endpoint, reporting progress until it's done.
function upload(_file: File, { signal, onProgress }: UploadContext) {
  return new Promise<void>((resolve, reject) => {
    let progress = 0
    const timer = setInterval(() => {
      progress = Math.min(100, progress + 8 + Math.random() * 16)
      onProgress(progress)
      if (progress >= 100) {
        clearInterval(timer)
        resolve()
      }
    }, 260)
    signal.addEventListener('abort', () => {
      clearInterval(timer)
      reject(signal.reason)
    })
  })
}

export default function FileUploadGallery() {
  return (
    <div className="w-full max-w-[460px]">
      <FileUpload variant="gallery" accept="image/*" maxSize={8 * MB} maxFiles={8} onUpload={upload} title="Drop photos or browse" />
    </div>
  )
}
