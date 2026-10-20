'use client'

import { Fragment, useEffect, useState } from 'react'
import { Button, ResizableHandle, ResizablePanel, ResizablePanelGroup, type ResizableLayout } from '@youj/react'

const KEY = 'mail:layout'
const PANELS = ['inbox', 'thread', 'details'] as const

function readLayout(): ResizableLayout | undefined {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ResizableLayout) : undefined
  } catch {
    return undefined
  }
}

export default function ResizablePersisted() {
  const [layout, setLayout] = useState<ResizableLayout>()
  // Storage is read after hydration, so the server and first client render agree; the group mounts with what was saved.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setLayout(readLayout())
    setReady(true)
  }, [])

  return (
    <div className="flex h-[300px] w-full max-w-2xl flex-col gap-3">
      <div className="flex items-center gap-2 text-ui-sm text-fg-muted">
        Saved
        <code className="rounded-sm bg-band px-1.5 py-0.5 font-mono text-fg">
          {layout ? Object.entries(layout).map(([id, size]) => `${id} ${size.toFixed(0)}%`).join(' · ') : 'nothing yet'}
        </code>
        <Button
          variant="ghost"
          size="xs"
          className="ms-auto"
          onClick={() => {
            try {
              localStorage.removeItem(KEY)
            } catch {
              // Storage is blocked: there's nothing to forget.
            }
            setLayout(undefined)
          }}
        >
          Forget
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-line bg-surface">
        {/* onLayoutChanged fires once a drag or key press settles, not on every pointer move. */}
        {ready && (
          <ResizablePanelGroup
            orientation="horizontal"
            defaultLayout={layout}
            onLayoutChanged={(next) => {
              setLayout(next)
              try {
                localStorage.setItem(KEY, JSON.stringify(next))
              } catch {
                // Storage is blocked: the layout just isn't remembered.
              }
            }}
          >
            {PANELS.map((id, i) => (
              <Fragment key={id}>
                {i > 0 && <ResizableHandle withHandle />}
                <ResizablePanel id={id} minSize="15%">
                  <div className="grid h-full place-items-center text-ui text-fg-muted capitalize">{id}</div>
                </ResizablePanel>
              </Fragment>
            ))}
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  )
}
