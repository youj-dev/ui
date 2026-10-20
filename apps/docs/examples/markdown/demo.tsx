'use client'

import { useEffect, useState } from 'react'
import { Button, ChatMarkdown, createTextStream } from '@youj/react'
import { RefreshIcon } from '@youj/icons'

const SOURCE = `## Shipping orion

Run the checks, open a preview, then merge to \`main\`. **Production builds from there**, and _every_ deployment keeps its build.

\`\`\`ts
import { deploy } from '@acme/cli'

const release = await deploy({ project: 'orion', target: 'production' })
console.log(release.url)
\`\`\`

| Region | Cold start | p95 |
| :----- | ---------: | --: |
| iad1 | 112 ms | 84 ms |
| fra1 | 131 ms | 97 ms |

> Rollbacks are instant: promote the previous deployment.

Read more in [the deployment guide](https://youj.io/docs/deployments).`

const tokenize = (text: string) => text.match(/\s*\S{1,4}|\s+/g) ?? []

export default function MarkdownDemo() {
  const [stream] = useState(() => createTextStream())
  const [streaming, setStreaming] = useState(true)
  const [run, setRun] = useState(0)

  useEffect(() => {
    const tokens = tokenize(SOURCE)
    let i = 0
    stream.set('')
    setStreaming(true)
    const timer = setInterval(() => {
      stream.append(tokens[i++]!)
      if (i < tokens.length) return
      clearInterval(timer)
      setStreaming(false)
    }, 30)
    return () => clearInterval(timer)
  }, [run, stream])

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <ChatMarkdown content={stream} streaming={streaming} headingLevel={3} className="text-ui-lg leading-6" />
      <Button variant="outline" size="sm" className="self-start" onClick={() => setRun((n) => n + 1)} disabled={streaming} focusableWhenDisabled>
        <RefreshIcon size={14} strokeWidth={1.75} />
        Stream again
      </Button>
    </div>
  )
}
