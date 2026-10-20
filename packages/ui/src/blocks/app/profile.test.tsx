import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Profile } from './profile'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('profile block', () => {
  test('names the person, the sections and the aside', () => {
    reduced(<Profile embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Inês Duarte' })).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: 'Profile sections' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'About Inês' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Elsewhere' })).toBeInTheDocument()
  })

  test('following relabels the button and adds a follower', async () => {
    const user = userEvent.setup()
    reduced(<Profile embedded={false} />)
    expect(screen.getAllByText('12,480').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Follow' }))
    expect(screen.getByRole('button', { name: 'Following' })).toBeInTheDocument()
    expect(screen.getAllByText('12,481').length).toBeGreaterThan(0)
  })

  test('by default, a page of the app’s frame: the shared header titles it and holds the actions, the name sits one level below', () => {
    const { container } = reduced(
      <main>
        <Profile />
      </main>,
    )
    expect(screen.getAllByRole('main')).toHaveLength(1)
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Profile' }))
    expect(header).toContainElement(screen.getByRole('button', { name: 'Follow' }))
    expect(header).toContainElement(screen.getByRole('button', { name: 'Message' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Inês Duarte' })).toBeInTheDocument()
  })

  test('the Activity tab shows the heatmap and the timeline', async () => {
    const user = userEvent.setup()
    reduced(<Profile embedded={false} />)
    await user.click(screen.getByRole('tab', { name: 'Activity' }))
    expect(screen.getByRole('img', { name: /Contribution heatmap/ })).toBeInTheDocument()
    expect(screen.getByText('Released Maré Sans 2.0 with a variable axis')).toBeInTheDocument()
  })

  test('props drive the person, stats, work, links and copy', () => {
    reduced(
      <Profile
        embedded={false}
        user={{ name: 'Kofi Mensah', handle: 'kofi', location: 'Accra', bio: 'Builds synths.', url: 'https://kofi.dev' }}
        followers={90}
        stats={[{ label: 'Patches', value: 7 }]}
        work={[{ id: 'w1', name: 'Drift', meta: 'Synth · 2026', likes: 1200, glyph: 'Dr' }]}
        friends={[]}
        links={[{ label: 'kofi.dev', href: 'https://kofi.dev' }]}
        status={null}
        skills={['DSP']}
        copy={{ follow: 'Subscribe', workTab: 'Patches' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Kofi Mensah' })).toBeInTheDocument()
    expect(screen.getByText('@kofi')).toBeInTheDocument()
    expect(screen.getByText('Builds synths.')).toBeInTheDocument()
    expect(screen.getByText('Patches', { selector: 'dt' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Patches' })).toBeInTheDocument()
    expect(screen.getByText('Drift')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /kofi\.dev/ })).toHaveAttribute('href', 'https://kofi.dev')
    expect(screen.queryByText('Followed by')).not.toBeInTheDocument()
    expect(screen.queryByText('Open for commissions')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument()
  })

  test('follow is controllable and the actions call back', async () => {
    const user = userEvent.setup()
    const onFollowingChange = vi.fn()
    const onMessage = vi.fn()
    const onCopyLink = vi.fn()
    reduced(<Profile embedded={false} following onFollowingChange={onFollowingChange} onMessage={onMessage} onCopyLink={onCopyLink} />)
    await user.click(screen.getByRole('button', { name: 'Following' }))
    expect(onFollowingChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole('button', { name: 'Following' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Message' }))
    expect(onMessage).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Copy link' }))
    expect(onCopyLink).toHaveBeenCalledWith('https://fundicao.type/@inesduarte')
  })
})
