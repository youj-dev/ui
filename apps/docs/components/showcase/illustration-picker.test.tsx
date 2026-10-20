import { useState } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { illustrations } from '@youj/illustrations'
import { IllustrationPicker, matchScene, rankScenes } from './illustration-picker'

const scenes = illustrations.map(({ id, name, category }) => ({ id, name, category }))

// jsdom lacks scrollIntoView, which cmdk calls to keep the active row in view.
beforeAll(() => {
  Element.prototype.scrollIntoView ??= () => {}
})

function Harness({ onChange = () => {} }: { onChange?: (id: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <IllustrationPicker
      scenes={scenes}
      value={value}
      onChange={(id) => {
        setValue(id)
        onChange(id)
      }}
    />
  )
}

const open = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /^Illustration:/ }))
  return screen.findByRole('listbox')
}

// Every scene draws a thumbnail as it scrolls in: give the picker room on a busy machine.
describe('IllustrationPicker', { timeout: 30_000 }, () => {
  it('names the scene it shows, and opens on a search over every scene, grouped by category', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Illustration: Default' })).toBeInTheDocument()
    const list = await open(user)
    expect(screen.getByRole('combobox')).toHaveAttribute('placeholder', `Find one of ${scenes.length} scenes…`)
    expect(within(list).getAllByRole('option')).toHaveLength(scenes.length + 1)
    for (const category of new Set(scenes.map((s) => s.category))) {
      expect(within(list).getByRole('group', { name: category.charAt(0).toUpperCase() + category.slice(1) })).toBeInTheDocument()
    }
  })

  it('narrows to the scenes the words name, and picks the first with Enter, handing focus back', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChange={onChange} />)
    const list = await open(user)
    await user.keyboard('clo')
    const options = within(list).getAllByRole('option')
    const values = options.map((o) => o.getAttribute('data-value'))
    expect(values[0]).toBe('cloud')
    expect(values.every((v) => v?.includes('clo'))).toBe(true)
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('cloud')
    const trigger = screen.getByRole('button', { name: 'Illustration: Cloud regions' })
    await vi.waitFor(() => expect(trigger).toHaveFocus())
  })

  it('leads a search with the scenes it names best, and leaves Default out of it', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChange={onChange} />)
    const list = await open(user)
    await user.keyboard('se')
    const options = within(list).getAllByRole('option')
    expect(options.map((o) => o.getAttribute('data-value'))).not.toContain('default-scene')
    const first = scenes.find((s) => s.id === options[0]!.getAttribute('data-value'))!
    expect(first.name.toLowerCase().startsWith('se')).toBe(true)
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith(first.id)
  })

  it('goes back to the block’s own scene from Default', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChange={onChange} />)
    await open(user)
    await user.click(screen.getByRole('option', { name: /Security/ }))
    expect(screen.getByRole('button', { name: 'Illustration: Security' })).toBeInTheDocument()
    await open(user)
    await user.click(screen.getByRole('option', { name: /Default/ }))
    expect(onChange).toHaveBeenLastCalledWith('')
    expect(screen.getByRole('button', { name: 'Illustration: Default' })).toBeInTheDocument()
  })

  it('moves through the grid in two dimensions: along it, and to the nearest scene a row down or up', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const list = await open(user)
    // jsdom lays nothing out: place the rows by hand, Default across the top, then four scenes a row.
    const items = [...list.querySelectorAll<HTMLElement>('[cmdk-item]')]
    items.forEach((el, i) => {
      const box = i === 0 ? { top: 0, left: 0, width: 400, height: 40 } : { top: 50 + Math.floor((i - 1) / 4) * 90, left: ((i - 1) % 4) * 100, width: 96, height: 86 }
      el.getBoundingClientRect = () => ({ ...box, right: box.left + box.width, bottom: box.top + box.height, x: box.left, y: box.top, toJSON: () => box }) as DOMRect
      el.scrollIntoView = () => {}
    })
    const active = () => list.querySelector('[aria-selected="true"]')?.getAttribute('data-value')
    const input = screen.getByRole('combobox')
    expect(active()).toBe('default-scene')
    const at = (i: number) => items[i]!.getAttribute('data-value')
    // Default's center (200) is nearest the first row's third scene (248).
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(active()).toBe(at(3))
    fireEvent.keyDown(input, { key: 'ArrowRight' })
    expect(active()).toBe(at(4))
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(active()).toBe(at(8))
    fireEvent.keyDown(input, { key: 'ArrowLeft' })
    expect(active()).toBe(at(7))
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(active()).toBe(at(3))
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(active()).toBe('default-scene')
    await act(async () => {})
  })
})

describe('rankScenes', () => {
  const fixture = [
    { id: 'database', name: 'Database', category: 'data' },
    { id: 'server-rack', name: 'Server rack', category: 'infrastructure' },
    { id: 'search', name: 'Search', category: 'app' },
    { id: 'mail', name: 'Mail', category: 'app' },
  ]

  it('keeps the registry’s order with no search', () => {
    expect(rankScenes(fixture, '').map((g) => [g.category, g.scenes.map((s) => s.id)])).toEqual([
      ['data', ['database']],
      ['infrastructure', ['server-rack']],
      ['app', ['search', 'mail']],
    ])
  })

  it('orders the groups by their best scene, and drops the ones with none', () => {
    expect(rankScenes(fixture, 'se').map((g) => [g.category, g.scenes.map((s) => s.id)])).toEqual([
      ['infrastructure', ['server-rack']],
      ['app', ['search']],
      ['data', ['database']],
    ])
    expect(rankScenes(fixture, 'zzz')).toEqual([])
  })
})

describe('matchScene', () => {
  it('asks for every word, in the id, the name or the category', () => {
    expect(matchScene('load-balancer', 'clo', ['Load balancer', 'infrastructure'])).toBe(0)
    expect(matchScene('cloud', 'clo', ['Cloud regions', 'infrastructure'])).toBe(1)
    expect(matchScene('server-rack', 'rack infra', ['Server rack', 'infrastructure'])).toBeGreaterThan(0)
    expect(matchScene('server-rack', 'rack mail', ['Server rack', 'infrastructure'])).toBe(0)
    expect(matchScene('anything', '  ', [])).toBe(1)
  })

  it('ranks a name that starts with the search over a word that does, over a match inside a word', () => {
    const name = matchScene('not-found', 'not', ['Not found', 'lifecycle'])
    const word = matchScene('not-found', 'found', ['Not found', 'lifecycle'])
    const inside = matchScene('backups', 'ups', ['Backups', 'data'])
    expect(name).toBeGreaterThan(word)
    expect(word).toBeGreaterThan(inside)
    expect(inside).toBeGreaterThan(0)
  })
})
