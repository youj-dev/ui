'use client'

import { useRef, useState } from 'react'
import { Button, Whiteboard, type WhiteboardHandle, type WhiteboardScene } from '@youj/react'

export default function WhiteboardEmpty() {
  const board = useRef<WhiteboardHandle>(null)
  const [scene, setScene] = useState<WhiteboardScene>({ shapes: [] })
  const [out, setOut] = useState('')

  const png = async () => {
    const blob = await board.current?.toPNG()
    if (blob) setOut(`${blob.size} bytes of PNG`)
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <Whiteboard ref={board} value={scene} onValueChange={setScene} height={360} />
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={!scene.shapes.length} onClick={() => setOut(`${board.current?.toSVG().length ?? 0} bytes of SVG`)}>
          Export SVG
        </Button>
        <Button variant="outline" size="sm" disabled={!scene.shapes.length} onClick={png}>
          Export PNG
        </Button>
        <span className="ms-1 truncate font-mono text-ui-xs text-fg-muted">{out || `${scene.shapes.length} shapes in the scene`}</span>
      </div>
    </div>
  )
}
