import { render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DiffBar, diffWinner } from './diff-bar'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const side = (s: 'a' | 'b') => document.querySelector<HTMLElement>(`[data-slot=diff-bar-track][data-side=${s}]`)!
const lit = (s: 'a' | 'b') => side(s).querySelectorAll('[data-slot=diff-bar-cell][data-state=on]').length

describe('diffWinner', () => {
  test('picks the higher or lower side, and calls a near tie even', () => {
    expect(diffWinner(91.2, 92.4)).toBe('b')
    expect(diffWinner(1840, 910, 'lower')).toBe('b')
    expect(diffWinner(4, 2, 'higher')).toBe('a')
    expect(diffWinner(100, 100.2)).toBe('even')
    expect(diffWinner(100, 101, 'higher', 0.02)).toBe('even')
  })
})

describe('DiffBar', () => {
  test('lights each side’s share of cells, the winner in the tone', () => {
    reduced(<DiffBar a={50} b={100} segments={10} tone="chart-2" />)
    expect(lit('a')).toBe(5)
    expect(lit('b')).toBe(10)
    expect(side('b').querySelector('[data-state=on]')).toHaveClass('bg-chart-2')
    expect(side('a').querySelector('[data-state=on]')).not.toHaveClass('bg-chart-2')
    expect(document.querySelector('[data-slot=diff-bar]')).toHaveAttribute('data-winner', 'b')
  })

  test('grows from the centre: the start side fills toward its outer end', () => {
    reduced(<DiffBar a={30} b={100} segments={10} />)
    // The start side is laid out reversed, so its first cells sit at the center.
    expect(side('a')).toHaveClass('flex-row-reverse')
    expect(side('b')).not.toHaveClass('flex-row-reverse')
  })

  test('shows both values in the locale and speaks the verdict', () => {
    reduced(<DiffBar a={1840} b={910} better="lower" names={['Large', 'Mini']} format={{ style: 'unit', unit: 'millisecond' }} locale="de-DE" />)
    const values = [...document.querySelectorAll('[data-slot=diff-bar-value]')].map((v) => v.textContent)
    expect(values).toEqual(['1.840 ms', '910 ms'])
    expect(document.querySelector('[data-slot=diff-bar-verdict]')).toHaveTextContent(/^Mini is better by 51\s%$/)
    expect(document.querySelector('[data-slot=diff-bar-verdict]')).toHaveClass('sr-only')
  })

  test('says Even and lights neither side in the tone for a tie', () => {
    reduced(<DiffBar a={0.4} b={0.4} better="lower" />)
    expect(screen.getByText('Even')).toBeInTheDocument()
    expect(document.querySelector('[data-slot=diff-bar] .bg-accent')).toBeNull()
  })

  test('takes the margin as given, and a label as an eyebrow', () => {
    reduced(<DiffBar a={91.2} b={92.4} by="1.2 points" label="Accuracy" />)
    expect(screen.getByText('B is better by 1.2 points')).toBeInTheDocument()
    expect(document.querySelector('[data-slot=diff-bar-label]')).toHaveTextContent('Accuracy')
  })

  test('draws solid bars at their share with no cells', () => {
    reduced(<DiffBar a={25} b={100} segments={0} />)
    expect(document.querySelectorAll('[data-slot=diff-bar-cell]')).toHaveLength(0)
    expect(side('a').querySelector<HTMLElement>('[data-slot=diff-bar-fill]')!.style.scale).toBe('0.25 1')
  })

  test('stacked: two named rows on one scale; past the allowance the worse side’s cells turn danger', () => {
    reduced(<DiffBar layout="stacked" names={['Allowed', 'Quoted']} a={24} b={48} better="lower" segments={10} />)
    expect(document.querySelector('[data-slot=diff-bar]')).toHaveAttribute('data-variant', 'stacked')
    expect([...document.querySelectorAll('[data-slot=diff-bar-name]')].map((n) => n.textContent)).toEqual(['Allowed', 'Quoted'])
    const cells = (s: 'a' | 'b') => [...side(s).querySelectorAll('[data-slot=diff-bar-cell][data-state=on]')]
    expect(cells('a')).toHaveLength(5)
    expect(cells('a').every((c) => c.className.includes('bg-accent'))).toBe(true)
    expect(cells('b')).toHaveLength(10)
    expect(cells('b').slice(0, 5).every((c) => c.className.includes('bg-accent'))).toBe(true)
    expect(cells('b').slice(5).every((c) => c.className.includes('bg-danger'))).toBe(true)
    expect(document.querySelector('[data-slot=diff-bar-value][data-side=b]')!.className).toContain('own:text-danger-text')
    expect(screen.getByText('Allowed is better by 50%')).toBeInTheDocument()
  })

  test('stacked, solid: the shared part in the tone and the excess after it', () => {
    reduced(<DiffBar layout="stacked" a={30} b={60} better="lower" segments={0} />)
    const fills = [...side('b').querySelectorAll<HTMLElement>('[data-slot=diff-bar-fill]')]
    expect(fills.map((f) => f.dataset.part)).toEqual(['shared', 'excess'])
    expect(fills.map((f) => f.parentElement!.style.width)).toEqual(['50%', '50%'])
    expect(fills[1]!.parentElement!.style.insetInlineStart).toBe('50%')
    expect(side('a').querySelectorAll('[data-part=excess]')).toHaveLength(0)
  })

  test('lights nothing until it scrolls into view, unless motion is reduced', () => {
    render(<DiffBar a={50} b={100} segments={10} />)
    expect(lit('a') + lit('b')).toBe(0)
  })
})
