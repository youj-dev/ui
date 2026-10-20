import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CollaborativeCanvas, type CollaborativeCanvasProps } from './collaborative-canvas'

const setup = (props: Partial<CollaborativeCanvasProps> = {}) =>
  render(
    <YoujProvider reducedMotion="always">
      <CollaborativeCanvas {...props} />
    </YoujProvider>,
  )

describe('CollaborativeCanvas', () => {
  test('the board under its breadcrumbs, with the cards, notes and pins of the review', () => {
    setup({ embedded: false })
    expect(screen.getByRole('heading', { level: 1, name: 'Q4 activation review' })).toBeInTheDocument()
    const path = screen.getByRole('navigation', { name: 'Board location' })
    expect(within(path).getByRole('link', { name: 'Growth' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Q4 activation review' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Embed: Sign-ups, last 14 days' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Embed: Activation, this month' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Sticky note: Are SSO sign-ups counted twice?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Comment 1 by Mara Lind' })).toBeInTheDocument()
    // The demo's collaborators, marked as a demo.
    expect(screen.getByText('Demo data')).toBeInTheDocument()
  })

  test('a pin opens its thread, where a reply is posted through onPost', async () => {
    const user = userEvent.setup()
    const onPost = vi.fn(async () => ({ id: 'saved', createdAt: Date.UTC(2026, 9, 12, 15, 30) }))
    setup({ onPost })
    await user.click(screen.getByRole('button', { name: 'Comment 2 by Theo Park' }))
    expect(await screen.findByText('SSO sign-ups land in both funnels, so the 7th may read high.')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'New comment' }), 'Deduping them now')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Comment' }))
    expect(onPost).toHaveBeenCalledWith(expect.objectContaining({ body: 'Deduping them now', threadId: null }))
  })

  test('with your data: your path, scene and people; no demo marker; copy rewrites strings', () => {
    setup({
      embedded: false,
      path: [{ label: 'Ops', href: '/ops' }, { label: 'Retro' }],
      defaultValue: { shapes: [{ id: 'a', type: 'sticky', color: 'red', width: 'medium', x: 0, y: 0, w: 200, h: 80, text: 'Queue backed up' }] },
      people: [{ id: 'sam', name: 'Sam', x: 10, y: 10 }],
      threads: {},
      copy: { share: 'Invite' },
    })
    expect(screen.getByRole('heading', { level: 1, name: 'Retro' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ops' })).toHaveAttribute('href', '/ops')
    expect(screen.getByRole('option', { name: 'Sticky note: Queue backed up' })).toBeInTheDocument()
    expect(screen.queryByText('Demo data')).toBeNull()
    expect(screen.getByRole('button', { name: 'Invite' })).toBeInTheDocument()
  })

  test('Share calls onShare and says the link was copied', async () => {
    const user = userEvent.setup()
    const onShare = vi.fn()
    setup({ onShare, people: [] })
    await user.click(screen.getByRole('button', { name: 'Share' }))
    expect(onShare).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: 'Link copied' })).toBeInTheDocument()
  })

  test('changes to the board go out through onValueChange', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    setup({ onValueChange, people: [] })
    act(() => screen.getByRole('option', { name: 'Sticky note: Ship the shorter trial email on Thursday' }).focus())
    await user.keyboard('{ArrowRight}')
    expect(onValueChange.mock.lastCall![0].shapes.find((s: { id: string }) => s.id === 'ship')).toMatchObject({ x: 921 })
  })

  test('by default, a page of the app’s frame: the shared page header holds the board’s name, who is here and Share, with no breadcrumbs or main of its own', () => {
    const { container } = setup({ people: [] })
    expect(screen.queryByRole('main')).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Board location' })).toBeNull()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Q4 activation review' }))
    expect(header).toContainElement(screen.getByRole('button', { name: 'Share' }))
    expect(screen.getByRole('group', { name: 'Q4 activation review' })).toBeInTheDocument()
  })
})
