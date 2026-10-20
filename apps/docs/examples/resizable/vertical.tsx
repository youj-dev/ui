'use client'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@youj/react'

export default function ResizableVertical() {
  return (
    <div className="h-[320px] w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface">
      <ResizablePanelGroup orientation="vertical">
        <ResizablePanel defaultSize="60%" minSize="20%" maxSize="80%">
          <div className="grid h-full place-items-center text-ui text-fg-muted">Preview</div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label="Resize console" />
        <ResizablePanel minSize="20%">
          <div className="grid h-full place-items-center text-ui text-fg-muted">Console</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
