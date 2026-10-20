'use client'

import { AlignLeftIcon, BoldIcon, ListIcon, useIconState } from '@youj/icons'

const tool =
  'grid size-8 place-items-center rounded-md text-fg-muted transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-raised hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none aria-pressed:bg-raised aria-pressed:text-fg'

const TASKS = ['Ship the pricing page', 'Record the launch demo', 'Update the changelog']

export default function IconEditor() {
  // Each toolbar button is a pressed toggle, and each icon shows the state it sets.
  const bold = useIconState({ label: 'Bold' })
  const center = useIconState({ label: 'Center' })
  const checklist = useIconState({ label: 'Checklist' })

  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface">
      <div role="group" aria-label="Formatting" className="flex gap-0.5 border-b border-line p-1.5">
        <button {...bold.buttonProps} className={tool}>
          <BoldIcon {...bold.iconProps} size={16} strokeWidth={1.75} />
        </button>
        <button {...center.buttonProps} className={tool}>
          <AlignLeftIcon {...center.iconProps} size={16} strokeWidth={1.75} />
        </button>
        <button {...checklist.buttonProps} className={tool}>
          <ListIcon {...checklist.iconProps} size={16} strokeWidth={1.75} />
        </button>
      </div>
      <div className={`px-5 py-4 text-sm text-fg ${center.active ? 'text-center' : ''}`}>
        <p className={bold.active ? 'font-semibold' : undefined}>Launch week</p>
        <ul className="mt-2 space-y-1.5 text-fg-muted">
          {TASKS.map((task) => (
            <li key={task} className={`flex items-center gap-2 ${center.active ? 'justify-center' : ''}`}>
              <span
                aria-hidden
                className={checklist.active ? 'size-3.5 rounded-[4px] border border-line-strong' : 'size-1 rounded-full bg-fg-muted'}
              />
              {task}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
