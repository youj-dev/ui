import { memo, Profiler, useState, type ProfilerOnRenderCallback } from 'react'
import { act, render } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ChatMessage } from './chat-message'
import { ChatMessageList } from './chat-message-list'
import { createTextStream, type ChatText } from './chat-text-stream'
import { tokenize } from './chat.fixtures'

/* Streaming 2,000 tokens into a 50-message conversation. Render counters in
 * the rows say which components ran; React's Profiler says what committed.
 * The history must never re-render; with a ChatTextSource the streaming
 * message itself must not either, only its text. Timings are logged for the
 * report (jsdom is slower than a browser; the counts are what's asserted). The parser
 * is incremental, so a token costs the same however long the text, which is what let this
 * grow from 400 to 2,000 tokens (before, 2,000 took over 30 s on a loaded machine). */

const TOKENS = 2000
const HISTORY = 50

const ANSWER = Array.from({ length: 400 }, (_, i) => `Paragraph ${i + 1}: rolling out **orion** to \`fra1\` with a safe [rollback](https://youj.io/docs) path, step by step.`).join('\n\n')
const tokens = tokenize(ANSWER).slice(0, TOKENS)

const history = Array.from({ length: HISTORY }, (_, i) => ({
  id: `m${i}`,
  role: i % 2 ? ('assistant' as const) : ('user' as const),
  content: i % 2 ? `An answer with **markdown**, \`code\` and a [link](https://youj.io) (${i}).` : `Question ${i}?`,
}))

const renders = { history: 0, live: 0 }

/** A history row, memoised as an app would. */
const HistoryRow = memo(function HistoryRow({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  renders.history++
  return <ChatMessage role={role} content={content} />
})

const LiveRow = memo(function LiveRow({ content }: { content: ChatText }) {
  renders.live++
  return <ChatMessage role="assistant" name="Youj" content={content} streaming />
})

beforeEach(() => {
  renders.history = 0
  renders.live = 0
})

describe(`streaming ${TOKENS} tokens into ${HISTORY} messages`, () => {
  test('through a ChatTextSource, only the streaming text re-renders', () => {
    expect(tokens).toHaveLength(TOKENS)
    const stream = createTextStream()
    let textCommits = 0
    const onRender: ProfilerOnRenderCallback = () => textCommits++
    render(
      <YoujProvider reducedMotion="never">
        <ChatMessageList>
          {history.map((m) => (
            <HistoryRow key={m.id} role={m.role} content={m.content} />
          ))}
          <Profiler key="live" id="live" onRender={onRender}>
            <LiveRow content={stream} />
          </Profiler>
        </ChatMessageList>
      </YoujProvider>,
    )
    const atMount = { ...renders, textCommits }
    const start = performance.now()
    for (const token of tokens) act(() => stream.append(token))
    const elapsed = performance.now() - start

    console.info(
      `[chat perf] ChatTextSource: ${TOKENS} tokens in ${elapsed.toFixed(0)}ms (${(elapsed / TOKENS).toFixed(2)}ms/token); ` +
        `history row renders ${renders.history - atMount.history}, streaming message renders ${renders.live - atMount.live}, text commits ${textCommits - atMount.textCommits}`,
    )
    expect(renders.history - atMount.history).toBe(0)
    expect(renders.live - atMount.live).toBe(0)
    expect(textCommits - atMount.textCommits).toBe(TOKENS)
    expect(document.querySelector('[data-streaming] [data-slot=chat-markdown]')).toHaveTextContent('Paragraph 1: rolling out orion')
  })

  test('as a plain string, only the streaming message re-renders, and the animated list stays put', () => {
    let push: (token: string) => void = () => {}
    function Conversation() {
      const [text, setText] = useState('')
      push = (token) => setText((t) => t + token)
      return (
        <ChatMessageList>
          {history.map((m) => (
            <HistoryRow key={m.id} role={m.role} content={m.content} />
          ))}
          <LiveRow key="live" content={text} />
        </ChatMessageList>
      )
    }
    render(
      <YoujProvider reducedMotion="never">
        <Conversation />
      </YoujProvider>,
    )
    const atMount = { ...renders }
    const start = performance.now()
    for (const token of tokens) act(() => push(token))
    const elapsed = performance.now() - start
    console.info(
      `[chat perf] string: ${TOKENS} tokens in ${elapsed.toFixed(0)}ms (${(elapsed / TOKENS).toFixed(2)}ms/token); ` +
        `history row renders ${renders.history - atMount.history}, streaming message renders ${renders.live - atMount.live}`,
    )
    expect(renders.history - atMount.history).toBe(0)
    expect(renders.live - atMount.live).toBe(TOKENS)
  })
})
