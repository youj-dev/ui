import { IntentLink } from '@/components/site/intent-link'
import { cn } from '@/lib/cn'

/**
 * A screen's "Works in Create" mark (taxonomy.json's inApp), under its preview
 * on a Screens page, in the stability label's square chip: it opens Create
 * with the screen added to the frame. Static: nothing to reduce.
 */
export function CreateBadge({ screen, className }: { screen: string; className?: string }) {
  return (
    <IntentLink
      href={`/create?screens=${encodeURIComponent(screen)}`}
      title="Add this screen to an app frame in Create: it sits in the frame as one of its pages."
      data-create-screen={screen}
      className={cn(
        "relative inline-flex h-6 w-fit shrink-0 items-center gap-1 rounded-sm bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] px-2 type-label leading-none text-[color-mix(in_oklab,var(--color-accent)_75%,var(--color-fg))] transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-[color-mix(in_oklab,var(--color-accent)_22%,transparent)] focus-ring touch:before:absolute touch:before:-inset-x-1 touch:before:-inset-y-2.5 touch:before:content-['']",
        className,
      )}
    >
      Works in Create
    </IntentLink>
  )
}
