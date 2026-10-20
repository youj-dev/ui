'use client'

import { cn } from '../../../lib/utils'
import type { Post } from './data'

/** Editorial covers drawn from the theme: accent fields, paper and ink. */
function Cover({ post, className, large }: { post: Post; className?: string; large?: boolean }) {
  const glyph = cn('absolute font-semibold leading-none tracking-tight select-none', large ? 'text-[9rem] md:text-[12rem]' : 'text-7xl')
  return (
    <div aria-hidden className={cn('relative isolate overflow-hidden rounded-sm', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- copy-in blocks run in Vite too */}
      {post.image && <img src={post.image} alt="" className="absolute inset-0 size-full object-cover" />}
      {!post.image && (post.cover ?? 'orbit') === 'orbit' && (
        <div className="absolute inset-0 bg-accent">
          <div className="absolute -end-[15%] -top-[25%] aspect-square w-[70%] rounded-full border border-on-accent/30 youj-allow-tint" />
          <div className="absolute -end-[5%] -top-[10%] aspect-square w-[45%] rounded-full bg-on-accent/15 youj-allow-tint" />
          <span className={cn(glyph, 'start-[8%] bottom-[6%] text-on-accent')}>{post.glyph}</span>
        </div>
      )}
      {!post.image && post.cover === 'split' && (
        <div className="absolute inset-0 grid grid-cols-2">
          <div className="bg-fg" />
          <div className="bg-accent" />
          <span className={cn(glyph, 'inset-x-0 top-1/2 -translate-y-1/2 text-center text-canvas')}>{post.glyph}</span>
        </div>
      )}
      {!post.image && post.cover === 'stripes' && (
        <div className="absolute inset-0 bg-surface bg-[repeating-linear-gradient(135deg,var(--color-accent)_0_2px,transparent_2px_14px)]">
          <span className={cn(glyph, 'end-[8%] bottom-[8%] rounded-sm bg-canvas px-3 py-2 text-fg')}>{post.glyph}</span>
        </div>
      )}
      {!post.image && post.cover === 'grid' && (
        <div className="absolute inset-0 bg-fg bg-[linear-gradient(var(--color-canvas)_1px,transparent_1px),linear-gradient(90deg,var(--color-canvas)_1px,transparent_1px)] bg-size-[2rem_2rem] [background-position:-1px_-1px]">
          <div className="absolute inset-0 bg-fg" />
          <span className={cn(glyph, 'start-[10%] top-[12%] text-accent')}>{post.glyph}</span>
        </div>
      )}
    </div>
  )
}

export { Cover }
