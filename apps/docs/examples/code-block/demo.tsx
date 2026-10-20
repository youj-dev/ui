'use client'

import { CodeBlock } from '@youj/react'

const CODE = `'use client'

import { AsyncButton } from '@youj/react'

export function SaveButton({ onSave }: { onSave: () => Promise<void> }) {
  // Speed and reduced motion reach every animation
  return (
    <AsyncButton onAction={onSave} pendingLabel="Saving…">
      Save changes
    </AsyncButton>
  )
}`

export default function CodeBlockDemo() {
  return (
    <div className="w-full max-w-2xl">
      <CodeBlock code={CODE} language="tsx" filename="components/save-button.tsx" lineNumbers />
    </div>
  )
}
