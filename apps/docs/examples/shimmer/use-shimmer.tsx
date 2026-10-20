'use client'

import { cn } from '@youj/core'
import { useShimmer } from '@youj/motion'
import { ArrowRightIcon, SparklesIcon } from '@youj/icons'

function UpgradeLink() {
  // The effect on an element you already have: spread rootProps, render layers first.
  const { rootProps, layers } = useShimmer<HTMLAnchorElement>({ idle: 'visible', speed: 'slow' })
  return (
    <a
      href="#pricing"
      {...rootProps}
      className={cn(
        rootProps.className,
        'inline-flex h-7 items-center rounded-full bg-surface px-3 text-xs font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
      )}
    >
      {layers}
      {/* Content sits above the light's layers. */}
      <span className="relative z-2 inline-flex items-center gap-1.5">
        <SparklesIcon size={14} className="text-accent" />
        Try Pro free
        <ArrowRightIcon size={12} />
      </span>
    </a>
  )
}

export default function ShimmerUseShimmer() {
  return (
    <nav aria-label="Workspace" className="flex w-full max-w-xl items-center gap-4 rounded-xl border border-line bg-canvas px-3 py-2">
      <span className="flex items-center gap-2 text-sm font-medium text-fg">
        <span aria-hidden className="size-5 rounded-md bg-fg" />
        northwind
      </span>
      {['Projects', 'Usage'].map((item) => (
        <a
          key={item}
          href={`#${item.toLowerCase()}`}
          className="rounded-sm text-sm text-fg-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-accent max-sm:hidden"
        >
          {item}
        </a>
      ))}
      <span className="ms-auto">
        <UpgradeLink />
      </span>
    </nav>
  )
}
