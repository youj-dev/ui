import { isValidElement, type ComponentProps, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { InstallField } from '@/components/landing/install-field'
import { parseInstall } from '@/lib/install-command'
import { AlertTriangleIcon, ArrowRightIcon, InfoIcon, SparklesIcon } from '@/components/client'
import { CardPreview } from '@/components/mdx-lazy'
import { CodeFigure } from './code-figure'
import { cn } from '@/lib/cn'
import { exampleFor } from '@/lib/examples'
import { Stage } from '@/components/site/stage'

/* Server-rendered MDX blocks: headings, code, callouts, steps and cards. */

export function Heading({ as: Tag, id, children, className, ...props }: ComponentProps<'h2'> & { as: 'h2' | 'h3' | 'h4' }) {
  if (!id) return <Tag className={className} {...props}>{children}</Tag>
  return (
    <Tag id={id} className={cn('group/heading relative', className)} {...props}>
      <a href={`#${id}`} className="not-prose heading-anchor">
        <span aria-hidden className="heading-hash">
          #
        </span>
        {children}
      </a>
    </Tag>
  )
}

/** The text of highlighted code: its spans' text, line by line. */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  return isValidElement(node) ? textOf((node.props as { children?: ReactNode }).children) : ''
}

/**
 * Fenced code from MDX, highlighted at build time by rehype-code. A block that is one install or run command
 * (`npx @youj/cli add button`, `pnpm add @youj/sound`) is the install field instead, like every command on the site:
 * the reader's package manager, a menu and a copy button. Config, output and several lines stay code.
 */
export function CodeBlock({ title, children, className, style, ...props }: ComponentProps<'pre'>) {
  const install = title ? undefined : parseInstall(textOf(children))
  if (install) {
    return (
      <div className="not-prose my-6">
        <InstallField install={install} label="Command" className="w-full" />
      </div>
    )
  }
  return (
    <CodeFigure title={title} className={className} style={style} {...props}>
      {children}
    </CodeFigure>
  )
}

const CALLOUT = {
  note: { Icon: InfoIcon, tone: 'var(--color-accent)', label: 'Note' },
  tip: { Icon: SparklesIcon, tone: 'var(--color-success)', label: 'Tip' },
  warning: { Icon: AlertTriangleIcon, tone: 'var(--color-warning)', label: 'Warning' },
  danger: { Icon: AlertTriangleIcon, tone: 'var(--color-danger)', label: 'Important' },
}

export function Callout({ type = 'note', title, children }: { type?: keyof typeof CALLOUT; title?: ReactNode; children: ReactNode }) {
  const { Icon, tone, label } = CALLOUT[type]
  return (
    <aside
      aria-label={typeof title === 'string' ? title : label}
      className="callout my-6 flex gap-3 rounded-xl border px-4 py-3.5 text-[14px] leading-relaxed"
      style={{ '--callout': tone } as CSSProperties}
    >
      <span className="mt-[3px] text-(--callout)">
        <Icon size={17} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1 [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_p]:my-2">
        {title && <p className="font-medium text-fg">{title}</p>}
        {children}
      </div>
    </aside>
  )
}

/** Numbered steps. Put a `###` heading first in each Step so it lands in the TOC. */
export function Steps({ children }: { children: ReactNode }) {
  return <div className="steps my-8">{children}</div>
}

export function Step({ children }: { children: ReactNode }) {
  return <div className="step">{children}</div>
}

export function Cards({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('doc-cards not-prose my-6 grid gap-3 sm:grid-cols-2', className)}>{children}</div>
}

/**
 * A linked card. `soon` marks work in progress. Without an `href` the card is
 * a static placeholder whose dashed outline already says "soon". When the
 * page it links to has a live demo, the card leads with it, and its text
 * shrinks to a name and one line; `demo` names one for a page that has none
 * of its own, such as a group of components, and `demo=""` keeps a card to
 * its words among others that have none either.
 */
export function Card({ title, href, children, soon = false, demo }: { title: string; href?: string; children?: ReactNode; soon?: boolean; demo?: string }) {
  const example = demo ?? exampleFor(href)
  const body = (
    <>
      {example ? (
        <Stage className="card-stage">
          <div className="relative h-full">
            <CardPreview name={example} />
          </div>
        </Stage>
      ) : (
        <Stage aria-hidden data-empty="" className="card-stage" />
      )}
      <div className="flex items-center gap-2">
        {href ? (
          // The card's one link: its ::after stretches over the whole card, so the card is the target
          // while the demo (inert) and the text stay outside the <a>.
          <Link href={href} prefetch={false} className="card-title outline-none after:absolute after:inset-0 after:rounded-[inherit]">
            {title}
          </Link>
        ) : (
          <span className="card-title">{title}</span>
        )}
        {soon ? (
          href && <span className="sidebar-badge ms-auto">soon</span>
        ) : (
          <span className="card-arrow">
            <ArrowRightIcon size={15} strokeWidth={1.75} className="rtl:-scale-x-100" />
          </span>
        )}
      </div>
      {children && (
        <div className="doc-card-text card-text">{children}</div>
      )}
    </>
  )
  const base = cn('group/card doc-card card-frame', soon ? 'border-dashed bg-transparent' : 'site-card')
  if (!href) return <div className={base}>{body}</div>
  return (
    <div data-preview={example ? '' : undefined} data-yj-trigger className={cn(base, 'card-link')}>
      {body}
    </div>
  )
}
