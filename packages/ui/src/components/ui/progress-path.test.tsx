import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SoundCueContext } from '@youj/core/internal'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ProgressPath, type ProgressPathSection } from './progress-path'

const SECTIONS: ProgressPathSection[] = [
  {
    id: 's1',
    eyebrow: 'Section 1',
    title: 'Basics',
    lessons: [
      { id: 'a', title: 'Greetings', mastery: 4 },
      { id: 'b', title: 'Numbers', mastery: 2 },
      { id: 'm', title: 'Basics checkpoint', milestone: true },
    ],
  },
  { id: 's2', title: 'Food', lessons: [{ id: 'c', title: 'Coffee' }] },
]

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const node = (id: string) => document.querySelector<HTMLElement>(`[data-lesson-id="${id}"]`)!

describe('ProgressPath', () => {
  test('names each lesson with its place, status and mastery, and marks the current and locked ones', () => {
    reduced(<ProgressPath sections={SECTIONS} current="b" />)
    expect(screen.getByRole('group', { name: 'Progress path' })).toHaveAccessibleDescription('Arrow keys move between lessons; Enter opens one.')
    expect(node('a')).toHaveAccessibleName('Greetings, lesson 1 of 4, complete, mastery 4 of 4')
    expect(node('b')).toHaveAccessibleName('Numbers, lesson 2 of 4, up next, mastery 2 of 4')
    expect(node('b')).toHaveAttribute('aria-current', 'step')
    expect(node('m')).toHaveAccessibleName('Basics checkpoint, milestone, locked')
    expect(node('c')).toHaveAttribute('aria-disabled', 'true')
    // A section's progress, spoken with its count.
    expect(screen.getByText(', 1 of 3 lessons')).toBeInTheDocument()
  })

  test('lights one ring segment per mastered level, and none on a locked lesson', () => {
    reduced(<ProgressPath sections={SECTIONS} current="b" />)
    const lit = (id: string) => node(id).querySelectorAll('[data-slot=progress-path-level][data-state=on]').length
    expect(lit('a')).toBe(4)
    expect(lit('b')).toBe(2)
    expect(lit('c')).toBe(0)
  })

  test('without `current`, the first lesson not fully mastered is up next', () => {
    reduced(<ProgressPath sections={SECTIONS} />)
    expect(node('b')).toHaveAttribute('data-state', 'current')
    expect(node('a')).toHaveAttribute('data-state', 'done')
  })

  test('is one tab stop on the current lesson; arrows, Home and End walk the path', async () => {
    const user = userEvent.setup()
    reduced(<ProgressPath sections={SECTIONS} current="b" />)
    await user.tab()
    expect(node('b')).toHaveFocus()
    expect(document.querySelectorAll('[data-slot=progress-path-node][tabindex="0"]')).toHaveLength(1)
    await user.keyboard('{ArrowDown}')
    expect(node('m')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(node('c')).toHaveFocus()
    await user.keyboard('{Home}')
    expect(node('a')).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(node('a')).toHaveFocus()
    await user.keyboard('{End}')
    expect(node('c')).toHaveFocus()
  })

  test('mirrors left and right in RTL', async () => {
    const user = userEvent.setup()
    reduced(
      <div dir="rtl">
        <ProgressPath sections={SECTIONS} current="b" />
      </div>,
    )
    await user.tab()
    await user.keyboard('{ArrowLeft}')
    expect(node('m')).toHaveFocus()
  })

  test('opens lessons that are done or current, but not locked ones, which play the error cue instead', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const sink = vi.fn()
    render(
      <SoundCueContext.Provider value={sink}>
        <YoujProvider reducedMotion="always">
          <ProgressPath sections={SECTIONS} current="b" onSelect={onSelect} />
        </YoujProvider>
      </SoundCueContext.Provider>,
    )
    await user.click(node('a'))
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'a' }), expect.objectContaining({ id: 's1' }))
    node('b').focus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'b' }), expect.anything())
    await user.click(node('c'))
    expect(onSelect).toHaveBeenCalledTimes(2)
    expect(sink).toHaveBeenLastCalledWith('error', true)
  })

  test('plays the success cue when the current lesson moves on, not on the first render or backwards', () => {
    const sink = vi.fn()
    const ui = (current: string) => (
      <SoundCueContext.Provider value={sink}>
        <YoujProvider reducedMotion="always">
          <ProgressPath sections={SECTIONS} current={current} />
        </YoujProvider>
      </SoundCueContext.Provider>
    )
    const { rerender } = render(ui('b'))
    expect(sink).not.toHaveBeenCalled()
    rerender(ui('m'))
    expect(sink).toHaveBeenCalledWith('success', true)
    sink.mockClear()
    rerender(ui('a'))
    expect(sink).not.toHaveBeenCalled()
  })

  test('marks reduced motion for its CSS', () => {
    reduced(<ProgressPath sections={SECTIONS} current="b" />)
    expect(document.querySelector('[data-slot=progress-path]')).toHaveAttribute('data-reduced-motion')
  })
})
