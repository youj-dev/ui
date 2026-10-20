import type { CSSProperties, ReactNode } from 'react'

/* A window on the stage: the frame a real app sits in, at the size it would
 * be on a laptop. The examples and blocks are full-page layouts sized in
 * viewport units; inside a window its content box is their viewport
 * (promo.css maps dvh/svh and the sidebar's height onto --window-h). */

export const TITLE_BAR = 36

export interface WindowProps {
  width: number
  height: number
  /** `app`: traffic lights and a title. `browser`: traffic lights and an address. `none`: a bare surface. */
  chrome?: 'app' | 'browser' | 'none'
  title?: string
  url?: string
  className?: string
  style?: CSSProperties
  /** Extra classes on the content box (the app's viewport). */
  contentClassName?: string
  children: ReactNode
}

export function Window({ width, height, chrome = 'app', title, url, className, style, contentClassName, children }: WindowProps) {
  const bar = chrome === 'none' ? 0 : TITLE_BAR
  const inner = height - bar
  return (
    <div
      className={`absolute flex flex-col overflow-hidden rounded-[12px] border border-line bg-canvas ${className ?? ''}`}
      style={{
        width,
        height,
        boxShadow:
          '0 0 0 1px color-mix(in oklab, var(--color-canvas) 60%, transparent), 0 2px 6px -2px color-mix(in oklab, var(--color-shadow) 40%, transparent), 0 32px 80px -24px color-mix(in oklab, var(--color-shadow) 75%, transparent)',
        ...style,
      }}
    >
      {bar > 0 && (
        <div
          className="relative flex shrink-0 items-center border-b border-line bg-surface px-3.5"
          style={{ height: bar }}
        >
          <span aria-hidden className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-[11px] rounded-full bg-line-strong" />
            ))}
          </span>
          {chrome === 'browser' ? (
            <span className="absolute inset-x-0 mx-auto flex h-6 w-[min(26rem,55%)] items-center justify-center gap-1.5 rounded-md bg-field text-[11.5px] text-fg-muted">
              <svg aria-hidden viewBox="0 0 16 16" className="size-3 text-fg-subtle" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
                <path d="M5.5 7V5.25a2.5 2.5 0 0 1 5 0V7" />
              </svg>
              {url}
            </span>
          ) : (
            title && <span className="absolute inset-x-0 text-center text-[12px] font-medium text-fg-muted">{title}</span>
          )}
        </div>
      )}
      <div
        data-window=""
        className={`relative min-h-0 flex-1 overflow-hidden ${contentClassName ?? ''}`}
        style={{ '--window-h': `${inner}px`, '--window-w': `${width - 2}px` } as CSSProperties}
      >
        {children}
      </div>
    </div>
  )
}
