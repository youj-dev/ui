'use client'

import { useState } from 'react'
import { PresenceItem, PresenceList, Reveal, SlidingIndicator } from '@youj/motion'
import { SharedElement } from '@youj/motion/interactions'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { initials, type BlogCopy, type Post } from './data'
import { Cover } from './cover'
import { PostLink } from './post-link'

function Meta({ post, copy }: { post: Post; copy: BlogCopy }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-ui-sm text-fg-muted">
      <span className="font-medium text-accent-text">{post.category}</span>
      <span aria-hidden>·</span>
      <span>{post.author}</span>
      <span aria-hidden>·</span>
      <span className="tabular-nums">{copy.minRead(post.minutes)}</span>
    </p>
  )
}

function Index({ posts, copy, name, onOpen }: { posts: [Post, ...Post[]]; copy: BlogCopy; name: string; onOpen: (id: string) => void }) {
  const [category, setCategory] = useState<string | null>(null)
  const [featured, ...rest] = posts
  const categories = [...new Set(posts.map((p) => p.category))]
  const shown = rest.filter((p) => category === null || p.category === category)
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-14 px-4 pt-10 pb-24 md:px-8 md:pt-14">
      <h1 className="sr-only">{name}</h1>
      <Reveal inView={false} as="article" aria-labelledby="featured-title" className="group grid items-center gap-6 md:grid-cols-[1.15fr_1fr] md:gap-12">
        <PostLink post={featured} onOpen={onOpen} cover className="block">
          <SharedElement name={`cover-${featured.id}`}>
            <Cover post={featured} large className="aspect-[4/3] transition-transform yj-duration-slow ease-standard group-hover:scale-[1.01] reduced:transition-none" />
          </SharedElement>
        </PostLink>
        <div className="flex flex-col gap-4">
          <p className="text-ui-sm font-medium tracking-wide text-accent-text uppercase">{copy.featured}</p>
          <h2 id="featured-title" className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-5xl">
            <PostLink post={featured} onOpen={onOpen} className="hover:text-accent-text">
              {featured.title}
            </PostLink>
          </h2>
          <p className="max-w-[46ch] text-lg leading-relaxed text-fg-muted">{featured.dek}</p>
          <div className="flex items-center gap-3 pt-2">
            <Avatar size="sm">
              <AvatarFallback>{initials(featured.author)}</AvatarFallback>
            </Avatar>
            <p className="text-ui-sm">
              <span className="font-medium text-fg">{featured.author}</span>
              <span className="text-fg-muted">
                {' '}
                · {featured.date} · {copy.minRead(featured.minutes)}
              </span>
            </p>
          </div>
        </div>
      </Reveal>

      <section aria-labelledby="latest" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line">
          <h2 id="latest" className="pb-3 text-ui-lg font-semibold tracking-tight">
            {copy.latest}
          </h2>
          <div role="group" aria-label={copy.filter} className="relative isolate -mb-px flex gap-1 overflow-x-auto">
            {[null, ...categories].map((c) => (
              <button
                key={c ?? ''}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className="focus-ring shrink-0 rounded-sm px-2.5 pt-1 pb-3 text-ui text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg aria-pressed:text-fg"
              >
                {c ?? copy.all}
              </button>
            ))}
            <SlidingIndicator variant="underline" className="bg-accent" />
          </div>
        </div>
        {/* Every post's height at 100%: a category's fewer posts never shrink the page. */}
        <div className="min-h-198">
          <PresenceList as="div" className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((post) => (
              <PresenceItem as="article" key={post.id} aria-labelledby={`title-${post.id}`} className="group flex flex-col gap-4">
                <PostLink post={post} onOpen={onOpen} cover className="block">
                  <SharedElement name={`cover-${post.id}`}>
                    <Cover post={post} className="aspect-[3/2] transition-transform yj-duration-slow ease-standard group-hover:scale-[1.015] reduced:transition-none" />
                  </SharedElement>
                </PostLink>
                <Meta post={post} copy={copy} />
                <h3 id={`title-${post.id}`} className="text-xl leading-snug font-semibold tracking-tight text-balance">
                  <PostLink post={post} onOpen={onOpen} className="hover:text-accent-text">
                    {post.title}
                  </PostLink>
                </h3>
                <p className="line-clamp-3 text-ui leading-relaxed text-fg-muted">{post.dek}</p>
              </PresenceItem>
            ))}
          </PresenceList>
          {shown.length === 0 && <p className="py-10 text-center text-ui text-fg-muted">{copy.emptyCategory(category ?? copy.all)}</p>}
        </div>
      </section>
    </main>
  )
}

export { Index }
