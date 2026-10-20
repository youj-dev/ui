import { act, fireEvent, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { Example, Examples } from './examples'
import { ReferenceRow } from './reference'
import { revealTarget } from './reveal'

function Page() {
  return (
    <YoujProvider>
      <Examples>
        <Example id="variants" label="Variants">
          <h3 id="variants">Variants</h3>
          <p>Variant text</p>
        </Example>
        <Example id="loading" label="Loading">
          <h3 id="loading">Loading</h3>
          <p>Loading text</p>
        </Example>
      </Examples>
      <ReferenceRow title="Props" summary="a, b">
        <h3 id="props">Props</h3>
        <p>Props text</p>
      </ReferenceRow>
    </YoujProvider>
  )
}

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  window.location.hash = ''
})

describe('Examples', () => {
  it('shows the first example and keeps the others in the page until found', () => {
    render(<Page />)
    expect(screen.getByRole('tab', { name: 'Variants' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Variant text').closest('[role=tabpanel]')).not.toHaveAttribute('hidden')
    expect(screen.getByText('Loading text', { selector: 'p' }).closest('[role=tabpanel]')).toHaveAttribute('hidden')
  })

  it('selects the tab a link points into, and opens the Reference row a link points into', () => {
    render(<Page />)
    act(() => revealTarget(document.getElementById('loading')))
    expect(screen.getByRole('tab', { name: 'Loading' })).toHaveAttribute('aria-selected', 'true')
    act(() => revealTarget(document.getElementById('props')))
    expect(screen.getByText('Props text').closest('details')).toHaveAttribute('open')
  })

  it('selects the tab for a match found in a hidden panel', () => {
    render(<Page />)
    fireEvent(screen.getByText('Loading text'), new Event('beforematch', { bubbles: true }))
    expect(screen.getByRole('tab', { name: 'Loading' })).toHaveAttribute('aria-selected', 'true')
  })
})
