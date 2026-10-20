'use client'

import { useId, useState } from 'react'

const SETTINGS = [
  { id: 'comments', label: 'Preview comments', detail: 'Reviewers can pin notes to any preview.' },
  { id: 'alerts', label: 'Deploy alerts', detail: 'Email the team when a production build fails.' },
]

export default function PresetsDurations() {
  const uid = useId()
  const [on, setOn] = useState<Record<string, boolean>>({ comments: true, alerts: false })

  return (
    <div className="w-full max-w-md divide-y divide-line rounded-xl border border-line bg-surface">
      {SETTINGS.map(({ id, label, detail }) => (
        <div key={id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p id={`${uid}-${id}`} className="text-sm font-medium text-fg">
              {label}
            </p>
            <p className="text-xs text-fg-muted">{detail}</p>
          </div>
          {/* A bespoke transition: yj-duration-fast is the token × Speed × --yj-motion, so it slows
              with the Speed control and turns instant under reduced motion. */}
          <button
            type="button"
            role="switch"
            aria-checked={on[id]}
            aria-labelledby={`${uid}-${id}`}
            onClick={() => setOn((s) => ({ ...s, [id]: !s[id] }))}
            className="group relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-fg-subtle p-0.5 outline-none transition-colors yj-duration-fast ease-standard focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface aria-checked:bg-accent"
          >
            <span className="size-4 rounded-full bg-canvas shadow-sm transition-transform yj-duration-fast ease-standard group-aria-checked:translate-x-4 rtl:group-aria-checked:-translate-x-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
