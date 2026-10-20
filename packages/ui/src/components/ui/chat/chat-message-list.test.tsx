import type { ReactNode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ChatMessage } from './chat-message'
import { ChatMessageList } from './chat-message-list'
import { createTextStream } from './chat-text-stream'

/* jsdom has no layout. The viewport gets a fake geometry (a 400px window
 * onto `content.height` px, scrollTop clamped like a browser's) and resize
 * observers fire when a test says the content changed size. */
const content = { height: 400 }
const observers = new Set<{ fire: () => void }>()
const RealResizeObserver = globalThis.ResizeObserver
const tops = new WeakMap<Element, number>()
const isViewport = (el: HTMLElement) => el.dataset?.slot === 'scroll-area-viewport'
const patched = ['clientHeight', 'scrollHeight', 'scrollTop'] as const
const originals = patched.map((name) => [name, Object.getOwnPropertyDescriptor(Element.prototype, name)] as const)

beforeEach(() => {
  content.height = 400
  globalThis.ResizeObserver = class {
    fire: () => void
    constructor(callback: ResizeObserverCallback) {
      this.fire = () => callback([], this as unknown as ResizeObserver)
      observers.add(this as never)
    }
    observe() {}
    unobserve() {}
    disconnect() {
      observers.delete(this as never)
    }
  } as unknown as typeof ResizeObserver
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: function (this: HTMLElement) { return isViewport(this) ? 400 : 0 } })
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: function (this: HTMLElement) { return isViewport(this) ? content.height : 0 } })
  Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
    configurable: true,
    get: function (this: HTMLElement) {
      return tops.get(this) ?? 0
    },
    set: function (this: HTMLElement, value: number) {
      tops.set(this, Math.max(0, Math.min(value, (isViewport(this) ? content.height : 0) - 400)))
    },
  })
})
afterEach(() => {
  globalThis.ResizeObserver = RealResizeObserver
  observers.clear()
  for (const name of patched) delete (HTMLElement.prototype as unknown as Record<string, unknown>)[name]
  for (const [name, descriptor] of originals) if (descriptor) Object.defineProperty(Element.prototype, name, descriptor)
})

/** The content is now `height` px tall: observers fire as a browser's would. */
function grow(height: number) {
  content.height = height
  act(() => observers.forEach((o) => o.fire()))
}

function setup(ui: ReactNode, reducedMotion: 'always' | 'never' = 'always') {
  const utils = render(ui, { wrapper: ({ children }) => <YoujProvider reducedMotion={reducedMotion}>{children}</YoujProvider> })
  return { ...utils, viewport: () => document.querySelector<HTMLElement>('[data-slot=scroll-area-viewport]')! }
}

const history = (
  <>
    <ChatMessage key="1" role="user" name="Ada" content="Where should I look first?" />
    <ChatMessage key="2" role="assistant" name="Youj" content="Start with Tuesday's deployments." />
  </>
)

