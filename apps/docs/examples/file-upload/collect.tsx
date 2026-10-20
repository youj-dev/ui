'use client'

import { useState } from 'react'
import { Button, FileUpload, formatBytes, type UploadFile } from '@youj/react'

export default function FileUploadCollect() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [imported, setImported] = useState('')

  return (
    <form
      className="flex w-full max-w-[440px] flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        const file = files[0]?.file
        if (file) setImported(`Importing ${file.name} (${formatBytes(file.size)})…`)
      }}
    >
      {/* Without onUpload, files are only collected, for the form to send later. */}
      <FileUpload
        accept=".csv,.xlsx"
        multiple={false}
        maxFiles={1}
        title="Drop a spreadsheet or browse"
        onFilesChange={(next) => {
          setFiles(next)
          setImported('')
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <p role="status" className="text-ui-sm text-fg-muted">
          {imported}
        </p>
        <Button type="submit" disabled={files.length === 0}>
          Import contacts
        </Button>
      </div>
    </form>
  )
}
