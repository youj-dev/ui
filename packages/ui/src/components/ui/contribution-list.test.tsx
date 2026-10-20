import { render, screen, within } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ContributionList, runningTotals } from './contribution-list'

const ITEMS = [
  { label: 'Launch post', detail: 'Goes out Tuesday', value: 310 },
  { label: 'Referral credit', value: 145 },
  { label: 'Price change', value: -120 },
]

const reduced = (ui: React.ReactNode) => <YoujProvider reducedMotion="always">{ui}</YoujProvider>
const values = () => [...document.querySelectorAll('[data-slot=contribution-list-value]')].map((v) => v.textContent)

describe('ContributionList', () => {
  test('an ordered list: the baseline, each signed step, then the total', () => {
    render(<ContributionList baseline={{ label: 'A normal week', value: 1840 }} items={ITEMS} total={{ label: 'Expected' }} aria-label="Signups" />)
    const rows = within(screen.getByRole('list', { name: 'Signups' })).getAllByRole('listitem')
    expect(screen.getByRole('list').tagName).toBe('OL')
    expect(rows.map((r) => r.textContent)).toEqual(['A normal week1,840', 'Launch postGoes out Tuesday+310', 'Referral credit+145', 'Price change-120', 'Expected2,175'])
  })

  test('the numbers add up: the total is the baseline plus every step', () => {
    const steps = [{ label: 'a', value: 22 }, { label: 'b', value: 14 }, { label: 'c', value: 9 }, { label: 'd', value: 6 }, { label: 'e', value: -3 }]
    render(<ContributionList baseline={{ label: 'Typical', value: 264 }} items={steps} total={{ label: 'Forecast' }} />)
    const shown = values().map((v) => Number(v!.replace(/[^\d-]/g, '')))
    const [base, ...rest] = shown
    const total = rest.pop()!
    expect(base! + rest.reduce((a, b) => a + b, 0)).toBe(total)
    expect(total).toBe(312)
    expect(runningTotals(264, steps)).toEqual([264, 286, 300, 309, 315, 312])
  })

  test('formats every figure with the given options and locale; steps keep their sign, zero has none', () => {
    render(
      <YoujProvider locale="de-DE">
        <ContributionList
          baseline={{ label: 'September', value: 18420 }}
          items={[{ label: 'Reserved', value: -3150 }, { label: 'Flat', value: 0 }]}
          total={{ label: 'October' }}
          format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }}
        />
      </YoujProvider>,
    )
    expect(values()).toEqual(['18.420 €', '-3.150 €', '0 €', '15.270 €'])
  })

  test('each step’s mark spans from where the figure was to where it went, in the good or bad ink', () => {
    render(reduced(<ContributionList baseline={{ label: 'Base', value: 100 }} items={[{ label: 'Up', value: 50 }, { label: 'Down', value: -100 }]} total={{ label: 'Total' }} />))
    // Running totals 100 → 150 → 50: the scale runs 50 to 150.
    const [up, down] = [...document.querySelectorAll<HTMLElement>('[data-slot=contribution-list-step]')]
    expect(up!.style.insetInlineStart).toBe('50%')
    expect(up!.style.width).toBe('max(50%, 2px)')
    expect(up!.className).toContain('own:bg-success')
    expect(down!.style.insetInlineStart).toBe('0%')
    expect(down!.style.width).toBe('max(100%, 2px)')
    expect(down!.className).toContain('own:bg-danger')
    for (const mark of document.querySelectorAll('[data-slot=contribution-list-mark]')) expect(mark).toHaveAttribute('aria-hidden', 'true')
  })

  test('invert: a fall is good news', () => {
    render(reduced(<ContributionList invert baseline={{ label: 'Bill', value: 100 }} items={[{ label: 'Saving', value: -20 }]} total={{ label: 'Next' }} />))
    expect(document.querySelector('[data-slot=contribution-list-step]')!.className).toContain('own:bg-success')
    expect(document.querySelector('[data-slot=contribution-list-item]')).toHaveAttribute('data-direction', 'down')
  })

  test('marks={false} draws no marks', () => {
    render(<ContributionList marks={false} baseline={{ label: 'Base', value: 1 }} items={ITEMS} total={{ label: 'Total' }} />)
    expect(document.querySelector('[data-slot=contribution-list-mark]')).toBeNull()
  })
})