describe('ChatMessageList', () => {
  test('is a labelled region holding a log that never reads itself out', () => {
    setup(<ChatMessageList>{history}</ChatMessageList>)
    expect(screen.getByRole('region', { name: 'Conversation' })).toBeInTheDocument()
    expect(screen.getByRole('log')).toHaveAttribute('aria-live', 'off')
  })

  describe('sticking to the bottom', () => {
    test('opens at the bottom and follows the content as it grows', () => {
      const { viewport } = setup(<ChatMessageList>{history}</ChatMessageList>)
      grow(1000)
      expect(viewport().scrollTop).toBe(600)
      grow(1240)
      expect(viewport().scrollTop).toBe(840)
    })

    test('scrolling up lets go; the jump button brings you back and keeps your focus in the conversation', async () => {
      const user = userEvent.setup()
      const { viewport } = setup(<ChatMessageList>{history}</ChatMessageList>)
      grow(1000)
      expect(screen.queryByRole('button', { name: /Jump to latest/ })).toBeNull()

      fireEvent.wheel(viewport(), { deltaY: -120 })
      viewport().scrollTop = 200
      fireEvent.scroll(viewport())
      grow(1400)
      // Left where the reader is, with a way back that says something new arrived.
      expect(viewport().scrollTop).toBe(200)
      const jump = await screen.findByRole('button', { name: /Jump to latest/ })
      expect(jump.querySelector('.bg-accent')).toBeInTheDocument()

      await user.click(jump)
      expect(viewport().scrollTop).toBe(1000)
      expect(viewport()).toHaveFocus()
      fireEvent.scroll(viewport())
      await waitFor(() => expect(screen.queryByRole('button', { name: /Jump to latest/ })).toBeNull())
      // Stuck again: new content is followed.
      grow(1600)
      expect(viewport().scrollTop).toBe(1200)
    })

    test('scrolling back down to the bottom holds it again', () => {
      const { viewport } = setup(<ChatMessageList>{history}</ChatMessageList>)
      grow(1000)
      fireEvent.wheel(viewport(), { deltaY: -120 })
      viewport().scrollTop = 100
      fireEvent.scroll(viewport())
      grow(1100)
      expect(viewport().scrollTop).toBe(100)
      fireEvent.wheel(viewport(), { deltaY: 120 })
      viewport().scrollTop = 690
      fireEvent.scroll(viewport())
      grow(1200)
      expect(viewport().scrollTop).toBe(800)
    })

    test('a scroll the reader didn’t make never lets go', () => {
      const { viewport } = setup(<ChatMessageList>{history}</ChatMessageList>)
      grow(1000)
      // The browser clamped scrollTop as content briefly shrank; by the time
      // the scroll is reported, new content has made it look far from the bottom.
      content.height = 1200
      viewport().scrollTop = 546
      fireEvent.scroll(viewport())
      expect(viewport().scrollTop).toBe(800)
      grow(1300)
      expect(viewport().scrollTop).toBe(900)
      expect(screen.queryByRole('button', { name: /Jump to latest/ })).toBeNull()
    })

    test('sending a message brings you back down even when scrolled up', () => {
      const { viewport, rerender } = setup(<ChatMessageList>{history}</ChatMessageList>)
      grow(1000)
      viewport().scrollTop = 0
      fireEvent.scroll(viewport())
      content.height = 1100
      rerender(
        <ChatMessageList>
          {history}
          <ChatMessage key="3" role="user" name="Ada" content="Show me the diff." />
        </ChatMessageList>,
      )
      expect(viewport().scrollTop).toBe(700)
    })

    test('with motion, following glides there on a spring', async () => {
      const { viewport } = setup(<ChatMessageList>{history}</ChatMessageList>, 'never')
      grow(1000)
      grow(1400)
      await waitFor(() => expect(viewport().scrollTop).toBe(1000))
    })
  })

  test('groups consecutive messages by author and marks the latest', () => {
    setup(
      <ChatMessageList>
        <ChatMessage key="1" role="user" name="Ada" content="Yes please." />
        <ChatMessage key="2" role="user" name="Ada" content="And whether rolling back is safe." />
        <ChatMessage key="3" role="user" name="Ada" content="Thanks." />
        <ChatMessage key="4" role="assistant" name="Youj" content="Here's the diff." />
      </ChatMessageList>,
    )
    const [first, second, third, answer] = screen.getAllByRole('article')
    expect(first).toHaveAttribute('data-group', 'start')
    expect(first).not.toHaveAttribute('data-continued')
    expect(second).toHaveAttribute('data-group', 'middle')
    expect(second).toHaveAttribute('data-continued')
    expect(third).toHaveAttribute('data-group', 'end')
    expect(answer).not.toHaveAttribute('data-group')
    expect(answer).toHaveAttribute('data-latest')
    expect(first).not.toHaveAttribute('data-latest')
    // Grouped messages are still named for screen readers.
    expect(second).toHaveAccessibleName('Ada')
  })

  describe('announcements', () => {
    test('a streaming answer is announced once it starts and once, whole, when it completes; never token by token', async () => {
      const stream = createTextStream()
      const list = (streaming: boolean, withAnswer = true) => (
        <ChatMessageList>
          {history}
          {withAnswer && <ChatMessage key="3" role="assistant" name="Youj" content={streaming ? stream : stream.getSnapshot()} streaming={streaming} />}
        </ChatMessageList>
      )
      const { rerender } = setup(list(true, false))
      const status = document.querySelector('[data-slot=chat-message-list-status]')!
      expect(status).toHaveAttribute('role', 'status')
      expect(status).toBeEmptyDOMElement()

      rerender(list(true))
      await waitFor(() => expect(status).toHaveTextContent('Youj is responding…'))

      act(() => stream.append('The build'))
      act(() => stream.append(' passed in **38s**.'))
      expect(status).toHaveTextContent('Youj is responding…')
      expect(status).not.toHaveTextContent('build')

      rerender(list(false))
      await waitFor(() => expect(status).toHaveTextContent('Youj: The build passed in 38s.'))
    })

    test('history on mount is not announced; a failure is, assertively', async () => {
      const { rerender } = setup(<ChatMessageList>{history}</ChatMessageList>)
      // One pair of live regions for the whole conversation: messages speak through it.
      expect(screen.getAllByRole('status')).toHaveLength(1)
      expect(screen.getAllByRole('alert')).toHaveLength(1)
      const status = screen.getByRole('status')
      const alert = screen.getByRole('alert')
      await new Promise((resolve) => setTimeout(resolve, 60))
      expect(status).toBeEmptyDOMElement()

      rerender(
        <ChatMessageList>
          {history}
          <ChatMessage key="3" role="assistant" name="Youj" content="Checking" error="The connection dropped." />
        </ChatMessageList>,
      )
      await waitFor(() => expect(alert).toHaveTextContent('Youj’s response failed: The connection dropped.'))
    })
  })

  test('cleans up its observers and listeners on unmount', () => {
    const { unmount } = setup(<ChatMessageList>{history}</ChatMessageList>)
    expect(observers.size).toBeGreaterThan(0)
    unmount()
    expect(observers.size).toBe(0)
  })
})
