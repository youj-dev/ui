import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { brutal, YoujProvider } from '@youj/core'
import { CtaProof } from './cta-proof'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const TITLE = 'Every team here started with one deploy'
const lines = () => within(screen.getByRole('list', { name: 'Measured a quarter after moving' })).getAllByRole('button')
const quotes = () => screen.getAllByRole('figure', { hidden: true })
const shownQuote = () => quotes().find((q) => q.getAttribute('aria-hidden') === 'false')

describe('CTA proof', () => {
  test('names the section, the ledger’s four lines and both ways forward', () => {
    reduced(<CtaProof />)
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument()
    expect(lines().map((b) => b.textContent)).toEqual([
      expect.stringContaining('Arcadia'),
      expect.stringContaining('Lumen'),
      expect.stringContaining('Vertex'),
      expect.stringContaining('Tandem'),
    ])
    expect(screen.getByRole('link', { name: /Start free/ })).toHaveAttribute('href', '#signup')
    expect(screen.getByRole('link', { name: /Talk to sales/ })).toHaveAttribute('href', '#sales')
  })

  test('each line reads as a sentence: the measure, from before to after, and the change', () => {
    reduced(<CtaProof />)
    const [arcadia, , , tandem] = lines()
    for (const part of ['Incident recovery', ', from 42 min', ' to 48 s', '−98']) expect(arcadia).toHaveTextContent(part, { normalizeWhitespace: false })
    for (const part of ['Deploys per day', ', from 6', ' to 84', '14']) expect(tandem).toHaveTextContent(part, { normalizeWhitespace: false })
  })

  test('one line is pressed at a time, and its quote is the one shown; the rest are hidden and inert', () => {
    reduced(<CtaProof />)
    expect(lines().map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false', 'false'])
    expect(quotes()).toHaveLength(4)
    expect(quotes().filter((q) => q.hasAttribute('inert'))).toHaveLength(3)
    expect(shownQuote()).toHaveTextContent('Theo Brandt')
  })

  test('picking a line swaps the quote, and only then is the quote announced', async () => {
    const user = userEvent.setup()
    reduced(<CtaProof />)
    const region = shownQuote()!.parentElement!
    expect(region).toHaveAttribute('aria-live', 'off')
    await user.click(lines()[2]!)
    expect(lines()[2]).toHaveAttribute('aria-pressed', 'true')
    expect(lines()[0]).toHaveAttribute('aria-pressed', 'false')
    expect(shownQuote()).toHaveTextContent('Priya Raman')
    expect(region).toHaveAttribute('aria-live', 'polite')
    for (const line of lines()) expect(line).toHaveAttribute('aria-controls', region.id)
  })

  test('the keyboard reaches every line and picks with Enter or Space', async () => {
    const user = userEvent.setup()
    reduced(<CtaProof />)
    lines()[0]!.focus()
    await user.tab()
    expect(lines()[1]).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(shownQuote()).toHaveTextContent('Mara Okafor')
    await user.tab()
    await user.keyboard(' ')
    expect(shownQuote()).toHaveTextContent('Priya Raman')
  })

  test('defaultQuote picks the line it opens on, wrapping past the end', () => {
    const { unmount } = reduced(<CtaProof defaultQuote={3} />)
    expect(shownQuote()).toHaveTextContent('Jonas Ek')
    unmount()
    reduced(<CtaProof defaultQuote={5} />)
    expect(lines()[1]).toHaveAttribute('aria-pressed', 'true')
  })

  test('customers, logos, CTAs, copy and linkComponent drive the ledger', async () => {
    const onClick = vi.fn()
    const Link = (p: React.ComponentProps<'a'>) => <a {...p} data-router="" />
    reduced(
      <CtaProof
        customers={[
          { id: 'a', company: 'Harbor', measure: 'Disputes', before: '212', after: '19', change: { value: -0.91, kind: 'share' }, quote: 'No more calls.', name: 'Ines Duarte', role: 'Controller' },
          { id: 'b', company: 'Atlas', measure: 'Days to close', before: '11', after: '3', change: { value: 3, kind: 'times' }, quote: 'It is a Tuesday.', name: 'Ken Mori', role: 'CFO' },
        ]}
        logos={[]}
        primaryCta={{ label: 'Book a demo', href: '#demo', onClick }}
        secondaryCta={null}
        linkComponent={Link}
        headingLevel={3}
        copy={{ title: 'Finance teams', readerName: 'Your finance team', linesLabel: 'Six months in' }}
        id="proof"
      />,
    )
    expect(screen.getByRole('heading', { level: 3, name: 'Finance teams' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Finance teams' })).toHaveAttribute('id', 'proof')
    const ledger = within(screen.getByRole('list', { name: 'Six months in' })).getAllByRole('button')
    expect(ledger.map((b) => b.textContent)).toEqual([expect.stringContaining('Harbor'), expect.stringContaining('Atlas')])
    expect(shownQuote()).toHaveTextContent('Ines Duarte')
    expect(screen.getByText('Your finance team')).toBeInTheDocument()
    expect(screen.queryByText(/more teams/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(1)
    const cta = screen.getByRole('link', { name: /Book a demo/ })
    expect(cta).toHaveAttribute('data-router')
    await userEvent.setup().click(cta)
    expect(onClick).toHaveBeenCalledOnce()
  })

  test('the quote can be controlled', async () => {
    const user = userEvent.setup()
    const onQuoteChange = vi.fn()
    reduced(<CtaProof quote={1} onQuoteChange={onQuoteChange} />)
    expect(shownQuote()).toHaveTextContent('Mara Okafor')
    await user.click(lines()[3]!)
    expect(onQuoteChange).toHaveBeenCalledWith(3)
    expect(shownQuote()).toHaveTextContent('Mara Okafor')
  })

  test('reduced motion: the total rule is drawn and the reader’s line is in place', () => {
    const { container } = reduced(<CtaProof />)
    const rule = container.querySelector('.border-y[aria-hidden]')
    expect(rule).toHaveClass('scale-x-100')
    expect(screen.getByText('Your team')).toBeVisible()
  })

  test('embedded, it drops the page padding; a theme adds a ThemeScope', () => {
    const scopes = (ui: React.ReactNode) => {
      const view = reduced(ui)
      const n = view.container.querySelectorAll('[data-yj-theme]').length
      view.unmount()
      return n
    }
    expect(scopes(<CtaProof theme={brutal} />)).toBe(scopes(<CtaProof />) + 1)
    reduced(<CtaProof embedded />)
    expect(screen.getByRole('region', { name: TITLE })).not.toHaveClass('py-20')
  })
})
