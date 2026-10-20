import { render, screen } from '@testing-library/react'
import { YoujProvider, ThemeScope } from './provider'
import { useLabels } from './use-labels'
import { useComponentLabels } from './use-component-labels'
import { buttonLabels, carouselLabels } from './labels-components'
import { defaultLabels } from './labels'
import { brutal } from './theme/themes'

function Probe() {
  const labels = useLabels()
  return (
    <p>
      {labels.close}|{labels.cancel}|{labels.slideOf(2, 5)}
    </p>
  )
}

describe('useLabels', () => {
  it('resolves scoped string and function defaults without changing their identity', () => {
    const seen: unknown[] = []
    function Scoped() {
      const labels = useComponentLabels(carouselLabels)
      seen.push(labels)
      return <p>{labels.slideOf(2, 5)}</p>
    }
    const { rerender } = render(<Scoped />)
    expect(seen[0]).toBe(carouselLabels)
    expect(screen.getByText('Slide 2 of 5')).toBeInTheDocument()
    rerender(
      <YoujProvider labels={{ slideOf: (n, total) => `Folie ${n} von ${total}` }}>
        <Scoped />
      </YoujProvider>,
    )
    expect(screen.getByText('Folie 2 von 5')).toBeInTheDocument()
    expect(buttonLabels).toEqual({ loading: defaultLabels.loading })
  })

  it('returns the English defaults without a provider', () => {
    render(<Probe />)
    expect(screen.getByText('Close|Cancel|Slide 2 of 5')).toBeInTheDocument()
  })

  it('overrides only the keys a provider sets, function keys included', () => {
    render(
      <YoujProvider labels={{ close: 'Schließen', slideOf: (n, total) => `Folie ${n} von ${total}` }}>
        <Probe />
      </YoujProvider>,
    )
    expect(screen.getByText('Schließen|Cancel|Folie 2 von 5')).toBeInTheDocument()
  })

  it('merges nested providers: inner keys win, the rest inherit', () => {
    render(
      <YoujProvider labels={{ close: 'Schließen', cancel: 'Abbrechen' }}>
        <YoujProvider labels={{ cancel: 'Annuler' }}>
          <Probe />
        </YoujProvider>
      </YoujProvider>,
    )
    expect(screen.getByText('Schließen|Annuler|Slide 2 of 5')).toBeInTheDocument()
  })

  it('keeps the labels through a ThemeScope and a provider without labels', () => {
    render(
      <YoujProvider labels={{ close: 'Schließen' }}>
        <ThemeScope theme={brutal}>
          <YoujProvider timeScale={2}>
            <Probe />
          </YoujProvider>
        </ThemeScope>
      </YoujProvider>,
    )
    expect(screen.getByText('Schließen|Cancel|Slide 2 of 5')).toBeInTheDocument()
  })

  it('returns a stable object while the labels are unchanged', () => {
    const seen: unknown[] = []
    function Collect() {
      seen.push(useLabels())
      return null
    }
    const labels = { close: 'Schließen' }
    const { rerender } = render(
      <YoujProvider labels={labels}>
        <Collect />
      </YoujProvider>,
    )
    rerender(
      <YoujProvider labels={labels}>
        <Collect />
      </YoujProvider>,
    )
    expect(seen[0]).toBe(seen[1])
    expect(seen[0]).not.toBe(defaultLabels)
  })
})
