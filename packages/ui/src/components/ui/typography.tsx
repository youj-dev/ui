import type { ComponentProps } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cn } from '../../lib/utils'

/* shadcn's typography set as components: headings, body, lead, blockquote,
 * inline code and lists, in youj's long-form voice (the one the docs site
 * reads in). Headings are tight and set in the foreground ink; body copy is
 * a comfortable 15px at a 1.75 line height; links underline in a quiet tint
 * of the accent that fills in on hover; lists mark items with the brand's
 * square particle, and numbered lists count in mono. Vertical rhythm is the
 * `:not(:first-child)` margin shadcn uses, so a heading or paragraph that
 * opens a container sits flush. Nothing moves except a link's underline
 * color, on the fast token. */

const link =
  '[&_a]:font-medium [&_a]:text-fg [&_a]:underline [&_a]:decoration-accent-line [&_a]:decoration-1 [&_a]:underline-offset-3 [&_a]:transition-[text-decoration-color] [&_a]:yj-duration-fast [&_a]:ease-standard [&_a:hover]:decoration-accent [&_a]:focus-ring [&_a]:rounded-xs'

function TypographyH1({ className, ...props }: ComponentProps<'h1'>) {
  return (
    <h1
      data-slot="typography-h1"
      className={cn('scroll-m-20 own:text-4xl own:font-semibold own:tracking-[-0.035em] text-balance own:text-fg', className)}
      {...props}
    />
  )
}

function TypographyH2({ className, ...props }: ComponentProps<'h2'>) {
  return (
    <h2
      data-slot="typography-h2"
      className={cn(
        'scroll-m-20 own:text-2xl own:leading-tight own:font-semibold own:tracking-[-0.025em] own:text-fg [&:not(:first-child)]:mt-10',
        className,
      )}
      {...props}
    />
  )
}

function TypographyH3({ className, ...props }: ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="typography-h3"
      className={cn('scroll-m-20 own:text-lg own:leading-snug own:font-semibold own:tracking-[-0.015em] own:text-fg [&:not(:first-child)]:mt-8', className)}
      {...props}
    />
  )
}

function TypographyH4({ className, ...props }: ComponentProps<'h4'>) {
  return (
    <h4
      data-slot="typography-h4"
      className={cn('scroll-m-20 own:text-base own:leading-6 own:font-semibold own:text-fg [&:not(:first-child)]:mt-6', className)}
      {...props}
    />
  )
}

function TypographyP({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="typography-p"
      className={cn('own:text-[0.9375rem] own:leading-7 own:text-fg [&:not(:first-child)]:mt-5', link, className)}
      {...props}
    />
  )
}

/** The paragraph under a title: larger and quieter. */
function TypographyLead({ className, ...props }: ComponentProps<'p'>) {
  return <p data-slot="typography-lead" className={cn('own:text-lg own:leading-7 text-pretty own:text-fg-muted', link, className)} {...props} />
}

/** Emphasized text that isn't a heading: a price, a callout's first line. */
function TypographyLarge({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="typography-large" className={cn('own:text-ui-lg own:font-semibold own:text-fg', className)} {...props} />
}

/** Fine print that still reads as content: a label, a caption. */
function TypographySmall({ className, ...props }: ComponentProps<'small'>) {
  return <small data-slot="typography-small" className={cn('own:text-ui-sm own:leading-none own:font-medium own:text-fg', className)} {...props} />
}

/** Secondary text: helper copy, metadata. */
function TypographyMuted({ className, ...props }: ComponentProps<'p'>) {
  return <p data-slot="typography-muted" className={cn('own:text-ui-sm own:text-fg-muted', link, className)} {...props} />
}

function TypographyBlockquote({ className, ...props }: ComponentProps<'blockquote'>) {
  return (
    <blockquote
      data-slot="typography-blockquote"
      className={cn('border-s-2 border-line-strong ps-4 own:text-[0.9375rem] own:leading-7 own:text-fg-muted [&:not(:first-child)]:mt-5', link, className)}
      {...props}
    />
  )
}

function TypographyInlineCode({ className, ...props }: ComponentProps<'code'>) {
  return (
    <code
      data-slot="typography-inline-code"
      className={cn('rounded-sm border border-line bg-well px-[0.375em] py-[0.125em] own:font-mono own:text-[0.84em] own:text-fg', className)}
      {...props}
    />
  )
}

type TypographyListProps =
  | ({ ordered?: false } & ComponentProps<'ul'>)
  | ({ /** Number the items (an `<ol>`), counted in mono. Default false. */ ordered: true } & ComponentProps<'ol'>)

/** A bulleted list (square markers) or, with `ordered`, a numbered one. Items are plain `<li>`. */
function TypographyList({ className, ordered, ...props }: TypographyListProps) {
  const classes = cn(
    'list-none own:text-[0.9375rem] own:leading-7 own:text-fg [&:not(:first-child)]:mt-5 [&>li]:relative [&>li+li]:mt-1.5',
    ordered
      ? 'ps-6.5 [counter-reset:typography-ol] [&>li]:[counter-increment:typography-ol] [&>li]:before:absolute [&>li]:before:-start-6.5 [&>li]:before:top-[0.3em] [&>li]:before:font-mono [&>li]:before:text-[11px] [&>li]:before:leading-[1.75] [&>li]:before:font-medium [&>li]:before:text-fg-muted [&>li]:before:content-[counter(typography-ol,decimal-leading-zero)]'
      : "ps-5.5 [&>li]:before:absolute [&>li]:before:-start-4.5 [&>li]:before:top-[0.72em] [&>li]:before:size-1.25 [&>li]:before:rounded-[1px] [&>li]:before:bg-line-strong [&>li]:before:content-['']",
    link,
    className,
  )
  // list-none drops the list role in Safari (VoiceOver); role="list" restores it.
  return ordered ? (
    <ol data-slot="typography-list" role="list" className={classes} {...(props as ComponentProps<'ol'>)} />
  ) : (
    <ul data-slot="typography-list" role="list" className={classes} {...(props as ComponentProps<'ul'>)} />
  )
}

/**
 * The short label over a figure, a group or a section: "Month-to-date spend",
 * "Included usage", "Status". Naming it lets a component style give every one
 * the same voice: Classic draws it as small muted text (your classes win, so
 * a label keeps the look it had), Bezel as mono capitals. It's a span; pass
 * `render` for another element, e.g. `render={<h2 />}` for a section.
 */
function Eyebrow({ className, render, ...props }: useRender.ComponentProps<'span'>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>({ className: cn('own:text-ui-sm own:text-fg-muted', className) }, props),
    render,
    state: { slot: 'eyebrow' },
  })
}

export {
  Eyebrow,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyP,
  TypographyLead,
  TypographyLarge,
  TypographySmall,
  TypographyMuted,
  TypographyBlockquote,
  TypographyInlineCode,
  TypographyList,
  type TypographyListProps,
}
