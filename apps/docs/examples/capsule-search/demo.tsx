'use client'

import { useState } from 'react'
import { CapsuleSearch } from '@youj/react'

export default function CapsuleSearchDemo() {
  const [submitted, setSubmitted] = useState('')
  return (
    <div className="flex flex-col items-center gap-3">
      <CapsuleSearch shortcut="/" placeholder="Search samples" onSubmit={setSubmitted} />
      <p className="text-ui-sm text-fg-muted">{submitted ? `Searched for “${submitted}”` : 'Press / to search, Enter to submit.'}</p>
    </div>
  )
}
