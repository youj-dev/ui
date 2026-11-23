'use client'

import { InlineEdit } from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function InlineEditFailure() {
  return (
    <div className="w-full max-w-xs">
      <InlineEdit
        label="Workspace address"
        defaultValue="northwind"
        onSave={async () => {
          await wait(900)
          throw new Error('That address is taken. Try another.')
        }}
      />
    </div>
  )
}
