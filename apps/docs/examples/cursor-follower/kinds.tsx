'use client'

import { useId, useRef, useState } from 'react'
import { CursorFollower } from '@youj/motion/interactions'
import { Label, Switch } from '@youj/react'

export default function CursorFollowerKinds() {
  const id = useId()
  const scope = useRef<HTMLDivElement>(null)
  const [hide, setHide] = useState(false)

  return (
    <div ref={scope} className="w-full max-w-xl">
      <CursorFollower scope={scope} hideNativeCursor={hide} />
      <div className="grid grid-cols-2 gap-3">
        <figure className="flex h-28 flex-col items-center justify-center gap-3 rounded-xl border border-line bg-surface">
          <button
            type="button"
            data-cursor="button"
            className="h-8 rounded-lg border border-line bg-canvas px-3 text-sm font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Invite
          </button>
          <figcaption className="font-mono text-xs text-fg-muted">button</figcaption>
        </figure>
        <figure className="flex h-28 flex-col items-center justify-center gap-3 rounded-xl border border-line bg-surface px-4">
          <p data-cursor="text" className="text-center text-sm text-fg">
            Text becomes an I-beam.
          </p>
          <figcaption className="font-mono text-xs text-fg-muted">text</figcaption>
        </figure>
        <figure className="flex h-28 flex-col items-center justify-center gap-3 rounded-xl border border-line bg-surface">
          <a
            href="#changelog"
            data-cursor="link"
            data-cursor-label="Read it"
            className="rounded-sm text-sm text-fg underline decoration-line-strong underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Changelog
          </a>
          <figcaption className="font-mono text-xs text-fg-muted">link</figcaption>
        </figure>
        <figure className="flex h-28 flex-col items-center justify-center gap-3 rounded-xl border border-line bg-surface">
          <a
            href="#case-study"
            data-cursor="media"
            aria-label="Northwind case study"
            className="block h-12 w-20 rounded-lg border border-line bg-[radial-gradient(120%_90%_at_20%_10%,color-mix(in_oklch,var(--color-accent)_45%,transparent),transparent_65%)] outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <figcaption className="font-mono text-xs text-fg-muted">media</figcaption>
        </figure>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        <Switch id={id} size="sm" checked={hide} onCheckedChange={setHide} />
        <Label htmlFor={id} className="text-xs font-normal text-fg-muted">
          Hide the native cursor
        </Label>
      </div>
    </div>
  )
}
