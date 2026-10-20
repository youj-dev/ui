import type { ReactNode } from 'react'
import { InstallTabs } from './install-tabs'

/**
 * Placeholder body for a page that's mapped but not written yet. When the item
 * already ships (`name` is a registry item), it's installable today, so say so.
 */
export function ComingSoon({ name, children }: { name?: string; children?: ReactNode }) {
  return (
    <>
      <div className="not-prose relative my-6 overflow-hidden rounded-xl border border-dashed border-line-strong p-6">
        <div aria-hidden className="dot-grid absolute inset-0 opacity-60 [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
        <div className="relative max-w-lg">
          <p className="type-label">Coming soon</p>
          {/* A div, not a p: MDX wraps multi-line children in their own paragraph. */}
          <div className="mt-2.5 text-[15px] leading-relaxed text-pretty text-fg [&_code]:code-inline [&_p]:m-0">
            {children ?? 'The full page, with a live preview, props and a motion spec, is on the way.'}
          </div>
          {name && (
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg-muted">
              It already ships: install it below, or study it in Storybook with <code className="code-inline">pnpm storybook</code>.
            </p>
          )}
        </div>
      </div>
      {name && <InstallTabs name={name} />}
    </>
  )
}
