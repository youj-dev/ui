import type { CSSProperties } from 'react'
import { IntentLink } from '@/components/site/intent-link'
import { cn } from '@/lib/cn'
import { STABILITY, type Stability } from '@/lib/stability'

const TONE: Record<Stability, string> = {
  stable: 'var(--color-success)',
  alpha: 'var(--color-success)',
  experimental: 'var(--color-warning)',
}

/**
 * A page's stability label (stability.json), in the header's eyebrow row: a
 * small square chip tinted in its tone, the word in the row's mono capitals,
 * linking to what the labels promise. On a phone the row has no room beside the breadcrumb and
 * the page's actions, so it sits under the description instead. The word
 * is the tone mixed toward the text color, so it reads in every preset.
 * Static: nothing to reduce.
 */
export function StabilityBadge({ stability, className }: { stability: Stability; className?: string }) {
  const { label, summary } = STABILITY[stability]
  return (
    <IntentLink
      href="/docs/versioning#stability-labels"
      title={summary}
      data-stability={stability}
      style={{ '--tone': TONE[stability] } as CSSProperties}
      className={cn(
        "relative inline-flex h-6 w-fit shrink-0 items-center gap-1 rounded-sm bg-[color-mix(in_oklab,var(--tone)_14%,transparent)] px-2 type-label leading-none text-[color-mix(in_oklab,var(--tone)_75%,var(--color-fg))] transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-[color-mix(in_oklab,var(--tone)_22%,transparent)] focus-ring touch:before:absolute touch:before:-inset-x-1 touch:before:-inset-y-2.5 touch:before:content-['']",
        className,
      )}
    >
      {label}
      <span className="sr-only">: what this label means</span>
    </IntentLink>
  )
}
