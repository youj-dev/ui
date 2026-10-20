'use client'

import { useState } from 'react'
import { GenerateEntrance } from '@youj/motion'

export default function GenerateDemo() {
  const [play, setPlay] = useState(0)
  return (
    <div className="flex flex-col items-center gap-5">
      <GenerateEntrance play={play}>
        <form
          aria-label="Invite to Halcyon"
          className="flex w-80 flex-col gap-4 rounded-xl border border-line bg-surface p-5 shadow-sm"
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <h3 className="text-base font-semibold text-fg">Invite your team</h3>
            <p className="mt-1 text-sm text-fg-muted">They get access to every Halcyon project.</p>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
            Email addresses
            <input
              defaultValue="mira@halcyon.dev, kenji@halcyon.dev"
              className="h-9 rounded-md border border-line bg-field px-3 text-sm font-normal text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="h-9 rounded-md border border-line px-3 text-sm text-fg focus-visible:ring-2 focus-visible:ring-accent">
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 rounded-md bg-accent px-3 text-sm font-medium text-accent-contrast focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Send invites
            </button>
          </div>
        </form>
      </GenerateEntrance>
      <button
        type="button"
        onClick={() => setPlay((n) => n + 1)}
        className="h-8 rounded-md border border-line px-3 text-xs text-fg-muted focus-visible:ring-2 focus-visible:ring-accent"
      >
        Replay
      </button>
    </div>
  )
}
