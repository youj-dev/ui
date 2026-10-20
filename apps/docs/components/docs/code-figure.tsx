import type { ComponentProps } from 'react'
import { CopyButton } from '@/components/ui/copy-button'
import { cn } from '@/lib/cn'

/** Highlighted code in its frame: a title bar with the copy button, or the button alone over the code. Holds no server imports, so a client view can draw it too. */
export function CodeFigure({ title, children, className, style, ...props }: ComponentProps<'pre'>) {
  return (
    <figure data-copy-root className="not-prose group/code code-figure">
      {title ? (
        <figcaption className="flex h-10 items-center gap-2 border-b border-line ps-4 pe-1.5 type-small text-fg-muted">
          <span className="flex-1 truncate">{title}</span>
          <CopyButton label="Copy code" />
        </figcaption>
      ) : (
        <CopyButton label="Copy code" className="absolute end-1.5 top-1.5 z-10 bg-surface/80 youj-allow-glass backdrop-blur-sm" />
      )}
      <pre className={cn(className, 'code-pre')} style={style} {...props}>
        {children}
      </pre>
    </figure>
  )
}
