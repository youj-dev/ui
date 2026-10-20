import { act, fireEvent, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { StoriesView, StoryDescription, type StoryEntry } from './stories-view'

const stories: StoryEntry[] = [
  { id: 'demo', label: 'Demo', frame: { name: 'field/demo', file: 'field-demo.tsx' }, description: <p>Demo text</p> },
  {
    id: 'validation',
    label: 'Validation',
    frame: { name: 'field/validation', file: 'field-validation.tsx' },
    description: (
      <>
        <p>Validation text</p>
        <p>Validation usage</p>
      </>
    ),
  },
]

function Page() {
  return (
    <YoujProvider>
      <StoriesView stories={stories}>
        <StoryDescription />
      </StoriesView>
    </YoujProvider>
  )
}

const shown = (text: string) => !screen.getByText(text).closest('[data-story]')!.hasAttribute('hidden')

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  history.replaceState(null, '', location.pathname)
})

describe('StoriesView', () => {
  it('shows the first story, with the others kept in the page until found', () => {
    render(<Page />)
    expect(shown('Demo text')).toBe(true)
    expect(shown('Validation text')).toBe(false)
  })

  it('opens on the story the hash names, and follows the hash', () => {
    history.replaceState(null, '', '#validation')
    render(<Page />)
    expect(shown('Validation text')).toBe(true)
    act(() => {
      history.replaceState(null, '', '#demo')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(shown('Demo text')).toBe(true)
  })

  it('leaves the story alone for a hash that names something else', () => {
    history.replaceState(null, '', '#installation')
    render(<Page />)
    expect(shown('Demo text')).toBe(true)
  })

  it('shows the story whose hidden text find-in-page matched, and puts it in the address', () => {
    render(<Page />)
    act(() => fireEvent(screen.getByText('Validation usage'), new Event('beforematch', { bubbles: true })))
    expect(shown('Validation text')).toBe(true)
    expect(location.hash).toBe('#validation')
  })
})
