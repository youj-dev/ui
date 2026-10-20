'use client'

import { createContext, useContext } from 'react'
import type { CommentThreadCopy, CommentThreadPerson } from './data'
import type { PeopleByHandle } from './markdown'
import type { Discussion } from './use-discussion'

/** What a thread's parts share: who's who, the words, the clock and the discussion's actions. */
export interface DiscussionContextValue {
  people: readonly CommentThreadPerson[]
  byHandle: PeopleByHandle
  byId: ReadonlyMap<string, CommentThreadPerson>
  user: CommentThreadPerson
  copy: CommentThreadCopy
  locale: string
  /** The clock; null before the browser's is known (times show as UTC dates). */
  now: number | null
  /** The emoji a comment can get. */
  palette: readonly string[]
  discussion: Discussion
  /** Copies a comment's link (the app's, or this page with the comment's anchor). */
  copyLink: (commentId: string) => void
  /** Asks before deleting. */
  confirmDelete: (commentId: string) => void
}

export const DiscussionContext = createContext<DiscussionContextValue | null>(null)

export function useDiscussionContext() {
  const value = useContext(DiscussionContext)
  if (!value) throw new Error('A comment thread part must be inside its block')
  return value
}
