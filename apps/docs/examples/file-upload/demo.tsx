'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, FileUpload, type UploadContext } from '@youj/react'

const MB = 1024 * 1024

// A stand-in for your upload endpoint: irregular progress, every third file
// fails so Retry shows, and removing a file really aborts it.
let attempts = 0
function upload(file: File, { signal, onProgress }: UploadContext) {
  const fails = ++attempts % 3 === 0
  return new Promise<void>((resolve, reject) => {
    let progress = 0
    const timer = setInterval(() => {
      progress = Math.min(100, progress + 6 + Math.random() * 18)
      if (fails && progress > 55) {
        clearInterval(timer)
        reject(new Error('Connection lost'))
        return
      }
      onProgress(progress)
      if (progress >= 100) {
        clearInterval(timer)
        resolve()
      }
    }, 280 + (file.size % 5) * 40)
    signal.addEventListener('abort', () => {
      clearInterval(timer)
      reject(signal.reason)
    })
  })
}

export default function FileUploadDemo() {
  return (
    <Card className="w-full max-w-[440px]">
      <CardHeader>
        <CardTitle>Attachments</CardTitle>
        <CardDescription>Receipts or screenshots.</CardDescription>
      </CardHeader>
      <CardContent>
        <FileUpload accept=".png,.jpg,.jpeg,.pdf" maxSize={5 * MB} maxFiles={6} onUpload={upload} />
      </CardContent>
    </Card>
  )
}
