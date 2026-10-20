'use client'

import { ChatMarkdown } from '@youj/react'

// What a model (or a prompt injection) might send. None of it becomes markup.
const SOURCE = `Here's the report you asked for. <img src=x onerror="alert(1)">

- A safe link: [status page](https://status.youj.io)
- An unsafe one stays text: [click me](javascript:alert(1))
- An image becomes a link: ![chart](https://youj.io/chart.png)

<script>document.cookie</script>`

export default function MarkdownSafety() {
  return (
    <div className="w-full max-w-2xl rounded-xl border border-line bg-canvas p-5">
      <ChatMarkdown content={SOURCE} className="text-ui-lg leading-6" />
    </div>
  )
}
