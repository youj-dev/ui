'use client'

import { PlusIcon, UploadIcon } from '@youj/icons'
import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@youj/react'

export default function EmptyStateDemo() {
  return (
    <div className="w-full max-w-xl rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
        <p className="text-ui font-medium text-fg">Deployments</p>
        <p className="font-mono text-ui-sm text-fg-muted">youj / web</p>
      </div>
      {/* Hover the header: the plates open and the icon plays. */}
      <Empty className="py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UploadIcon />
          </EmptyMedia>
          <EmptyTitle>No deployments yet</EmptyTitle>
          <EmptyDescription>
            Push to a connected branch, or deploy from your machine with the CLI. Previews appear here as they build.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>
            <PlusIcon />
            Import project
          </Button>
          <Button variant="outline">Deploy from the CLI</Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
