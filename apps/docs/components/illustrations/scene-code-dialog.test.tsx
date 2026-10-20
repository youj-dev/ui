import { fireEvent, render, screen, within } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { sceneEntries } from './catalog'
import { SceneCodeDialog } from './scene-code-dialog'

/* A scene's code modal: its source is read from the registry the first time
 * the tab is shown, with a way to try again when that fails. */

const scene = sceneEntries().find((s) => s.id === 'coffee')!

afterEach(() => vi.unstubAllGlobals())

test('the Source tab reads the scene as the CLI writes it, and can try again after a failure', async () => {
  const item = { files: [{ content: 'export function IllustrationCoffee() {}\n' }], registryDependencies: ['https://www.youj.dev/r/illustration-kit.json', 'iso-shapes'] }
  const fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 500 })).mockResolvedValue(new Response(JSON.stringify(item)))
  vi.stubGlobal('fetch', fetch)
  render(
    <YoujProvider reducedMotion="always">
      <SceneCodeDialog scene={scene} blocks={[{ href: '/cards/app-no-results', title: 'No results', group: 'App' }]} trigger={<button type="button">Code</button>} />
    </YoujProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Code' }))
  const dialog = await screen.findByRole('dialog', { name: 'Coffee' })
  expect(fetch).not.toHaveBeenCalled()
  fireEvent.click(within(dialog).getByRole('tab', { name: 'Source' }))
  expect(fetch).toHaveBeenCalledWith('/r/illustration-coffee.json')
  fireEvent.click(await within(dialog).findByRole('button', { name: 'Try again' }))
  const source = await within(dialog).findByRole('group', { name: 'components/youj/graphics/illustrations/scenes/coffee.tsx' })
  expect(source).toHaveTextContent('export function IllustrationCoffee() {}')
  expect(within(dialog).getByText('illustration-kit, iso-shapes')).toBeInTheDocument()
  fireEvent.click(within(dialog).getByRole('tab', { name: 'In a block' }))
  expect(within(dialog).getByRole('link', { name: /No results/ })).toHaveAttribute('href', '/cards/app-no-results')
})
