import { forwardRef } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { graphite } from '@youj/core'
import { Careers, type CareersRole } from './careers'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const NOW = new Date('2026-10-10T12:00:00Z')
const ROLES: CareersRole[] = [
  {
    id: 'roaster',
    title: 'Roaster',
    team: 'Roastery',
    location: 'Leeds',
    type: 'Full-time',
    salary: '£28–32k',
    posted: '2026-10-05',
    href: '/jobs/roaster',
  },
  { id: 'rider', title: 'Delivery rider', team: 'Wholesale', location: 'Leeds', type: 'Part-time', posted: '2026-08-01', href: '/jobs/rider' },
  {
    id: 'buyer',
    title: 'Green coffee buyer',
    team: 'Wholesale',
    location: 'Remote, Europe',
    remote: true,
    type: 'Full-time',
    salary: '£40–48k',
    href: '/jobs/buyer',
  },
]
const titles = () => screen.queryAllByRole('link', { name: /Full-time|Part-time/ }).map((a) => a.getAttribute('href'))

describe('Careers', () => {
  test('a labeled section: the perks, then the roles under their teams, each one link named with its place and kind', () => {
    reduced(<Careers roles={ROLES} now={NOW} />)
    expect(screen.getByRole('region', { name: 'Come build it with us' })).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'What you get' })).getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Roastery', 'Wholesale'])
    expect(screen.getByRole('link', { name: 'Roaster, Leeds, Full-time' })).toHaveAttribute('href', '/jobs/roaster')
    expect(screen.getByText('3 open roles')).toHaveAttribute('role', 'status')
  })

  test('roles from the last fortnight say New', () => {
    reduced(<Careers roles={ROLES} now={NOW} />)
    expect(within(screen.getByRole('link', { name: /^Roaster/ })).getByText('New')).toBeInTheDocument()
    expect(within(screen.getByRole('link', { name: /^Delivery rider/ })).queryByText('New')).not.toBeInTheDocument()
  })

  test('the team tabs count and narrow the list', async () => {
    const user = userEvent.setup()
    const onTeamChange = vi.fn()
    reduced(<Careers roles={ROLES} onTeamChange={onTeamChange} />)
    const tabs = screen.getByRole('group', { name: 'Teams' })
    expect(
      within(tabs)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['All roles3', 'Roastery1', 'Wholesale2'])
    await user.click(within(tabs).getByRole('button', { name: /Wholesale/ }))
    expect(onTeamChange).toHaveBeenCalledWith('Wholesale')
    await waitFor(() => expect(titles()).toEqual(['/jobs/rider', '/jobs/buyer']))
  })

  test('the search marks what it found and Escape clears it; the location keeps only that place', async () => {
    const user = userEvent.setup()
    const onQueryChange = vi.fn()
    const onLocationChange = vi.fn()
    reduced(<Careers roles={ROLES} onQueryChange={onQueryChange} onLocationChange={onLocationChange} />)
    const field = screen.getByRole('searchbox', { name: 'Search roles' })
    await user.type(field, 'coffee')
    expect(onQueryChange).toHaveBeenLastCalledWith('coffee')
    await waitFor(() => expect(titles()).toEqual(['/jobs/buyer']))
    expect(document.querySelector('mark')).toHaveTextContent('coffee')
    await user.keyboard('{Escape}')
    expect(field).toHaveValue('')
    await user.click(screen.getByRole('combobox', { name: 'Location' }))
    await user.click(await screen.findByRole('option', { name: 'Remote' }))
    expect(onLocationChange).toHaveBeenCalledWith('remote')
    await waitFor(() => expect(titles()).toEqual(['/jobs/buyer']))
  })

  test('nothing matching says so and clears back; no roles leaves the open application', async () => {
    const user = userEvent.setup()
    const { unmount } = reduced(<Careers roles={ROLES} defaultQuery="pilot" />)
    expect(screen.getByText('No roles match')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    await waitFor(() => expect(titles()).toHaveLength(3))
    unmount()
    reduced(<Careers roles={[]} />)
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Send an open application/ })).toHaveAttribute('href', '#apply')
  })

  test('linkComponent renders every link; copy, cta, theme, embedded and rest props apply', () => {
    const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    reduced(
      <Careers
        roles={ROLES}
        linkComponent={RouterLink}
        copy={{ title: 'Roast with us' }}
        cta={{ label: 'Write to us', href: '/jobs/open' }}
        theme={graphite}
        embedded
        id="jobs"
      />,
    )
    expect(screen.getByRole('link', { name: 'Roaster, Leeds, Full-time' })).toHaveAttribute('data-router')
    expect(screen.getByRole('link', { name: /Write to us/ })).toHaveAttribute('href', '/jobs/open')
    const section = screen.getByRole('region', { name: 'Roast with us' })
    expect(section).toHaveAttribute('id', 'jobs')
    expect(section.className).not.toMatch(/py-20/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
  })
})
