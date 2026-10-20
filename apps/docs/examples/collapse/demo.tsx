'use client'

import { useId, useState } from 'react'
import { Collapse } from '@youj/motion'
import { ChevronDownIcon, SlidersIcon } from '@youj/icons'

const GROUPS = [
  { legend: 'Environment', options: ['Production', 'Preview', 'Development'] },
  { legend: 'Status', options: ['Ready', 'Building', 'Error', 'Canceled'] },
]
const COMMITS = ['a41f9e2 Tighten cache headers', '9c02b1d Debounce the search query', '77e1a08 Keep the return path on sign-in']

const chip =
  'rounded-full border border-line px-2.5 py-1 text-xs text-fg-muted outline-none transition-colors yj-duration-fast ease-standard hover:text-fg aria-pressed:border-accent aria-pressed:text-fg focus-visible:ring-2 focus-visible:ring-accent'

export default function CollapseDemo() {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState(['Production', 'Ready'])
  const toggle = (value: string) => setPicked((p) => (p.includes(value) ? p.filter((v) => v !== value) : [...p, value]))

  return (
    <div className="flex min-h-[340px] w-full max-w-lg flex-col">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm font-medium text-fg">Deployments</p>
          {/* The trigger owns the state and points at the panel it controls. */}
          <button
            type="button"
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs font-medium text-fg-muted outline-none transition-colors yj-duration-fast ease-standard hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"
          >
            <SlidersIcon size={14} />
            Filters
            <span className={`inline-flex transition-transform yj-duration-base ease-standard ${open ? 'rotate-180' : ''}`}>
              <ChevronDownIcon size={14} trigger="none" />
            </span>
          </button>
        </div>

        <Collapse id={id} open={open}>
          <div className="grid gap-4 border-t border-line p-4">
            {GROUPS.map(({ legend, options }) => (
              <fieldset key={legend}>
                <legend className="mb-2 text-xs font-medium text-fg-muted">{legend}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {options.map((option) => (
                    <button key={option} type="button" aria-pressed={picked.includes(option)} onClick={() => toggle(option)} className={chip}>
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </Collapse>

        {/* The list below moves with the panel's height instead of jumping. */}
        <ul className="border-t border-line">
          {COMMITS.map((commit) => (
            <li key={commit} className="border-b border-line px-4 py-2.5 font-mono text-[13px] text-fg-muted last:border-b-0">
              {commit}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
