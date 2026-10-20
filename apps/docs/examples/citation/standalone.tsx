'use client'

import { ChatCitation, ChatSources, type ChatSource } from '@youj/react'

const SOURCES: ChatSource[] = [
  { title: 'Youj 2.0 is here', url: 'https://youj.io/blog/2-0', snippet: 'Streaming markdown, a chat kit for assistants, and five theme presets.' },
  { title: 'Upgrading to 2.0', url: 'https://youj.io/docs/upgrade', snippet: 'Bump the package, run the codemod, review the three renamed props it marks.' },
  { title: 'Internal runbook', url: 'file:///runbooks/upgrade.md' },
]

export default function CitationStandalone() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-4 rounded-xl border border-line bg-canvas p-5">
      <p className="text-ui-lg leading-6 text-fg">
        Upgrading is a one-line change for most apps
        <ChatCitation index={2} source={SOURCES[1]!} />, and the release adds a chat kit
        <ChatCitation index={1} source={SOURCES[0]!} />. The runbook covers the rest
        <ChatCitation index={3} source={SOURCES[2]!} />.
      </p>
      {/* A source that isn't http(s) is shown, but not linked. */}
      <ChatSources sources={SOURCES} label="Read more" />
    </div>
  )
}
