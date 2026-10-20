import { createRef } from 'react'
import { render, renderHook, screen, waitFor } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { renderFull, renderReduced } from '@youj/core/test-utils'
import { springs } from '@youj/core'
import { springPhysics } from '@youj/core/internal'
import { MorphLabel, useMorphRoot } from './morph-label'

test('a new value replaces the content; reduced motion swaps it instantly', () => {
  const { rerender } = renderReduced(<MorphLabel value="copy">Copy</MorphLabel>)
  expect(screen.getByText('Copy')).toBeInTheDocument()
  rerender(<MorphLabel value="copied">Copied</MorphLabel>)
  expect(screen.getByText('Copied')).toBeInTheDocument()
  expect(screen.queryByText('Copy')).not.toBeInTheDocument()
})

test('with motion the outgoing content stays mounted while it fades out, hidden from assistive tech', () => {
  const { rerender } = renderFull(<MorphLabel value="copy">Copy</MorphLabel>)
  rerender(<MorphLabel value="copied">Copied</MorphLabel>)
  expect(screen.getByText('Copied')).not.toHaveAttribute('aria-hidden')
  expect(screen.getByText('Copy')).toHaveAttribute('aria-hidden', 'true')
})

test('a new label settles with no filter left on it, so its text renders crisp', async () => {
  const { rerender } = renderFull(
    <YoujProvider timeScale={0.05}>
      <MorphLabel value="copy">Copy</MorphLabel>
    </YoujProvider>,
  )
  rerender(
    <YoujProvider timeScale={0.05}>
      <MorphLabel value="copied">Copied</MorphLabel>
    </YoujProvider>,
  )
  const row = () => screen.getByText('Copied').closest('span[style]') as HTMLElement
  await waitFor(() => expect(row().style.filter).toBe('none'))
})

test('inside a button, the accessible name is only the current label', () => {
  const { rerender } = renderFull(
    <button type="button">
      <MorphLabel value="copy">Copy</MorphLabel>
    </button>,
  )
  rerender(
    <button type="button">
      <MorphLabel value="copied">Copied</MorphLabel>
    </button>,
  )
  expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
})

test('the same value re-renders in place without a crossfade', () => {
  const { rerender } = renderFull(<MorphLabel value="count">3 selected</MorphLabel>)
  rerender(<MorphLabel value="count">4 selected</MorphLabel>)
  expect(screen.getByText('4 selected')).toBeInTheDocument()
  expect(screen.queryByText('3 selected')).not.toBeInTheDocument()
})

test('the ref is a stable inner span, so effects can animate it across values', () => {
  const ref = createRef<HTMLSpanElement>()
  const { rerender } = renderReduced(
    <MorphLabel ref={ref} value="a">
      A
    </MorphLabel>,
  )
  const first = ref.current
  rerender(
    <MorphLabel ref={ref} value="b">
      B
    </MorphLabel>,
  )
  expect(ref.current).toBe(first)
  expect(ref.current).toContainElement(screen.getByText('B'))
})

test('content rows take extra classes over the default row', () => {
  renderReduced(
    <MorphLabel value="done" contentClassName="gap-1.5">
      Done
    </MorphLabel>,
  )
  const row = screen.getByText('Done')
  expect(row).toHaveClass('inline-flex', 'whitespace-nowrap', 'gap-1.5')
  expect(row).not.toHaveClass('gap-2')
})

test('useMorphRoot shares the label spring, keeps the radius, and is instant when reduced', () => {
  const full = renderHook(() => useMorphRoot(10), {
    wrapper: ({ children }) => <YoujProvider reducedMotion="never">{children}</YoujProvider>,
  }).result.current
  expect(full.layout).toBe(true)
  expect(full.transition.layout).toEqual(springPhysics(springs.snappy))
  expect(full.style).toEqual({ borderRadius: 10 })

  const reduced = renderHook(() => useMorphRoot(), {
    wrapper: ({ children }) => <YoujProvider reducedMotion="always">{children}</YoujProvider>,
  }).result.current
  expect(reduced.transition.layout).toEqual({ type: false })
  expect(reduced.style).toBeUndefined()
})

