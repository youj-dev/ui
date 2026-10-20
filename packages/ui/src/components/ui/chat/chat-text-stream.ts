import { useSyncExternalStore } from 'react'

/* Streamed text as an external store (React's useSyncExternalStore contract).
 * Hand a message a source instead of a string and each token re-renders only
 * the text that reads it: not the message around it, not its siblings, not
 * the list. Any object with these two methods works, e.g. a wrapper around an
 * SDK's stream. */

export interface ChatTextSource {
  /** The text so far. Must return the same string until the text changes. */
  getSnapshot(): string
  /** Calls `listener` after every change and returns the unsubscribe. */
  subscribe(listener: () => void): () => void
}

export interface ChatTextStream extends ChatTextSource {
  /** Adds a token to the end. */
  append(chunk: string): void
  /** Replaces the text. */
  set(text: string): void
}

/** A minimal ChatTextSource you can write to: `stream.append(token)`. */
export function createTextStream(initial = ''): ChatTextStream {
  let text = initial
  const listeners = new Set<() => void>()
  const emit = () => {
    for (const listener of listeners) listener()
  }
  return {
    getSnapshot: () => text,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    append(chunk) {
      if (!chunk) return
      text += chunk
      emit()
    },
    set(next) {
      if (next === text) return
      text = next
      emit()
    },
  }
}

export type ChatText = string | ChatTextSource

export function isTextSource(value: unknown): value is ChatTextSource {
  return typeof value === 'object' && value !== null && 'getSnapshot' in value && 'subscribe' in value
}

/** The current text of a string or a source, read once (for copy, say). */
export function readText(value: ChatText | undefined): string {
  return isTextSource(value) ? value.getSnapshot() : (value ?? '')
}

const idle = () => () => {}
const nothing = () => ''

/** The text of a string or a source; a source re-renders only the caller when it changes. */
export function useChatText(value: ChatText | undefined): string {
  const source = isTextSource(value) ? value : null
  const live = useSyncExternalStore(source ? source.subscribe : idle, source ? source.getSnapshot : nothing, source ? source.getSnapshot : nothing)
  return source ? live : ((value as string | undefined) ?? '')
}
