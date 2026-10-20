import { act } from '@testing-library/react'
import { ScrambleText } from './scramble-text'
import { installObservers, renderFull, renderReduced } from '@youj/core/test-utils'

beforeAll(installObservers)
afterEach(() => vi.restoreAllMocks())

test('accessible text is the target even while the visual copy is scrambling', () => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)
  renderFull(<ScrambleText glyphs="#">Deploy ready</ScrambleText>)
  expect(document.querySelector('.sr-only')!.textContent).toBe('Deploy ready')
  const visual = document.querySelector('[aria-hidden]')!
  // First frame is written synchronously: unresolved characters show glyphs, spaces stay.
  expect(visual.textContent).not.toBe('Deploy ready')
  expect(visual.textContent).toHaveLength('Deploy ready'.length)
  expect(visual.textContent![6]).toBe(' ')
})

test('reduced motion shows the target text directly, including after a change', () => {
  const { rerender } = renderReduced(<ScrambleText>Building</ScrambleText>)
  expect(document.querySelector('[aria-hidden]')!.textContent).toBe('Building')
  rerender(<ScrambleText>Ready</ScrambleText>)
  expect(document.querySelector('[aria-hidden]')!.textContent).toBe('Ready')
  expect(document.querySelector('.sr-only')!.textContent).toBe('Ready')
})

test('resolves to the target text', async () => {
  let now = 0
  const queue: FrameRequestCallback[] = []
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => queue.push(cb))
  renderFull(<ScrambleText>Online</ScrambleText>)
  await act(async () => {
    while (queue.length) {
      now += 16
      queue.shift()!(now)
    }
  })
  expect(document.querySelector('[aria-hidden]')!.textContent).toBe('Online')
})

test('cancels its frame on unmount', () => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 42)
  const cancel = vi.spyOn(window, 'cancelAnimationFrame')
  const { unmount } = renderFull(<ScrambleText>Online</ScrambleText>)
  unmount()
  expect(cancel).toHaveBeenCalledWith(42)
})

test('reduced: hover trigger does not scramble', () => {
  renderReduced(<ScrambleText trigger="hover">Docs</ScrambleText>)
  expect(document.querySelector('[aria-hidden]')!.textContent).toBe('Docs')
})

test('calls onComplete when the decode lands, and at once under reduced motion', async () => {
  let now = 0
  const queue: FrameRequestCallback[] = []
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => queue.push(cb))
  const landed = vi.fn()
  const { unmount } = renderFull(<ScrambleText onComplete={landed}>Online</ScrambleText>)
  expect(landed).not.toHaveBeenCalled()
  await act(async () => {
    while (queue.length) {
      now += 16
      queue.shift()!(now)
    }
  })
  expect(landed).toHaveBeenCalledTimes(1)
  unmount()
  const reduced = vi.fn()
  renderReduced(<ScrambleText onComplete={reduced}>Online</ScrambleText>)
  expect(reduced).toHaveBeenCalledTimes(1)
})
