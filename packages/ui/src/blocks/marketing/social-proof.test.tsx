import { forwardRef } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { SocialProof } from './social-proof'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const TITLE = 'Trusted by 40,000 teams, loved by the ones who ship the most'

describe('SocialProof', () => {
  test('is a labelled section whose rating summary says its score, split and sources in words', () => {
    reduced(<SocialProof />)
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: TITLE })).toBeInTheDocument()
    const summary = screen.getByRole('group', { name: 'Customer rating' })
    expect(within(summary).getByText('4.8 out of 5')).toBeInTheDocument()
    expect(within(summary).getByText('from 2,314 reviews')).toBeInTheDocument()
    expect(within(summary).getByRole('listitem', { name: '5 stars: 78%' })).toBeInTheDocument()
    expect(within(summary).getByRole('listitem', { name: '1 star: 1%' })).toBeInTheDocument()
    expect(within(summary).getByText('TrustRadius').nextElementSibling).toHaveTextContent('4.9')
  })

  test('the industry filter re-flows the wall, and All brings every customer back', async () => {
    const user = userEvent.setup()
    const onIndustryChange = vi.fn()
    reduced(<SocialProof onIndustryChange={onIndustryChange} />)
    const filter = screen.getByRole('group', { name: 'Filter customers by industry' })
    expect(screen.getByRole('list', { name: 'Customers, All' })).toBeInTheDocument()
    await user.click(within(filter).getByRole('button', { name: 'Fintech' }))
    expect(onIndustryChange).toHaveBeenCalledWith('Fintech')
    const wall = screen.getByRole('list', { name: 'Customers, Fintech' })
    await waitFor(() => expect(within(wall).queryByRole('img', { name: 'Arcadia' })).not.toBeInTheDocument())
    expect(within(wall).getByRole('img', { name: 'Vertex' })).toBeInTheDocument()
    expect(within(wall).getByRole('button', { name: 'Northstar: read the story' })).toBeInTheDocument()
    await user.click(within(filter).getByRole('button', { name: 'All' }))
    expect(onIndustryChange).toHaveBeenLastCalledWith('')
    await waitFor(() => expect(screen.getByRole('img', { name: 'Arcadia' })).toBeInTheDocument())
  })

  test('a controlled industry with no customers says so', () => {
    reduced(<SocialProof industry="Space" />)
    expect(screen.getByText('No customers in this industry yet.')).toBeInTheDocument()
  })

  test('choosing a customer logo with a story opens it; the story tabs work from the keyboard', async () => {
    const user = userEvent.setup()
    const onStoryChange = vi.fn()
    reduced(<SocialProof onStoryChange={onStoryChange} />)
    expect(screen.getByRole('heading', { level: 3, name: 'How Lumen moved 140 services in a quarter' })).toBeInTheDocument()
    const lumen = screen.getByRole('button', { name: 'Lumen: read the story' })
    expect(lumen).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Helix: read the story' }))
    expect(onStoryChange).toHaveBeenCalledWith('helix')
    expect(screen.getByRole('heading', { level: 3, name: 'Helix found a regression the CDN was blamed for' })).toBeInTheDocument()
    expect(lumen).toHaveAttribute('aria-pressed', 'false')
    const tabs = screen.getByRole('tablist', { name: 'Customer stories' })
    const helix = within(tabs).getByRole('tab', { name: 'Helix' })
    expect(helix).toHaveAttribute('aria-selected', 'true')
    helix.focus()
    await user.keyboard('{ArrowLeft}')
    expect(within(tabs).getByRole('tab', { name: 'Northstar' })).toHaveAttribute('aria-selected', 'true')
    expect(onStoryChange).toHaveBeenLastCalledWith('northstar')
  })

  test('the open story names its results and links to the full story', () => {
    reduced(<SocialProof defaultStory="northstar" />)
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(expect.arrayContaining(['median rollback', 'fewer incident minutes', 'regions, one deploy']))
    expect(screen.getByRole('link', { name: /Read the story/ })).toHaveAttribute('href', '#story-northstar')
  })

  test('the open story is one panel: its customer, headline, quote and who said it; quotes live on the Testimonial wall', () => {
    reduced(<SocialProof />)
    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByRole('heading', { level: 3, name: 'How Lumen moved 140 services in a quarter' })).toBeInTheDocument()
    expect(within(panel).getByRole('figure')).toHaveTextContent('Mara Okafor')
    expect(screen.queryByRole('region', { name: 'What customers say' })).not.toBeInTheDocument()
  })

  test('numbers are written in the given locale', () => {
    reduced(<SocialProof locale="de-DE" />)
    expect(screen.getByText('from 2.314 reviews')).toBeInTheDocument()
  })

  test('loading shows skeletons instead of the wall', () => {
    reduced(<SocialProof loading />)
    expect(screen.queryByRole('img', { name: 'Lumen' })).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /Customers/ })).not.toBeInTheDocument()
  })

  test('your data replaces the demo: logos, stories and rating; rating={null} hides the summary; one story needs no tabs', () => {
    reduced(
      <SocialProof
        rating={null}
        logos={[
          { name: 'Fernhill', industry: 'Coffee' },
          { name: 'Marlowe', industry: 'Coffee' },
        ]}
        stories={[
          {
            id: 'fernhill',
            customer: 'Fernhill',
            headline: 'Fernhill roasts on demand',
            quote: 'Every order is roasted the day it ships.',
            author: { name: 'Ines Duarte', role: 'Founder, Fernhill' },
            metrics: [{ value: 3, label: 'days faster' }],
            href: '/stories/fernhill',
          },
        ]}
        copy={{ title: 'Who pours our coffee' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Who pours our coffee' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Customer rating' })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Filter customers by industry' })).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Marlowe' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Read the story/ })).toHaveAttribute('href', '/stories/fernhill')
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })

  test('the story link renders through linkComponent', () => {
    const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    reduced(<SocialProof linkComponent={RouterLink} />)
    expect(screen.getByRole('link', { name: /Read the story/ })).toHaveAttribute('data-router')
  })

  test('headingLevel moves the title and the story’s heading together; rest props reach the root', () => {
    reduced(<SocialProof headingLevel={1} id="proof" />)
    expect(screen.getByRole('heading', { level: 1, name: TITLE })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /Lumen/ })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: TITLE })).toHaveAttribute('id', 'proof')
  })

  test('embedded: no page padding; a theme renders it inside a ThemeScope', () => {
    reduced(<SocialProof embedded theme={brutal} />)
    const section = screen.getByRole('region', { name: TITLE })
    expect(section.className).not.toMatch(/py-20/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
  })
})
