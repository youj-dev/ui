import { screen } from '@testing-library/react'
import { TextSplit } from './text-split'
import { installObservers, liveObservers, renderFull, renderReduced } from '@youj/core/test-utils'

beforeAll(installObservers)

const TEXT = 'Motion that lands precisely.'

test.each(['chars', 'words', 'lines'] as const)('keeps one accessible copy of the text when split by %s', (by) => {
  const { container } = renderFull(
    <TextSplit as="h1" by={by}>
      {TEXT}
    </TextSplit>,
  )
  const heading = screen.getByRole('heading', { level: 1 })
  expect(heading.querySelector('.sr-only')!.textContent).toBe(TEXT)
  const visual = heading.querySelector('[aria-hidden]')!
  const units = Array.from(visual.children).filter((c) => !c.classList.contains('invisible'))
  const shown = by === 'words' || by === 'chars' ? visual.textContent!.replace(/\s+/g, ' ') : units.map((u) => u.textContent).join(' ')
  expect(shown.trim()).toBe(TEXT)
  // Every split unit lives inside the aria-hidden copy.
  expect(container.querySelectorAll('h1 > *')).toHaveLength(2)
})

test('chars mode splits into one element per character', () => {
  renderFull(<TextSplit by="chars">ab cd</TextSplit>)
  const units = document.querySelectorAll('[aria-hidden] .inline-block .inline-block')
  expect(units).toHaveLength(4)
})

test('line mode groups measured words into line blocks', () => {
  // jsdom lays everything out at offsetTop 0, so all words form one line.
  const { container } = renderFull(<TextSplit by="lines">{TEXT}</TextSplit>)
  const visual = container.querySelector('[aria-hidden]')!
  expect(visual.querySelectorAll(':scope > .block:not(.invisible)')).toHaveLength(1)
  expect(visual.firstElementChild!.textContent).toBe(TEXT)
})

test('reduced motion renders the plain text in its final state', () => {
  renderReduced(<TextSplit as="p">{TEXT}</TextSplit>)
  const p = screen.getByText(TEXT)
  expect(p.tagName).toBe('P')
  expect(p.querySelector('[aria-hidden]')).toBeNull()
})

test('line mode releases its observers on unmount', () => {
  const before = liveObservers.size
  const { unmount } = renderFull(<TextSplit by="lines">{TEXT}</TextSplit>)
  unmount()
  expect(liveObservers.size).toBe(before)
})
