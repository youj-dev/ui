import { fireEvent, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ShareRing } from './share-ring'

const MACROS = [
  { id: 'protein', label: 'Protein', value: 152, amount: 38 },
  { id: 'carbs', label: 'Carbs', value: 256, amount: 64 },
  { id: 'fat', label: 'Fat', value: 198, amount: 22 },
]
const grams = { style: 'unit', unit: 'gram', unitDisplay: 'short' } as const
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const cells = (state?: 'on' | 'off') => [...document.querySelectorAll(`[data-slot=share-ring-cell]${state ? `[data-state=${state}]` : ''}`)]

describe('ShareRing', () => {
  test('speaks the total and every part’s share, the shares summing to 100%', () => {
    reduced(<ShareRing segments={MACROS} unit="kcal" amountFormat={grams} />)
    expect(screen.getByRole('img', { name: '606 kcal: Protein 25%, Carbs 42%, and Fat 33%' })).toBeInTheDocument()
    const shares = [...document.querySelectorAll('[data-slot=share-ring-share]')].map((n) => n.textContent)
    expect(shares).toEqual(['25%', '42%', '33%'])
    expect(document.querySelector('[data-slot=share-ring-amount]')).toHaveTextContent('38 g')
  })

  test('gives each part whole cells by the largest remainder, filling the ring', () => {
    reduced(<ShareRing segments={MACROS} />)
    expect(cells()).toHaveLength(60)
    const count = (id: string) => cells('on').filter((c) => c.getAttribute('data-segment') === id).length
    expect([count('protein'), count('carbs'), count('fat')]).toEqual([15, 25, 20])
    expect(cells('off')).toHaveLength(0)
  })

  test('with max above the total, the rest of the ring stays dark', () => {
    reduced(<ShareRing segments={MACROS} max={2000} />)
    expect(cells('on')).toHaveLength(18)
    expect(cells('off')).toHaveLength(42)
  })

  test('an empty composition leaves every cell dark and says there is no data', () => {
    reduced(<ShareRing segments={MACROS.map((s) => ({ ...s, value: 0 }))} unit="kcal" />)
    expect(cells('on')).toHaveLength(0)
    expect(screen.getByRole('img', { name: '0 kcal, No data' })).toBeInTheDocument()
  })

  test('pointing at a part in the legend singles it out and puts its amount in the bowl', () => {
    reduced(<ShareRing segments={MACROS} unit="kcal" amountFormat={grams} />)
    const carbs = screen.getByText('Carbs').closest('li')!
    fireEvent.pointerEnter(carbs)
    expect(carbs).toHaveAttribute('data-highlighted')
    expect(document.querySelector('[data-slot=share-ring-focus-value]')).toHaveTextContent('64 g')
    expect((cells('on').find((c) => c.getAttribute('data-segment') === 'fat') as SVGElement).style.opacity).toBe('0.24')
    fireEvent.pointerLeave(carbs.parentElement!)
    expect(carbs).not.toHaveAttribute('data-highlighted')
  })

  test('a controlled highlight wins over the pointer', () => {
    reduced(<ShareRing segments={MACROS} highlight="fat" />)
    expect(screen.getByText('Fat').closest('li')).toHaveAttribute('data-highlighted')
    fireEvent.pointerEnter(screen.getByText('Protein').closest('li')!)
    expect(screen.getByText('Protein').closest('li')).not.toHaveAttribute('data-highlighted')
  })

  test('with motion, the cells wait to light until the ring is in view; reduced motion draws them lit', () => {
    const { unmount } = render(<ShareRing segments={MACROS} />)
    // jsdom never scrolls anything into view.
    expect(cells('on')).toHaveLength(0)
    unmount()
    reduced(<ShareRing segments={MACROS} />)
    expect(cells('on')).toHaveLength(60)
    expect(document.querySelector('[data-slot=share-ring]')).toHaveAttribute('data-reduced-motion')
  })

  test('the pill size has no bowl and no legend, and keeps the dial’s cells', () => {
    reduced(<ShareRing size="xs" legend={false} segments={[{ id: 'left', label: 'Rice', value: 300 }]} max={720} />)
    expect(document.querySelector('[data-slot=share-ring-center]')).toBeNull()
    expect(document.querySelector('[data-slot=share-ring-legend]')).toBeNull()
    expect(cells()).toHaveLength(12)
    expect(cells('on')).toHaveLength(5)
  })

  test('translates through the provider’s labels and formats in its locale', () => {
    render(
      <YoujProvider reducedMotion="always" locale="de-DE" labels={{ shareRingSummary: (total, parts) => `${total}: ${parts.join(' · ')}` }}>
        <ShareRing segments={MACROS} unit="kcal" />
      </YoujProvider>,
    )
    // German sets a no-break space before the percent sign.
    expect(screen.getByRole('img', { name: /^606 kcal: Protein 25\s% · Carbs 42\s% · Fat 33\s%$/ })).toBeInTheDocument()
  })
})
