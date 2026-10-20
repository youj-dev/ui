import { render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AsyncAnnouncer, AsyncFeedback } from '../components/youj/effects/async-feedback'
import { ScrollProgress } from '../components/youj/motion/scroll-progress'

describe('motion components read the labels', () => {
  it('AsyncAnnouncer speaks the provider labels, and its props still win', () => {
    const { rerender } = render(
      <YoujProvider labels={{ working: 'Wird bearbeitet…', done: 'Fertig', failed: 'Fehlgeschlagen' }}>
        <AsyncAnnouncer state="pending" />
      </YoujProvider>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Wird bearbeitet…')
    rerender(
      <YoujProvider labels={{ working: 'Wird bearbeitet…', done: 'Fertig', failed: 'Fehlgeschlagen' }}>
        <AsyncAnnouncer state="error" />
      </YoujProvider>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Fehlgeschlagen')
    rerender(
      <YoujProvider labels={{ done: 'Fertig' }}>
        <AsyncAnnouncer state="success" successLabel="Gespeichert" />
      </YoujProvider>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Gespeichert')
  })

  it('AsyncFeedback shows the provider success label, English without one', () => {
    const { unmount } = render(
      <YoujProvider labels={{ done: 'Fertig' }}>
        <AsyncFeedback state="success">Save</AsyncFeedback>
      </YoujProvider>,
    )
    expect(screen.getByText('Fertig')).toBeInTheDocument()
    unmount()
    render(<AsyncFeedback state="success">Save</AsyncFeedback>)
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('ScrollProgress takes its name from the labels', () => {
    render(
      <YoujProvider labels={{ scrollProgress: 'Lesefortschritt' }}>
        <ScrollProgress />
      </YoujProvider>,
    )
    expect(screen.getByRole('progressbar', { name: 'Lesefortschritt' })).toBeInTheDocument()
  })
})