test('the morph root follows the time scale', () => {
  const { result } = renderHook(() => useMorphRoot(), {
    wrapper: ({ children }) => (
      <YoujProvider timeScale={2} reducedMotion="never">
        {children}
      </YoujProvider>
    ),
  })
  expect(result.current.transition.layout).toEqual(springPhysics(springs.snappy, 2))
})

test('renders without a provider', () => {
  render(<MorphLabel value="x">Hello</MorphLabel>)
  expect(screen.getByText('Hello')).toBeInTheDocument()
})

describe('letters mode', () => {
  const letters = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('[data-letter]')]

  test('letters the labels share stay mounted; only the others leave and arrive', () => {
    const { container, rerender } = renderFull(
      <MorphLabel value="copy" mode="letters">
        Copy
      </MorphLabel>,
    )
    const [c, o, p, y] = letters(container)
    rerender(
      <MorphLabel value="copied" mode="letters">
        Copied
      </MorphLabel>,
    )
    const now = letters(container)
    // The shared run "Cop" is the very same nodes; "y" is on its way out; "ied" is new.
    expect(now.slice(0, 3)).toEqual([c, o, p])
    expect(y!.isConnected).toBe(true)
    expect(now.map((el) => el.dataset.letter).join('')).toContain('Cop')
    expect(now.filter((el) => !([c, o, p, y] as HTMLElement[]).includes(el)).map((el) => el.dataset.letter)).toEqual(['i', 'e', 'd'])
  })

  test('a suffix is shared too, and a single letter in common is not', () => {
    const { container, rerender } = renderFull(
      <MorphLabel value="a" mode="letters">
        Save
      </MorphLabel>,
    )
    const before = letters(container)
    rerender(
      <MorphLabel value="b" mode="letters">
        Saved
      </MorphLabel>,
    )
    expect(letters(container).slice(0, 4)).toEqual(before)

    const { container: second, rerender: again } = renderFull(
      <MorphLabel value="a" mode="letters">
        On
      </MorphLabel>,
    )
    const [o] = letters(second)
    again(
      <MorphLabel value="b" mode="letters">
        Off
      </MorphLabel>,
    )
    // "O" alone is a coincidence: the whole label swaps.
    expect(letters(second).filter((el) => el.dataset.letter === 'O' && el !== o)).toHaveLength(1)
  })

  test('assistive tech reads the whole current label, never the letters', () => {
    const { rerender } = renderFull(
      <button type="button">
        <MorphLabel value="copy" mode="letters">
          Copy
        </MorphLabel>
      </button>,
    )
    rerender(
      <button type="button">
        <MorphLabel value="copied" mode="letters">
          Copied
        </MorphLabel>
      </button>,
    )
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  test('reduced motion writes the label as plain text, swapped at once', () => {
    const { container, rerender } = renderReduced(
      <MorphLabel value="save" mode="letters">
        Save
      </MorphLabel>,
    )
    rerender(
      <MorphLabel value="saved" mode="letters">
        Saved
      </MorphLabel>,
    )
    expect(container.querySelector('[data-letter]')).toBeNull()
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  test('children that are not text fall back to swapping the label', () => {
    renderFull(
      <MorphLabel value="x" mode="letters">
        <b>Bold</b>
      </MorphLabel>,
    )
    expect(screen.getByText('Bold')).toBeInTheDocument()
    expect(document.querySelector('[data-letter]')).toBeNull()
  })
})

test('rise brings the new label up from below while the old one lifts away, and settles crisp', async () => {
  const ui = (value: string, text: string) => (
    <YoujProvider timeScale={0.05}>
      <MorphLabel value={value} rise>
        {text}
      </MorphLabel>
    </YoujProvider>
  )
  const { rerender } = renderFull(ui('send', 'Send'))
  rerender(ui('sent', 'Sent'))
  const row = () => screen.getByText('Sent').closest('span[style]') as HTMLElement
  // It starts below (a positive y), out of a blur.
  expect(row().style.transform).toContain('translateY(0.3em)')
  await waitFor(() => expect(row().style.filter).toBe('none'))
  await waitFor(() => expect(row().style.transform).toBe('none'))
})
