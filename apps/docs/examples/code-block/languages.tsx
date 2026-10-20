'use client'

import { CodeBlock } from '@youj/react'

export default function CodeBlockLanguages() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <CodeBlock code="pnpm dlx @youj/cli@latest init" language="sh" />
      <CodeBlock
        language="diff"
        code={`- import { Check } from 'lucide-react'
+ import { CheckIcon } from '@youj/icons'`}
      />
      <CodeBlock
        language="json"
        filename="components.json"
        code={`{
  "style": "base-nova",
  "registries": { "@youj": "https://www.youj.dev/r/{name}.json" }
}`}
      />
    </div>
  )
}
