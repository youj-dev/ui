import { useRef, type KeyboardEvent } from 'react'

/**
 * Enter-to-send that never cuts an IME composition short. Composing Japanese,
 * Chinese or Korean, Enter commits the candidate, and must not send. Browsers
 * disagree on how they say so: `isComposing` on the keydown (Chrome,
 * Firefox), keyCode 229 on the Enter that commits after compositionend
 * (Safari), so all three are checked, plus our own composition flag.
 */
export function useEnterToSubmit(onSubmit: () => void) {
  const composing = useRef(false)
  return {
    onCompositionStart: () => {
      composing.current = true
    },
    onCompositionEnd: () => {
      composing.current = false
    },
    onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== 'Enter' || event.shiftKey || event.altKey) return
      if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return
      event.preventDefault()
      onSubmit()
    },
  }
}
