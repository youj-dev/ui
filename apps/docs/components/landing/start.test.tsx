import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import { dependencyClosure } from '@/lib/catalog'
import { registryItems } from '@/lib/registry'
import { Start } from './start'

/** The install fields' commands, each read whole (the field colors the runner and its arguments apart). */
const commands = (root: HTMLElement = document.body) => [...root.querySelectorAll('[aria-label="Install command"]')].map((g) => g.textContent?.trim())


/** The stacks hydrate once they near the screen, from a chunk of their own: rendered once that's in. */
async function renderStart(reducedMotion: 'always' | 'never' = 'never') {
  // Awaited here, inside the test's own timeout, so a cold transform on a loaded machine is waited for where it happens.
  await Promise.all([import('./start-stack'), import('./blocks-frame')])
  await act(async () => {
    render(
      <YoujProvider reducedMotion={reducedMotion}>
        <Start install="npx youj init" componentsUrl="/docs/components" screensUrl="/docs/blocks/checkout" />
      </YoujProvider>,
    )
  })
}

const lifted = (figure: HTMLElement) => [...figure.querySelectorAll('[data-lifted]')].map((tile) => tile.getAttribute('data-lifted'))
const brings = (name: string) => `${name} brings ${dependencyClosure(name).join(', ')}, and nothing else from the kit`

describe('Start', () => {
  it('draws the whole kit as a stack of its package entries, described in words, with no counts', async () => {
    await renderStart()
    const kit = screen.getByRole('img', {
      name: 'It installs @youj/react with @youj/icons and @youj/motion, whose /interactions, /backgrounds and /players entries are there when you want them, and @youj/loaders and @youj/illustrations beside them; motion also stands alone',
    })
    const planes = [...kit.querySelectorAll('[data-stack-layer]')].map((plane) => plane.getAttribute('data-stack-layer'))
    expect(planes).toEqual(['motion', 'players', 'interactions', 'loaders', 'illustrations', 'icons', 'ui'])
    for (const entry of ['@youj/react', '@youj/motion', '@youj/icons', '@youj/illustrations', '@youj/motion/interactions', '@youj/motion/players', '@youj/loaders'])
      expect(within(kit).getByText(entry)).toBeInTheDocument()
    // The planes carry names, never numbers.
    for (const plane of kit.querySelectorAll('[data-stack-layer]')) expect(plane.textContent).not.toMatch(/\d/)
  })

  it('lifts the piece and exactly what it brings off their planes, from the registry', async () => {
    await renderStart()
    const piece = screen.getByRole('img', { name: brings('button') })
    expect(lifted(piece).sort()).toEqual(['button', ...dependencyClosure('button')].sort())
    expect(commands()).toContain('npx youj add button')
  })

  it('shows the finished pictures under reduced motion', async () => {
    await renderStart('always')
    expect(screen.getByRole('img', { name: /^It installs @youj\/react/ }).querySelectorAll('[data-stack-layer]')).toHaveLength(7)
    expect(lifted(screen.getByRole('img', { name: brings('button') }))).toContain('button')
  })

  it('re-resolves the stack, the command and the description when another piece is picked', async () => {
    const user = userEvent.setup()
    await renderStart()
    await user.click(screen.getByRole('button', { name: 'dock' }))
    const piece = screen.getByRole('img', { name: brings('dock') })
    expect(lifted(piece).sort()).toEqual(['dock', ...dependencyClosure('dock')].sort())
    expect(commands()).toContain('npx youj add dock')
    expect(commands()).not.toContain('npx youj add button')
    expect(screen.getByRole('button', { name: 'dock' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('marks the label of the plane under the pointer, until the pointer leaves the stage', async () => {
    await renderStart()
    const kit = screen.getByRole('img', { name: /^It installs @youj\/react/ })
    const label = (name: string) => within(kit).getByText(name, { selector: 'p' }).closest('[data-stack-layer], div')!
    expect(label('UI')).not.toHaveAttribute('data-pointed')
    fireEvent.pointerEnter(kit.querySelector('[data-stack-layer="icons"]')!)
    expect(label('Icons')).toHaveAttribute('data-pointed', 'true')
    expect(label('UI')).toHaveAttribute('data-pointed', 'false')
    // Its label answers too.
    fireEvent.pointerEnter(label('UI'))
    expect(label('UI')).toHaveAttribute('data-pointed', 'true')
    expect(label('Icons')).toHaveAttribute('data-pointed', 'false')
    fireEvent.pointerLeave(kit.firstElementChild!)
    expect(label('UI')).not.toHaveAttribute('data-pointed')
  })

  it('lets the keyboard pick a piece', async () => {
    const user = userEvent.setup()
    await renderStart()
    screen.getByRole('button', { name: 'button' }).focus()
    await user.keyboard('{ArrowRight}{Enter}')
    expect(screen.getByRole('img', { name: brings('icon-bell') })).toBeInTheDocument()
  })

  it('offers a loader as a piece, lifting it and its kit off the Loaders plane', async () => {
    const user = userEvent.setup()
    await renderStart()
    await user.click(screen.getByRole('button', { name: 'loader-build' }))
    expect(commands()).toContain('npx youj add loader-build')
    const piece = screen.getByRole('img', { name: brings('loader-build') })
    expect(lifted(piece).sort()).toEqual(['loader-build', ...dependencyClosure('loader-build')].sort())
    const plane = piece.querySelector<HTMLElement>('[data-stack-layer="loaders"]')!
    expect(lifted(plane).sort()).toEqual(['loader-build', 'loader-kit'])
  })

  it('labels the pieces tersely, so four fit a phone, each keeping its whole name', async () => {
    await renderStart()
    const picker = screen.getByRole('group', { name: 'Piece' })
    const names = within(picker).getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-label') ?? b.textContent])
    expect(names).toEqual([
      ['button', 'button'],
      ['bell', 'icon-bell'],
      ['dock', 'dock'],
      ['build', 'loader-build'],
    ])
  })

  it('starts from a whole screen as a third way in: a block’s command and the gallery', async () => {
    await renderStart()
    const page = screen.getByRole('heading', { name: 'A whole screen' }).closest('article')!
    expect(commands(page)).toContain('npx youj add app-analytics-overview')
    expect(registryItems().has('app-analytics-overview')).toBe(true)
    expect(within(page).getByRole('link', { name: 'Browse screens' })).toHaveAttribute('href', '/docs/blocks/checkout')
    // Its app frame is a picture: the words beside it say what it shows.
    expect(page.querySelector('[data-placed]')!.closest('[aria-hidden="true"]')).not.toBeNull()
  })
})
