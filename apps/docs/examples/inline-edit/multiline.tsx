'use client'

import { useState } from 'react'
import { InlineEdit } from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function InlineEditMultiline() {
  const [notes, setNotes] = useState('Faster search across every workspace.\nDark mode for the editor.')

  return (
    <div className="flex w-full max-w-md flex-col gap-1">
      <p className="ps-3 text-ui-sm font-medium text-fg-muted">Release notes</p>
      <InlineEdit label="Release notes" multiline value={notes} onValueChange={setNotes} onSave={() => wait(900)} />
    </div>
  )
}
