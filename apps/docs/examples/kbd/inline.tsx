'use client'

import { TerminalIcon } from '@youj/icons'
import { Kbd, KbdGroup } from '@youj/react'

export default function KbdInline() {
  return (
    <div className="flex w-full max-w-md gap-3 rounded-xl border border-line bg-surface p-4">
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-band text-fg-muted">
        <TerminalIcon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-ui font-medium text-fg">Develop locally</p>
        {/* Keycaps sit on the text's baseline. A 24px line leaves room for them, so lines stay evenly spaced. */}
        <p className="mt-1 text-ui leading-6 text-fg-muted">
          Run <code className="rounded-sm bg-band px-1 py-0.5 font-mono text-ui-sm text-fg">youj dev</code> in
          your project. While it runs, press <Kbd>O</Kbd> to open the preview, <Kbd>R</Kbd> to restart with fresh
          environment variables, and{' '}
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>C</Kbd>
          </KbdGroup>{' '}
          to stop.
        </p>
      </div>
    </div>
  )
}
