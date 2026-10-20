'use client'

import { useFrame } from '../blocks/frame/shell'
import { AppPage } from '../components/ui/app-page'
import { cn } from '../lib/utils'

/* The page a frame sidebar's story sits beside: the page's own name, which
 * follows the nav (so following the sidebar visibly goes somewhere), over
 * quiet shapes with no words, so the eye goes to the sidebar. Stories and the
 * docs only; it never ships with a block. */

const bar = 'block rounded-full bg-[color-mix(in_oklab,var(--color-fg)_9%,transparent)]'

export function DemoAppPage() {
  const { trail } = useFrame()
  const title = (trail?.child ?? trail?.item)?.label
  return (
    <AppPage title={title} className="min-h-[calc(100dvh-4rem)]" classNames={{ body: 'flex-1' }}>
      <div aria-hidden className="flex flex-1 flex-col gap-4 @3xl:gap-5">
        <span className={cn(bar, '-mt-1 h-2.5 w-80 max-w-full')} />
        <div className="grid gap-4 @3xl:grid-cols-3 @3xl:gap-5">
          {[16, 20, 12].map((w, i) => (
            <div key={i} className="flex h-28 flex-col justify-end gap-2.5 rounded-xl border border-line bg-surface p-4">
              <span className={cn(bar, 'h-2 w-20')} />
              <span className={cn(bar, 'h-5')} style={{ width: `${w * 4}px` }} />
            </div>
          ))}
        </div>
        <div className="flex min-h-64 flex-1 flex-col gap-3.5 rounded-xl border border-line bg-surface p-5">
          {[38, 92, 78, 85, 64, 72, 58].map((w, i) => (
            <span key={i} className={cn(bar, i ? 'h-2.5' : 'mb-2 h-3')} style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </AppPage>
  )
}
