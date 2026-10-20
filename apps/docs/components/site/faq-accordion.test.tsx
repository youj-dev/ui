import { act, fireEvent, render, screen } from '@testing-library/react'
import { faq } from '@/app/faq/questions'
import { FaqAccordion } from './faq-accordion'

const items = [
  { id: 'is-it-free', question: 'Is Youj free?', answer: <p>Yes, MIT.</p> },
  { id: 'react-18', question: 'Does it support React 18?', answer: <p>Not today.</p> },
]

afterEach(() => window.history.replaceState(null, '', '/'))

describe('FaqAccordion', () => {
  it('opens and closes answers from their heading buttons, several at once', () => {
    render(<FaqAccordion items={items} />)
    const free = screen.getByRole('button', { name: 'Is Youj free?' })
    const react = screen.getByRole('button', { name: 'Does it support React 18?' })
    expect(free).toHaveAttribute('aria-expanded', 'false')
    expect(free.closest('h3')).not.toBeNull()

    fireEvent.click(free)
    fireEvent.click(react)
    expect(free).toHaveAttribute('aria-expanded', 'true')
    expect(react).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(free)
    expect(free).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps closed answers in the page for find-in-page', () => {
    render(<FaqAccordion items={items} />)
    expect(screen.getByText('Not today.', { selector: 'p' })).toBeInTheDocument()
  })

  it('opens the question a link points at, on load and on hash change', () => {
    window.history.replaceState(null, '', '/faq#react-18')
    render(<FaqAccordion items={items} />)
    expect(screen.getByRole('button', { name: 'Does it support React 18?' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Is Youj free?' })).toHaveAttribute('aria-expanded', 'false')

    act(() => {
      window.history.replaceState(null, '', '/faq#is-it-free')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.getByRole('button', { name: 'Is Youj free?' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('ignores a hash that is not one of its questions, and stops listening when unmounted', () => {
    window.history.replaceState(null, '', '/faq#help')
    const listen = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<FaqAccordion items={items} />)
    for (const b of screen.getAllByRole('button')) expect(b).toHaveAttribute('aria-expanded', 'false')
    unmount()
    expect(listen).toHaveBeenCalledWith('hashchange', expect.any(Function))
    listen.mockRestore()
  })
})

test('every FAQ question has a unique anchor and a non-empty answer', () => {
  const questions = faq().flatMap((g) => g.questions)
  expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length)
  for (const q of questions) expect(q.answer.length).toBeGreaterThan(40)
  // The brand marks answer is linked from "Is it free?" by its anchor.
  expect(questions.some((q) => q.id === 'brand-marks')).toBe(true)
})
