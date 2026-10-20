'use client'

import { LottiePlayer } from '@youj/motion/players'

export default function LottiePlayerTriggers() {
  return (
    <div className="@container w-full max-w-2xl">
      <div className="grid gap-3 @lg:grid-cols-2">
        {/* playOnHover: forward while the pointer is over it, back in reverse from wherever it got to. */}
        <div className="flex flex-col items-center rounded-xl border border-dashed border-line-strong bg-surface px-5 py-6 text-center">
          <LottiePlayer src="/samples/upload-progress.json" playOnHover className="size-20" />
          <p className="mt-3 text-sm font-medium text-fg">Drop files to upload</p>
          <p className="mt-0.5 text-xs text-fg-muted">Hover the mark to preview it</p>
        </div>
        {/* playOnView: once, the first time it scrolls into view. */}
        <div className="flex flex-col items-center rounded-xl border border-line bg-surface px-5 py-6 text-center">
          <LottiePlayer src="/samples/logo-sting.lottie" playOnView label="Youj" className="h-20 w-36" />
          <p className="mt-3 text-sm font-medium text-fg">Made with Youj</p>
          <p className="mt-0.5 text-xs text-fg-muted">Plays once, when it scrolls into view</p>
        </div>
      </div>
    </div>
  )
}
