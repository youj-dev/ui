'use client'

import type { ReactNode } from 'react'
import { ArrowLeftIcon, ArrowRightIcon, LinkIcon } from '@youj/icons'
import { SharedElement } from '@youj/motion/interactions'
import { AnchorNav } from '../../../components/ui/anchor-nav'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { initials, SECTIONS, type BlogCopy, type Post } from './data'
import { Cover } from './cover'
import { PostLink } from './post-link'

interface ArticleProps {
  post: Post
  posts: Post[]
  copy: BlogCopy
  onOpen: (id: string) => void
  onBack: () => void
  /** Your body (MDX, say) in place of the post's sections; the table of contents still lists `post.sections` when given. */
  renderArticle?: (post: Post) => ReactNode
}

function Article({ post, posts, copy, onOpen, onBack, renderArticle }: ArticleProps) {
  const next = posts.length > 1 ? posts[(posts.indexOf(post) + 1) % posts.length] : undefined
  const sections = post.sections ?? (renderArticle ? [] : SECTIONS)
  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 pb-24 md:px-8">
      <Button variant="ghost" size="sm" className="-ms-2 mb-8" onClick={onBack}>
        <ArrowLeftIcon size={14} className="rtl:-scale-x-100" /> {copy.allNotes}
      </Button>
      <article aria-labelledby="article-title">
        <header className="flex max-w-3xl flex-col gap-5">
          <p className="text-ui-sm font-medium tracking-wide text-accent-text uppercase">{post.category}</p>
          <h1 id="article-title" className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-6xl">
            {post.title}
          </h1>
          <p className="text-xl leading-relaxed text-fg-muted">{post.dek}</p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Avatar>
              <AvatarFallback>{initials(post.author)}</AvatarFallback>
            </Avatar>
            <div className="me-auto flex flex-col text-ui-sm">
              <span className="font-medium text-fg">{post.author}</span>
              <span className="text-fg-muted">
                {[post.role, <time key="date">{post.date}</time>, copy.minRead(post.minutes)].filter(Boolean).map((part, i) => (
                  <span key={i}>
                    {i > 0 && ' · '}
                    {part}
                  </span>
                ))}
              </span>
            </div>
            <AsyncButton
              variant="outline"
              size="sm"
              successLabel={copy.linkCopied}
              errorLabel={copy.copyError}
              onAction={() => navigator.clipboard?.writeText(`${location.origin}${location.pathname}#${post.id}`)}
            >
              <LinkIcon size={14} /> {copy.copyLink}
            </AsyncButton>
          </div>
        </header>
        <SharedElement name={`cover-${post.id}`} className="my-10">
          <Cover post={post} large className="aspect-[16/9] md:aspect-[21/9]" />
        </SharedElement>
        <div className="grid gap-12 lg:grid-cols-[1fr_13rem]">
          <div className="flex max-w-[65ch] flex-col gap-6 text-lg leading-[1.75] text-fg">
            {renderArticle
              ? renderArticle(post)
              : sections.map((s, i) => (
                  <section key={s.id} aria-labelledby={s.id} className="flex flex-col gap-5">
                    <h2 id={s.id} className="scroll-mt-24 pt-4 text-2xl font-semibold tracking-tight text-fg">
                      {s.heading}
                    </h2>
                    {s.body.map((p) => (
                      <p key={p.slice(0, 20)}>{p}</p>
                    ))}
                    {i === 1 && post.quote && (
                      <blockquote className="my-4 border-s-2 border-accent ps-6 text-3xl leading-snug font-semibold tracking-tight text-balance text-fg">
                        <p>{post.quote}</p>
                        <footer className="mt-3 text-ui font-normal tracking-normal text-fg-muted">{post.author}</footer>
                      </blockquote>
                    )}
                  </section>
                ))}
          </div>
          {sections.length > 0 && (
            <aside className="hidden lg:block">
              <AnchorNav items={sections.map((s) => ({ id: s.id, label: s.heading }))} offset={80} className="sticky top-24" />
            </aside>
          )}
        </div>
      </article>
      {next && (
        <aside aria-label={copy.nextRead} className="mt-20 border-t border-line pt-10">
          <PostLink post={next} onOpen={onOpen} className="group grid items-center gap-6 sm:grid-cols-[14rem_1fr]">
            <Cover post={next} className="aspect-[3/2]" />
            <span className="flex flex-col gap-2">
              <span className="text-ui-sm font-medium tracking-wide text-fg-muted uppercase">{copy.nextRead}</span>
              <span className="text-2xl leading-snug font-semibold tracking-tight text-balance group-hover:text-accent-text">{next.title}</span>
              <span className="flex items-center gap-1.5 text-ui text-accent-text">
                {copy.readNote} <ArrowRightIcon size={14} className="transition-transform yj-duration-fast ease-standard group-hover:translate-x-0.5 rtl:-scale-x-100" />
              </span>
            </span>
          </PostLink>
        </aside>
      )}
    </main>
  )
}

export { Article }
