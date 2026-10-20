import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { FirstSource } from './first-source'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const floor = (container: HTMLElement) => container.querySelector('[data-slot=first-source-floor]') as HTMLElement

describe('FirstSource', () => {
  test('is a page with one h1 on its own, and a section named by an h2 embedded', () => {
    const { unmount } = reduced(<FirstSource />)
    expect(screen.getByRole('main', { name: 'Warehouse' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Warehouse' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Nothing has landed yet' })).toBeInTheDocument()
    unmount()
    reduced(<FirstSource embedded />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Warehouse' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Warehouse' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Nothing has landed yet' })).toBeInTheDocument()
  })

  test('the illustration is a picture: aria-hidden, with the choice said in words below it', () => {
    const { container } = reduced(<FirstSource />)
    expect(container.querySelector('[data-slot=iso-scene]')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('radiogroup', { name: 'Where your data comes from' })).toBeInTheDocument()
  })

  test('arrow keys move the choice, reshaping what waits to land and relabelling the action', async () => {
    const user = userEvent.setup()
    const { container } = reduced(<FirstSource />)
    const database = screen.getByRole('radio', { name: /Database/ })
    expect(database).toHaveAttribute('aria-checked', 'true')
    expect(floor(container)).toHaveAttribute('data-source', 'database')
    expect(container.querySelector('[data-slot=iso-cylinder]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect database' })).toBeInTheDocument()

    database.focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: /Event stream/ })).toHaveAttribute('aria-checked', 'true')
    expect(floor(container)).toHaveAttribute('data-source', 'stream')
    expect(container.querySelector('[data-slot=iso-cylinder]')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect stream' })).toBeInTheDocument()

    await user.keyboard('{ArrowDown}')
    expect(floor(container)).toHaveAttribute('data-source', 'files')
    expect(screen.getByRole('button', { name: 'Upload files' })).toBeInTheDocument()
  })

  test('the primary action hands the chosen source to onConnect', async () => {
    const user = userEvent.setup()
    const onConnect = vi.fn().mockResolvedValue(undefined)
    reduced(<FirstSource defaultSource="files" onConnect={onConnect} />)
    await user.click(screen.getByRole('button', { name: 'Upload files' }))
    await waitFor(() => expect(onConnect).toHaveBeenCalledWith(expect.objectContaining({ id: 'files', label: 'Files' })))
  })

  test('under reduced motion nothing waits raised or hidden, and nothing bobs', () => {
    const { container } = reduced(<FirstSource defaultSource="stream" />)
    for (const g of container.querySelectorAll('[data-slot=iso-scene] g')) {
      expect((g as SVGGElement).style.opacity).not.toBe('0')
      expect((g as SVGGElement).style.transform ?? '').not.toMatch(/translateY\(-/)
    }
  })

  test('every string can be rewritten', () => {
    reduced(<FirstSource copy={{ title: 'Lager', heading: 'Noch ist nichts angekommen', sourceLabel: 'Woher Ihre Daten kommen', status: '0 Tabellen' }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Lager' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Noch ist nichts angekommen' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Woher Ihre Daten kommen' })).toBeInTheDocument()
    expect(screen.getByText('0 Tabellen')).toBeInTheDocument()
  })

  test('your sources drive the choice cards, the floor’s shape and the action', async () => {
    const user = userEvent.setup()
    const onConnect = vi.fn()
    const sources = [
      { id: 'camera', kind: 'stream' as const, label: 'Camera roll', description: 'iPhone · Android', action: 'Import camera roll' },
      { id: 'cloud', kind: 'database' as const, label: 'Cloud drive', description: 'iCloud · Dropbox', action: 'Connect cloud drive' },
    ]
    const { container } = reduced(<FirstSource sources={sources} onConnect={onConnect} />)
    expect(screen.getAllByRole('radio')).toHaveLength(2)
    expect(screen.getByRole('radio', { name: /Camera roll/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.queryByRole('radio', { name: /Database/ })).not.toBeInTheDocument()
    expect(floor(container)).toHaveAttribute('data-source', 'camera')
    expect(container.querySelector('[data-slot=iso-cylinder]')).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /Cloud drive/ }))
    expect(container.querySelector('[data-slot=iso-cylinder]')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Connect cloud drive' }))
    await waitFor(() => expect(onConnect).toHaveBeenCalledWith(sources[1]))
  })
})
