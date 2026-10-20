'use client'

import { createContext, useContext, type ElementType, type ReactNode } from 'react'
import type { SupportAgent, SupportArticle, SupportChatCopy, SupportUser } from './data'

/** What every part reads: the strings, who's talking, the help articles and how to link them. */
export interface SupportChatEnv {
  copy: SupportChatCopy
  brand: { name: string; logo?: ReactNode }
  /** The assistant's name. */
  bot: string
  user: SupportUser
  team: SupportAgent[]
  articles: SupportArticle[]
  articleHref: (article: SupportArticle) => string
  linkComponent: ElementType
}

export const SupportChatContext = createContext<SupportChatEnv | null>(null)

export const useSupportChat = () => useContext(SupportChatContext)!
