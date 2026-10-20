import { forwardRef } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { CustomerStory } from './customer-story'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const TITLE = 'How Lumen stopped freezing deploys before sale day'

describe('CustomerStory', () => {
  test('an article named by its headline, with the customer, the summary and the facts', () => {
    reduced(<CustomerStory />)
    expect(screen.getByRole('article', { name: TITLE })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: TITLE })).toBeInTheDocument()
    expect(screen.getByText('Lumen', { selector: 'span' })).toBeInTheDocument()
    const facts = screen.getByLabelText('About the customer')
    expect(within(facts).getAllByRole('term').map((t) => t.textContent)).toEqual(['Industry', 'Team', 'Traffic', 'Uses'])
  })

  test('each result states where it is now, the change in words and where it started', () => {
    reduced(<CustomerStory />)
    const results = screen.getByRole('region', { name: 'The results' })
    expect(within(results).getAllByRole('term').map((t) => t.textContent)).toEqual([
      'Checkout p95',
      'Deploys a day',
      'Incident minutes a quarter',
      'Days from idea to production',
    ])
    expect(within(results).getByText('Down 61%')).toBeInTheDocument()
    expect(within(results).getByText('Up 1,100%')).toBeInTheDocument()
    expect(within(results).getByText('From 540 ms')).toBeInTheDocument()
  })

  test('a falling number is good where fewer is better, and a rising one where more is', () => {
    reduced(<CustomerStory />)
    const results = screen.getByRole('region', { name: 'The results' })
    expect(within(results).getByText('Down 61%').parentElement).toHaveClass('text-success-text')
    expect(within(results).getByText('Up 1,100%').parentElement).toHaveClass('text-success-text')
    reduced(
      <CustomerStory
        metrics={[{ label: 'Churn', before: 2, after: 3, better: 'down' }]}
        chapters={[]}
        facts={[]}
        next={null}
        primaryCta={null}
      />,
    )
    expect(screen.getByText('Up 50%').parentElement).toHaveClass('text-danger-text')
  })

  test('the story is in chapters with a contents that links to each, and a pull quote follows the second', () => {
    reduced(<CustomerStory />)
    const nav = screen.getByRole('navigation', { name: 'In this story' })
    expect(within(nav).getAllByRole('link').map((a) => a.textContent)).toEqual(['A freeze every sale day', 'Move a service at a time', 'Sale day became a Tuesday'])
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings.slice(0, 3)).toEqual(['A freeze every sale day', 'Move a service at a time', 'Sale day became a Tuesday'])
    const quote = screen.getByRole('figure', { name: 'What they said' })
    expect(quote).toHaveTextContent('Mara Okafor')
    const second = screen.getByRole('heading', { name: 'Move a service at a time' }).closest('section')!
    expect(second.nextElementSibling).toBe(quote)
  })

  test('chapter ids are unique to this instance', () => {
    const { container } = reduced(
      <>
        <CustomerStory />
        <CustomerStory />
      </>,
    )
    const ids = [...container.querySelectorAll('section[id]')].map((el) => el.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('the next story and the calls to action are links, through linkComponent, firing onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    reduced(<CustomerStory linkComponent={RouterLink} next={{ customer: 'Helix', title: 'Helix found a regression', href: '/stories/helix', onClick }} />)
    const next = screen.getByRole('link', { name: /Helix found a regression/ })
    expect(next).toHaveAttribute('data-router')
    expect(next).toHaveAttribute('href', '/stories/helix')
    await user.click(next)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: 'Talk to us' })).toHaveAttribute('href', '#contact')
    expect(screen.getByRole('link', { name: 'Start free' })).toHaveAttribute('href', '#signup')
  })

  test('your own story replaces the demo; parts can be left out', () => {
    reduced(
      <CustomerStory
        customer={{ name: 'Fernhill', industry: 'Coffee' }}
        headline="Fernhill roasts to order"
        summary="Small batches, same day."
        facts={[{ label: 'Founded', value: '2019' }]}
        metrics={[{ label: 'Orders a week', before: 40, after: 220 }]}
        chapters={[{ id: 'story', heading: 'The whole story', paragraphs: ['It began in a garage.'] }]}
        quote={null}
        next={null}
        primaryCta={{ label: 'Visit', href: '/visit' }}
        secondaryCta={null}
        locale="de-DE"
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Fernhill roasts to order' })).toBeInTheDocument()
    expect(screen.getByText('It began in a garage.')).toBeInTheDocument()
    expect(screen.queryByRole('figure')).not.toBeInTheDocument()
    expect(screen.getByText(/^Up 450\s%/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Visit' })).toHaveAttribute('href', '/visit')
    expect(screen.queryByRole('link', { name: 'Start free' })).not.toBeInTheDocument()
  })

  test('copy rewrites the strings; headingLevel and rest props apply; embedded and theme', () => {
    reduced(<CustomerStory embedded theme={brutal} headingLevel={1} id="story" copy={{ resultsTitle: 'Numbers', onThisPage: 'Contents' }} />)
    const article = screen.getByRole('article', { name: TITLE })
    expect(article).toHaveAttribute('id', 'story')
    expect(article.className).not.toMatch(/py-20/)
    expect(article.closest('[data-yj-theme]')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: TITLE })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Numbers' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Contents' })).toBeInTheDocument()
  })
})
