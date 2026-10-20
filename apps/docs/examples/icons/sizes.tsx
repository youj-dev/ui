'use client'

import { SettingsIcon } from '@youj/icons'

// Size and stroke that sit well with each control height and type size.
const CONTROLS = [
  { icon: 14, stroke: 1.75, className: 'h-6 gap-1 px-2 text-xs' },
  { icon: 16, stroke: 1.75, className: 'h-8 gap-1.5 px-3 text-sm' },
  { icon: 20, stroke: 1.5, className: 'h-10 gap-2 px-4 text-base' },
]

const DISPLAY = [
  { icon: 24, stroke: 1.5 },
  { icon: 32, stroke: 1.5 },
  { icon: 48, stroke: 1.25 },
]

const caption = 'font-mono text-[11px] text-fg-muted'

export default function IconSizes() {
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-10">
      <div className="flex flex-wrap items-end justify-center gap-5">
        {CONTROLS.map(({ icon, stroke, className }) => (
          <figure key={icon} className="flex flex-col items-center gap-2.5">
            <button
              type="button"
              className={`inline-flex items-center rounded-lg border border-line bg-surface font-medium text-fg transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${className}`}
            >
              <SettingsIcon size={icon} strokeWidth={stroke} />
              Settings
            </button>
            <figcaption className={caption}>
              {icon}px · {stroke}
            </figcaption>
          </figure>
        ))}
      </div>
      {/* Not in a control: data-yj-trigger makes each figure the hover target. */}
      <div className="flex items-end gap-8 text-fg">
        {DISPLAY.map(({ icon, stroke }) => (
          <figure key={icon} data-yj-trigger className="flex flex-col items-center gap-2.5">
            <SettingsIcon size={icon} strokeWidth={stroke} />
            <figcaption className={caption}>
              {icon}px · {stroke}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
