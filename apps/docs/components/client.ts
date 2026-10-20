'use client'

/* Client boundary for package components that use hooks but ship without a
 * 'use client' directive (registry source stays framework-neutral), so server
 * components and MDX can render them. A server component that imports one
 * export of a client module ships all of its exports, so this file holds only
 * what's small: the lockup and icons. Anything heavier gets a boundary of its
 * own (components/aurora.ts, components/mdx-lazy.tsx). */

export { YoujLockup } from '@youj/core/docs/brand/youj-logo'
export { AlertTriangleIcon } from '@youj/icons/components/youj/icons/alert-triangle'
export { ArrowLeftIcon } from '@youj/icons/components/youj/icons/arrow-left'
export { ArrowRightIcon } from '@youj/icons/components/youj/icons/arrow-right'
export { DownloadIcon } from '@youj/icons/components/youj/icons/download'
export { GaugeIcon } from '@youj/icons/components/youj/icons/gauge'
export { InfoIcon } from '@youj/icons/components/youj/icons/info'
export { KeyboardIcon } from '@youj/icons/components/youj/icons/keyboard'
export { PackageIcon } from '@youj/icons/components/youj/icons/package'
export { ServerIcon } from '@youj/icons/components/youj/icons/server'
export { ShieldCheckIcon } from '@youj/icons/components/youj/icons/shield-check'
export { SparklesIcon } from '@youj/icons/components/youj/icons/sparkles'
