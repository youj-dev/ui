import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { RadialNetwork } from './radial-network'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const stat = (name: string) => screen.getByText(name, { selector: '[data-slot=eyebrow]' }).closest('div')!.querySelector('dd')!

describe('RadialNetwork', () => {
  test('draws the center and what it reaches, named, as a section with an h2', () => {
    reduced(<RadialNetwork />)
    expect(screen.getByRole('heading', { level: 2, name: 'Blast radius' })).toBeInTheDocument()
    expect(screen.getByText('From a.moreau')).toBeInTheDocument()
    const graph = screen.getByRole('group', { name: 'What a.moreau reaches' })
    expect(graph).toHaveAccessibleDescription('18 linked to a.moreau within 2 hops.')
    expect(within(graph).getByRole('listitem', { name: 'invoice-exports, 2 hops away' })).toHaveAccessibleDescription(
      'At risk. Readable with the new token',
    )
  })

  test('the foot counts what is compromised, at risk and reached', () => {
    reduced(<RadialNetwork />)
    expect(stat('Compromised')).toHaveTextContent('4')
    expect(stat('At risk')).toHaveTextContent('5')
    expect(stat('Entities')).toHaveTextContent('18')
  })

  test('picking one hop folds the outer ring and counts only what is left', async () => {
    const user = userEvent.setup()
    const onHopsChange = vi.fn()
    reduced(<RadialNetwork onHopsChange={onHopsChange} />)
    await user.click(screen.getByRole('button', { name: '1 hop' }))
    expect(onHopsChange).toHaveBeenCalledWith(1)
    expect(screen.getByRole('group', { name: 'What a.moreau reaches' })).toHaveAccessibleDescription('6 linked to a.moreau within 1 hop.')
    expect(stat('At risk')).toHaveTextContent('0')
    expect(stat('Entities')).toHaveTextContent('6')
  })

  test('the key names every state and kind', () => {
    reduced(<RadialNetwork />)
    expect(
      within(screen.getByRole('list', { name: 'States' }))
        .getAllByRole('listitem')
        .map((i) => i.textContent),
    ).toEqual(['Compromised', 'At risk', 'Clean'])
    expect(within(screen.getByRole('list', { name: 'Kinds' })).getAllByRole('listitem')).toHaveLength(5)
  })

  test('your center, nodes and words drive the content; one ring needs no hop picker', () => {
    reduced(
      <RadialNetwork
        center={{ id: 'k', name: 'deploy-key', kind: 'code', state: 'compromised' }}
        kinds={[{ id: 'code', label: 'Code', tone: 'chart-2' }]}
        nodes={[
          { id: 'a', name: 'web-app', kind: 'code', state: 'compromised' },
          { id: 'b', name: 'docs-site', kind: 'code', state: 'clean' },
        ]}
        copy={{ title: 'Reach', total: 'Things' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Reach' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Rings' })).not.toBeInTheDocument()
    expect(stat('Compromised')).toHaveTextContent('1')
    expect(stat('Things')).toHaveTextContent('2')
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<RadialNetwork embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Blast radius' })).toBeInTheDocument()
  })

  test('your states drive the key, the rings and the foot', () => {
    reduced(
      <RadialNetwork
        center={{ id: 'c', name: 'Lena', kind: 'k' }}
        kinds={[{ id: 'k', label: 'Social', tone: 'chart-2' }]}
        states={[
          { id: 'sub', label: 'Subscribed', ring: 'solid', tone: 'success', count: true, emphasis: true },
          { id: 'trial', label: 'Trial', ring: 'dashed', tone: 'warning', count: true },
          { id: 'seen', label: 'Visited' },
        ]}
        nodes={[
          { id: 'a', name: 'ana', kind: 'k', state: 'sub' },
          { id: 'b', name: 'bo', kind: 'k', state: 'trial', note: 'Ends Friday' },
          { id: 'c2', name: 'cy', kind: 'k', state: 'seen' },
          { id: 'd', name: 'di', kind: 'k' },
        ]}
        copy={{ total: 'People' }}
      />,
    )
    expect(
      within(screen.getByRole('list', { name: 'States' }))
        .getAllByRole('listitem')
        .map((i) => i.textContent),
    ).toEqual(['Subscribed', 'Trial', 'Visited'])
    expect(screen.getByRole('listitem', { name: 'bo, 1 hop away' })).toHaveAccessibleDescription('Trial. Ends Friday')
    expect(stat('Subscribed')).toHaveTextContent('1')
    expect(stat('Subscribed')).toHaveClass('text-success-text')
    expect(stat('Trial')).toHaveTextContent('1')
    expect(stat('Trial')).not.toHaveClass('text-warning-text')
    expect(stat('People')).toHaveTextContent('4')
    expect(screen.queryByText('Visited', { selector: '[data-slot=eyebrow]' })).not.toBeInTheDocument()
    expect(screen.queryByText('Compromised')).not.toBeInTheDocument()
  })

  test('format rewrites the foot figures', () => {
    reduced(<RadialNetwork format={(n) => `#${n}`} />)
    expect(stat('Compromised')).toHaveTextContent('#4')
    expect(stat('Entities')).toHaveTextContent('#18')
  })

  test('with no nodes it shows the empty state instead of the graph', () => {
    reduced(<RadialNetwork nodes={[]} />)
    expect(screen.getByText('Nothing reached')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'What a.moreau reaches' })).not.toBeInTheDocument()
  })

  test('your empty node replaces the default message', () => {
    reduced(<RadialNetwork nodes={[]} empty={<p>Invite someone</p>} />)
    expect(screen.getByText('Invite someone')).toBeInTheDocument()
    expect(screen.queryByText('Nothing reached')).not.toBeInTheDocument()
  })

  test('an error shows its message and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<RadialNetwork error="Couldn’t load the graph." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the graph.')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'What a.moreau reaches' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading shows no graph, only its place held', () => {
    reduced(<RadialNetwork loading />)
    expect(screen.getByText('Loading the graph')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'What a.moreau reaches' })).not.toBeInTheDocument()
  })
})
