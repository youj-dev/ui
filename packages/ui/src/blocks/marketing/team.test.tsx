import { forwardRef } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { graphite } from '@youj/core'
import { MarketingTeam } from './team'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
// 13:05 UTC: afternoon in Lisbon, night in Tokyo.
const NOW = Date.UTC(2026, 9, 10, 13, 5)

describe('Team', () => {
  test('a labeled section of people, each an article named for them with role, place and local time', () => {
    reduced(<MarketingTeam now={NOW} locale="en-GB" />)
    expect(screen.getByRole('region', { name: 'The people behind it' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(8)
    const ines = screen.getByRole('article', { name: 'Ines Duarte' })
    expect(within(ines).getByText('Co-founder and CEO')).toBeInTheDocument()
    expect(within(ines).getByText('14:05 in Lisbon')).toBeInTheDocument()
    expect(within(ines).getByRole('img', { name: 'Daytime' })).toBeInTheDocument()
    expect(within(screen.getByRole('article', { name: 'Kenji Mori' })).getByRole('img', { name: 'Night-time' })).toBeInTheDocument()
  })

  test('the name pins the bio open: its links join the tab order, and Escape lets it go', async () => {
    const user = userEvent.setup()
    reduced(<MarketingTeam now={NOW} />)
    const ines = screen.getByRole('article', { name: 'Ines Duarte' })
    const name = within(ines).getByRole('button', { name: 'Ines Duarte' })
    const link = within(ines).getByRole('link', { name: 'Ines Duarte on LinkedIn', hidden: true })
    expect(name).toHaveAttribute('aria-expanded', 'false')
    expect(link).toHaveAttribute('tabindex', '-1')
    await user.click(name)
    expect(name).toHaveAttribute('aria-expanded', 'true')
    expect(within(ines).getByRole('link', { name: 'Ines Duarte on LinkedIn' })).not.toHaveAttribute('tabindex')
    expect(within(ines).getByText(/Built her first deploy pipeline/)).toBeVisible()
    await user.keyboard('{Escape}')
    expect(name).toHaveAttribute('aria-expanded', 'false')
  })

  test('the team filter counts and re-flows the grid, and Everyone brings the rest back', async () => {
    const user = userEvent.setup()
    const onTeamChange = vi.fn()
    reduced(<MarketingTeam onTeamChange={onTeamChange} />)
    const filter = screen.getByRole('group', { name: 'Filter people by team' })
    expect(within(filter).getByRole('button', { name: /Design/ })).toHaveTextContent('Design2')
    await user.click(within(filter).getByRole('button', { name: /Design/ }))
    expect(onTeamChange).toHaveBeenCalledWith('Design')
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2))
    await user.click(within(filter).getByRole('button', { name: /Everyone/ }))
    expect(onTeamChange).toHaveBeenLastCalledWith('')
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(8))
  })

  test('a controlled team with nobody says so', () => {
    reduced(<MarketingTeam team="Legal" />)
    expect(screen.getByText('Nobody on this team yet.')).toBeInTheDocument()
  })

  test('your people, copy, link and heading level drive it; a photo replaces the initials', () => {
    const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    reduced(
      <MarketingTeam
        people={[{ id: 'sam', name: 'Sam Lee', role: 'Head roaster', team: 'Roastery', photo: '/sam.jpg' }]}
        copy={{ title: 'The roastery' }}
        cta={{ label: 'Work with us', href: '/jobs' }}
        linkComponent={RouterLink}
        headingLevel={3}
      />,
    )
    expect(screen.getByRole('heading', { level: 3, name: 'The roastery' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Sam Lee' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Work with us/ })).toHaveAttribute('data-router')
    expect(screen.getByRole('article').querySelector('img')).toHaveAttribute('src', '/sam.jpg')
    // One team: nothing to filter.
    expect(screen.queryByRole('group', { name: 'Filter people by team' })).not.toBeInTheDocument()
  })

  test('cta={null} hides the link; theme, embedded and rest props apply', () => {
    reduced(<MarketingTeam cta={null} theme={graphite} embedded id="team" />)
    expect(screen.queryByRole('link', { name: /Meet all/ })).not.toBeInTheDocument()
    const section = screen.getByRole('region', { name: 'The people behind it' })
    expect(section).toHaveAttribute('id', 'team')
    expect(section.className).not.toMatch(/py-20/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
  })
})
