import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PageActions } from './page-actions'

const site = 'https://youj.dev'
const prompt = encodeURIComponent("Read https://youj.dev/docs/components/button.md and help me use Youj's Button.")

function mockFetch(body: string, ok = true) {
  const fetch = vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 404, text: () => Promise.resolve(body) })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  return writeText
}

describe('PageActions', () => {
  afterEach(() => vi.unstubAllGlobals())

  it("copies the page's Markdown twin and confirms", async () => {
    const fetch = mockFetch('# Button')
    const writeText = mockClipboard()
    render(<PageActions url="/docs/components/button" site={site} title="Button" />)

    const group = screen.getByRole('group', { name: 'Page actions' })
    await act(async () => fireEvent.click(within(group).getByRole('button', { name: 'Copy page' })))
    expect(fetch).toHaveBeenCalledWith('/docs/components/button.md')
    expect(writeText).toHaveBeenCalledWith('# Button')
    expect(within(group).getByRole('button', { name: 'Copied' })).toBeInTheDocument()
    expect(screen.getByText('Page copied to clipboard')).toBeInTheDocument()
  })

  it('claims nothing when the Markdown fails to load', async () => {
    mockFetch('', false)
    const writeText = mockClipboard()
    render(<PageActions url="/docs/components/button" site={site} title="Button" />)
    const group = screen.getByRole('group', { name: 'Page actions' })
    await act(async () => fireEvent.click(within(group).getByRole('button', { name: 'Copy page' })))
    expect(writeText).not.toHaveBeenCalled()
    expect(within(group).getByRole('button', { name: 'Copy page' })).toBeInTheDocument()
  })

  it('lists copy actions, the Markdown, then the five assistants, each assistant in a new tab', async () => {
    const user = userEvent.setup()
    render(<PageActions url="/docs/components/button" site={site} title="Button" />)
    await user.click(screen.getByRole('button', { name: 'More page actions' }))
    const menu = await screen.findByRole('menu')
    const items = within(menu).getAllByRole('menuitem')
    expect(items.map((item) => [item.textContent, item.getAttribute('href')])).toEqual([
      ['Copy page as Markdown', null],
      ['Copy page link', null],
      ['View as Markdown', '/docs/components/button.md'],
      ['Open in Claude', `https://claude.ai/new?q=${prompt}`],
      ['Open in ChatGPT', `https://chatgpt.com/?q=${prompt}`],
      ['Open in Gemini', `https://gemini.google.com/app?q=${prompt}`],
      ['Open in v0', `https://v0.dev/chat?q=${prompt}`],
      ['Open in Cursor', `cursor://anysphere.cursor-deeplink/prompt?text=${prompt}`],
    ])
    for (const item of items.slice(2, 7)) {
      expect(item).toHaveAttribute('target', '_blank')
      expect(item).toHaveAttribute('rel', 'noopener noreferrer')
    }
    expect(items[7]).not.toHaveAttribute('target')
  })

  it('copies the page link', async () => {
    const user = userEvent.setup() // Stubs its own clipboard: mock ours after it.
    const writeText = mockClipboard()
    render(<PageActions url="/docs/components/button" site={site} title="Button" />)
    await user.click(screen.getByRole('button', { name: 'More page actions' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Copy page link' }))
    expect(writeText).toHaveBeenCalledWith('https://youj.dev/docs/components/button')
  })

  it('narrow: one icon button whose menu has the same items', async () => {
    const user = userEvent.setup() // Stubs its own clipboard: mock ours after it.
    mockFetch('# Button')
    const writeText = mockClipboard()
    render(<PageActions url="/docs/components/button" site={site} title="Button" />)
    await user.click(screen.getByRole('button', { name: 'Page actions' }))
    const menu = await screen.findByRole('menu')
    const items = within(menu).getAllByRole('menuitem')
    expect(items.map((item) => item.textContent)).toHaveLength(8)
    await user.click(items[0]!)
    expect(writeText).toHaveBeenCalledWith('# Button')
  })
})
