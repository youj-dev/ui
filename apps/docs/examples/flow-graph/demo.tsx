'use client'

import { useId, useState } from 'react'
import { FlowGraph, type FlowEdge, type FlowNode } from '@youj/react'

// An image upload's processing: two cleanups, three encodes, then the CDN.
const NODES: FlowNode[] = [
  { id: 'upload', label: 'upload.receive', kind: 'input', status: 'ok', meta: '0.4 s' },
  { id: 'exif', label: 'exif.strip', kind: 'step', status: 'ok', meta: '0.1 s' },
  { id: 'resize', label: 'image.resize', kind: 'step', status: 'retried', meta: '1.8 s', attempts: 2 },
  { id: 'webp', label: 'encode.webp', kind: 'step', status: 'ok', meta: '0.9 s' },
  { id: 'avif', label: 'encode.avif', kind: 'step', status: 'running', meta: '2.1 s' },
  { id: 'thumb', label: 'thumb.make', kind: 'step', status: 'error', meta: 'timeout' },
  { id: 'cdn', label: 'cdn.publish', kind: 'output', status: 'queued' },
]
const EDGES: FlowEdge[] = [
  { from: 'upload', to: 'exif' },
  { from: 'upload', to: 'resize' },
  { from: 'exif', to: 'webp' },
  { from: 'resize', to: 'webp' },
  { from: 'resize', to: 'avif' },
  { from: 'resize', to: 'thumb' },
  { from: 'webp', to: 'cdn' },
  { from: 'avif', to: 'cdn' },
]

export default function FlowGraphDemo() {
  const [open, setOpen] = useState<string | null>('avif')
  const detailId = useId()
  const node = NODES.find((n) => n.id === open)
  return (
    <div className="flex w-full max-w-4xl flex-col gap-3">
      <FlowGraph nodes={NODES} edges={EDGES} value={open} onValueChange={setOpen} controls={detailId} label="Image processing" />
      <p id={detailId} className="min-h-5 font-mono text-ui-sm text-fg-muted">
        {node ? `${node.label} · ${node.status}${node.meta ? ` · ${node.meta}` : ''}` : 'Pick a step to open it.'}
      </p>
    </div>
  )
}
