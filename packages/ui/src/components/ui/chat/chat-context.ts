import { createContext, useContext } from 'react'

/** What a ChatMessageList offers the messages inside it. Stable for the list's lifetime. */
export interface ChatListContextValue {
  /** Speaks a message through the list's live regions: polite by default, assertive for failures. */
  announce: (message: string, politeness?: 'polite' | 'assertive') => void
  /** True once the list has mounted: a message mounting after that is new, not history. */
  isSettled: () => boolean
}

export const ChatListContext = createContext<ChatListContextValue | null>(null)

/** The surrounding ChatMessageList, or null when a message stands alone. */
export function useChatList(): ChatListContextValue | null {
  return useContext(ChatListContext)
}

/** A ChatMessageList's scrolling, for what renders inside it (a virtualizer, a custom jump). */
export interface ChatMessageListHandle {
  /** Brings the latest message into view and sticks to the bottom again. */
  scrollToBottom: (behavior?: 'smooth' | 'instant') => void
  /** The element that scrolls, once mounted: a virtualizer's scroll element. */
  viewport: HTMLElement | null
}

export const ChatScrollContext = createContext<ChatMessageListHandle | null>(null)

/** True inside a ChatMessage, which announces its own progress: blocks inside it stay quiet. */
export const InMessageContext = createContext(false)
