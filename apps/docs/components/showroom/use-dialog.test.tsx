import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { PropsSheet, RegistrySource, UseCode, UsePreview } from './use-dialog'

/* The parts every showroom's Use it is made of: the code block and its variants, the props sheet, the registry's
 * source, and the preview's paper. The areas' own tests open the whole modal. */

const wrap = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

afterEach(() => vi.unstubAllGlobals())

describe('the code block', () => {
  it('shows one way to write it under its file’s name, and copies it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    wrap(<UseCode label="Usage" variants={[{ value: 'one', label: 'Usage', file: 'results.tsx', code: '<Fern />' }]} />)
    expect(screen.getByText('results.tsx')).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.getByRole('group', { name: 'Usage' })).toHaveTextContent('<Fern />')
    fireEvent.click(screen.getByRole('button', { name: 'Copy Usage' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('<Fern />'))
    Reflect.deleteProperty(navigator, 'clipboard')
  })

  it('switches between its ways to write it from the tabs on its bar, the panel named by its tab', () => {
    wrap(
      <UseCode
        label="Ways to write it"
        variants={[
          { value: 'id', label: 'By id', file: 'page.tsx', code: '<Illustration scene="fern" />' },
          { value: 'component', label: 'The component', file: 'page.tsx', code: '<IllustrationFern />' },
        ]}
      />,
    )
    const tabs = screen.getByRole('tablist', { name: 'Ways to write it' })
    expect(within(tabs).getByRole('tab', { name: 'By id' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', within(tabs).getByRole('tab', { name: 'By id' }).id)
    fireEvent.click(within(tabs).getByRole('tab', { name: 'The component' }))
    expect(screen.getByRole('group', { name: 'The component' })).toHaveTextContent('<IllustrationFern />')
    expect(screen.queryByRole('group', { name: 'By id' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Copy The component' })).toBeInTheDocument()
  })
})

describe('the props sheet', () => {
  it('lists every prop with its type, its values, its default (code written as code) and its line, and what the rest pass to', () => {
    wrap(
      <PropsSheet
        doc={{
          name: 'FernProps',
          file: 'fern.tsx',
          props: [
            { name: 'size', type: 'FernSize', values: ['sm', 'lg'], required: false, default: '`sm`', description: 'How tall it grows, `sm` or `lg`.' },
            { name: 'species', type: 'string', required: true, description: 'Which fern.' },
          ],
          extends: ['HTMLAttributes<HTMLDivElement>'],
        }}
      />,
    )
    const table = screen.getByRole('table', { name: 'FernProps props' })
    const [size, species] = within(table).getAllByRole('row').slice(1)
    expect(within(size!).getByRole('rowheader')).toHaveTextContent('size')
    expect(size).toHaveTextContent('FernSize')
    expect(size).toHaveTextContent('How tall it grows, sm or lg.')
    expect(within(size!).getAllByRole('cell')[1]).toHaveTextContent(/^default\s*sm$/)
    expect(species).toHaveTextContent('Required')
    expect(within(species!).getByLabelText('none')).toBeInTheDocument()
    expect(screen.getByText(/Any other prop goes to/)).toHaveTextContent('HTMLAttributes<HTMLDivElement>')
  })
})

describe('the registry’s source', () => {
  it('holds code-shaped lines while it reads the file, then the file as the CLI writes it and what it draws with', async () => {
    let answer!: (r: Response) => void
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((r) => (answer = r))))
    wrap(<RegistrySource item="loader-fern" path="components/youj/loaders/depth/fern.tsx" />)
    expect(screen.getByText('Reading the source…')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('/r/loader-fern.json')
    answer(new Response(JSON.stringify({ files: [{ content: 'export function LoaderFern() {}\n' }], registryDependencies: ['https://www.youj.dev/r/loader-kit.json'] })))
    expect(await screen.findByRole('group', { name: 'components/youj/loaders/depth/fern.tsx' })).toHaveTextContent('export function LoaderFern() {}')
    expect(screen.getByText('loader-kit')).toBeInTheDocument()
  })
})

describe('the preview', () => {
  it('is a picture on a stage, in the stage’s light or dark', () => {
    const { container } = wrap(
      <UsePreview scheme="dark">
        <svg data-testid="fern" />
      </UsePreview>,
    )
    const tile = container.querySelector<HTMLElement>('[data-theme]')!
    expect(tile).toHaveAttribute('data-theme', 'dark')
    expect(tile).toHaveAttribute('aria-hidden', 'true')
    expect(tile).toHaveClass('site-stage')
    expect(tile).toContainElement(screen.getByTestId('fern'))
  })
})
