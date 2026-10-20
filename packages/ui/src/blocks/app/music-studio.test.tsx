import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { MusicStudio, type MusicStudioProps } from './music-studio'

const setup = (props: Partial<MusicStudioProps> = {}) =>
  render(
    <YoujProvider reducedMotion="always">
      <MusicStudio {...props} />
    </YoujProvider>,
  )

const dock = () => screen.getByRole('group', { name: 'Transport' })
const title = () => document.querySelector('[data-slot=capsule-player-title]')!

describe('MusicStudio', () => {
  test('the session, its lanes and the section playing', () => {
    setup()
    expect(screen.getByRole('heading', { level: 1, name: 'Night Swim' })).toBeInTheDocument()
    const lanes = within(screen.getByRole('list', { name: 'Arrangement' })).getAllByRole('list')
    expect(lanes.map((l) => l.getAttribute('aria-label'))).toEqual(['Drums', 'Bass', 'Keys', 'Lead', 'Vox'])
    expect(title()).toHaveTextContent('Drop')
    expect(title()).toHaveTextContent('Night Swim · bar 19')
    expect(document.querySelector('[data-slot=studio-section][data-current]')).toHaveTextContent('Drop')
    expect(within(dock()).getByRole('button', { name: 'Play' })).toBeInTheDocument()
  })

  test('skipping moves between sections, and back returns to the one before from its start', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(within(dock()).getByRole('button', { name: 'Next track' }))
    expect(title()).toHaveTextContent('Outro')
    expect(title()).toHaveTextContent('bar 25')
    await user.click(within(dock()).getByRole('button', { name: 'Previous track' }))
    expect(title()).toHaveTextContent('Drop')
    expect(title()).toHaveTextContent('bar 17')
  })

  test('the tempo, the snap and the loop are controls in the dock', async () => {
    const user = userEvent.setup()
    setup()
    const tempo = within(dock()).getByRole('textbox', { name: 'Tempo' })
    expect(tempo).toHaveValue('124')
    await user.click(within(dock()).getByRole('button', { name: 'Increase' }))
    expect(tempo).toHaveValue('125')
    await user.click(within(dock()).getByRole('button', { name: '1/16' }))
    expect(within(dock()).getByRole('button', { name: '1/16' })).toHaveAttribute('aria-pressed', 'true')
    const loop = within(dock()).getByRole('button', { name: 'Loop section' })
    await user.click(loop)
    expect(loop).toHaveAttribute('aria-pressed', 'true')
  })

  test('searching dims the clips that don’t match and says how many do', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByRole('searchbox', { name: 'Find a clip' }), 'hook')
    const clips = [...document.querySelectorAll('[data-slot=studio-clip]')]
    const lit = clips.filter((c) => !c.hasAttribute('data-dim')).map((c) => c.textContent)
    expect(lit).toEqual([expect.stringContaining('Hook'), expect.stringContaining('Hook echo')])
    expect(screen.getByRole('status')).toHaveTextContent('2 clips match “hook”')
    await user.clear(screen.getByRole('searchbox', { name: 'Find a clip' }))
    expect(document.querySelector('[data-slot=studio-clip][data-dim]')).toBeNull()
  })

  test('by default, a page of the app’s frame: the shared page header holds the session, its search and vitals, with no capsule or main of its own', () => {
    const { container } = setup({ copy: { transport: 'Transport-Leiste' } })
    expect(screen.queryByRole('main')).toBeNull()
    expect(document.querySelector('[data-slot=studio-session]')).toBeNull()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Night Swim' }))
    expect(header).toContainElement(screen.getByRole('searchbox', { name: 'Find a clip' }))
    expect(screen.getByRole('group', { name: 'Transport-Leiste' })).toBeInTheDocument()
  })

  test('standalone, it is a main named by the session’s capsule', () => {
    setup({ embedded: false })
    expect(screen.getByRole('main')).toContainElement(screen.getByRole('heading', { level: 1, name: 'Night Swim' }))
    expect(document.querySelector('[data-slot=studio-session]')).not.toBeNull()
  })
})
