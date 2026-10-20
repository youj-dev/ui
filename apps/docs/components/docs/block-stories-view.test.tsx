import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { BlockCode, BlockInstall, BlockReference, BlockStoriesView, type BlockStoryEntry } from './block-stories-view'
import { StoryDescription } from './story-context'
import type { BlockRefData } from '@/lib/block-ref'

vi.mock('./block-preview', () => ({
  BlockPreview: ({ src, title, framing, story }: { src: string; title: string; framing: string; story: { value: string; onChange: (id: string) => void } }) => (
    <div data-testid="frame" data-src={src} data-framing={framing} data-story={story.value}>
      <div data-story-content="">{title}</div>
      <button type="button" onClick={() => story.onChange('login')}>
        Pick Login
      </button>
    </div>
  ),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ prefetch: () => {} }) }))
vi.mock('./block-ref-view', () => ({
  BlockUsageView: ({ data }: { data: { label: string } }) => <p>{data.label} usage</p>,
  BlockReferenceView: ({ data }: { data: { label: string } }) => <p>{data.label} reference</p>,
}))
vi.mock('@/components/showcase/code-panel', () => ({
  CodePanel: ({ files }: { files: { path: string }[] }) => <div data-testid="code">{files.map((f) => f.path).join(',')}</div>,
}))

const entry = (id: string, label: string, slug: string, framing: BlockStoryEntry['framing']): BlockStoryEntry => ({
  id,
  label,
  title: `${label} block`,
  accent: false,
  backdrop: undefined,
  description: <p>{label} text</p>,
  src: `/view/blocks/${slug}?story=Default`,
  framing,
  size: { density: 'roomy', scaling: '100%' },
  files: [{ path: `blocks/${slug}.tsx`, src: `/code/blocks/${slug}.json`, lines: 3 }],
  download: slug,
  ref: `/code/ref/blocks/${slug}.json`,
})

/** A story's reference as the fake view draws it: only its label. */
const ref = (label: string) => ({ label }) as unknown as BlockRefData

const stories = [entry('bento', 'Bento', 'marketing-feature-bento', 'section'), entry('login', 'Login', 'auth-login', 'screen')]

function Page({ stories: list = stories }: { stories?: BlockStoryEntry[] }) {
  return (
    <YoujProvider>
      <BlockStoriesView stories={list} first={{ ref: list[0]!.ref, data: ref('Bento') }}>
        <BlockInstall />
        <StoryDescription />
        <BlockCode />
        <BlockReference />
      </BlockStoriesView>
    </YoujProvider>
  )
}

const shown = (text: string) => !screen.getByText(text).closest('[data-story]')!.hasAttribute('hidden')
const frame = () => screen.getByTestId('frame')

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

/** The published references: Login's, fetched when its story is picked; `fail` makes the next fetch fail. */
const fetches: string[] = []
let fail = false
beforeEach(() => {
  fetches.length = 0
  fail = false
  vi.stubGlobal('fetch', async (src: string) => {
    fetches.push(src)
    if (fail) {
      fail = false
      return new Response('', { status: 500 })
    }
    return Response.json(ref(src.includes('auth-login') ? 'Login' : src.includes('auth-signup') ? 'Signup' : 'Bento'))
  })
})

afterEach(() => {
  history.replaceState(null, '', location.pathname)
})

describe('BlockStoriesView', () => {
  it('shows the first story’s block, with the tabs reading it', () => {
    render(<Page />)
    expect(frame().dataset.src).toBe('/view/blocks/marketing-feature-bento?story=Default')
    expect(frame().dataset.framing).toBe('section')
    expect(screen.getByText('Bento usage')).toBeTruthy()
    expect(screen.getByText('Bento reference')).toBeTruthy()
    expect(screen.getByTestId('code').textContent).toBe('blocks/marketing-feature-bento.tsx')
    expect(shown('Bento text')).toBe(true)
    expect(shown('Login text')).toBe(false)
  })

  it('opens on the story the hash names, a different block, and the tabs follow it once its reference arrives', async () => {
    history.replaceState(null, '', '#login')
    render(<Page />)
    expect(frame().dataset.src).toBe('/view/blocks/auth-login?story=Default')
    expect(frame().dataset.framing).toBe('screen')
    // Until Login's reference is here, Bento's holds its place, busy and out of reach.
    expect(screen.getByText('Bento usage').closest('[aria-busy]')).toBeTruthy()
    expect(await screen.findByText('Login usage')).toBeTruthy()
    expect(fetches).toEqual(['/code/ref/blocks/auth-login.json'])
    expect(screen.queryByText('Bento usage')).toBeNull()
    expect(screen.getByText('Login usage').closest('[aria-busy]')).toBeNull()
    expect(screen.getByText('Login reference')).toBeTruthy()
    expect(screen.getByTestId('code').textContent).toBe('blocks/auth-login.tsx')
    expect(shown('Login text')).toBe(true)
  })

  it('follows the hash, and leaves the story alone for a hash that names something else', async () => {
    history.replaceState(null, '', '#installation-usage')
    render(<Page />)
    expect(shown('Bento text')).toBe(true)
    act(() => {
      history.replaceState(null, '', '#login')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    await waitFor(() => expect(shown('Login text')).toBe(true))
  })

  it('fetches a reference once, and offers a retry when it fails', async () => {
    // A block no other test has fetched: references are kept for the visit.
    const signup = entry('signup', 'Signup', 'auth-signup', 'screen')
    fail = true
    history.replaceState(null, '', '#signup')
    render(<Page stories={[stories[0]!, signup]} />)
    fireEvent.click((await screen.findAllByRole('button', { name: 'Try again' }))[0]!)
    expect(await screen.findByText('Signup usage')).toBeTruthy()
    act(() => {
      history.replaceState(null, '', '#bento')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    act(() => {
      history.replaceState(null, '', '#signup')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.getByText('Signup usage')).toBeTruthy()
    expect(fetches).toEqual(['/code/ref/blocks/auth-signup.json', '/code/ref/blocks/auth-signup.json'])
  })

  it('hands a pick to the preview at once (it keeps the old block on show until the new one has painted)', () => {
    render(<Page />)
    fireEvent.click(screen.getByRole('button', { name: 'Pick Login' }))
    expect(frame().dataset.story).toBe('login')
    expect(frame().dataset.src).toBe('/view/blocks/auth-login?story=Default')
    expect(location.hash).toBe('#login')
  })

  it('shows the story whose hidden text find-in-page matched, and puts it in the address', async () => {
    render(<Page />)
    act(() => fireEvent(screen.getByText('Login text'), new Event('beforematch', { bubbles: true })))
    await waitFor(() => expect(frame().dataset.src).toBe('/view/blocks/auth-login?story=Default'))
    expect(location.hash).toBe('#login')
  })

  it('marks a screen that works in Create with a link that adds it, keeping the row for a story that doesn’t', async () => {
    const billing = { ...entry('bento', 'Billing', 'app-billing', 'screen'), create: 'billing' }
    render(<Page stories={[billing, stories[1]!]} />)
    const link = screen.getByRole('link', { name: 'Works in Create' })
    expect(link.getAttribute('href')).toBe('/create?screens=billing')
    const row = link.parentElement!
    fireEvent.click(screen.getByRole('button', { name: 'Pick Login' }))
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Works in Create' })).toBeNull())
    expect(row.isConnected).toBe(true)
  })
})
