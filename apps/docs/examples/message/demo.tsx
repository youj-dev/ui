'use client'

import { useState } from 'react'
import { ChatMessage, type ChatFeedback } from '@youj/react'

const QUESTION = 'Why did checkout get slower after Tuesday?'

const ANSWER = `The second deployment on Tuesday moved \`checkout\` to the edge runtime, and p95 rose in **fra1** only:

- before: **97 ms**
- after: **164 ms**

The edge build pulls a larger crypto polyfill. Rolling back to \`dpl_7c1e0b2\` is safe.`

export default function MessageDemo() {
  const [question, setQuestion] = useState(QUESTION)
  const [feedback, setFeedback] = useState<ChatFeedback>(null)
  const [version, setVersion] = useState(1)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <ChatMessage role="user" name="Ada Lovelace" timestamp={Date.UTC(2026, 0, 15, 9, 12)} content={question} onEdit={setQuestion} />
      <ChatMessage
        role="assistant"
        name="Youj"
        timestamp={Date.UTC(2026, 0, 15, 9, 12)}
        content={version === 1 ? ANSWER : `${ANSWER}\n\n_Regenerated ${version - 1}×._`}
        feedback={feedback}
        onFeedbackChange={setFeedback}
        onRegenerate={() => setVersion((v) => v + 1)}
      />
    </div>
  )
}
