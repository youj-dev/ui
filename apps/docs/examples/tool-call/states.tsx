'use client'

import { ChatToolCall } from '@youj/react'

export default function ToolCallStates() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-2">
      <ChatToolCall name="search_docs" args={{ query: 'rollback' }} status="pending" />
      <ChatToolCall name="get_metrics" args={{ region: 'fra1', window: '7d' }} status="running" />
      <ChatToolCall
        name="get_metrics"
        args={{ region: 'iad1', window: '7d' }}
        status="success"
        duration={620}
        result="p50 41 ms · p95 84 ms · cold start 112 ms · 0.02% errors"
      />
      <ChatToolCall
        name="promote_deployment"
        args={{ id: 'dpl_7c1e0b2' }}
        status="error"
        error="403: this token can't promote to production. Ask an owner for the deploy scope."
      />
    </div>
  )
}
