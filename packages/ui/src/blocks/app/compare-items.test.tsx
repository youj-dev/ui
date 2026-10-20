import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CompareItems } from './compare-items'
import { ITEMS, SPECS } from './compare-items/data'
import { bestOf } from './compare-items/model'

const renderBlock = (props: React.ComponentProps<typeof CompareItems> = {}) =>
  render(
    <YoujProvider reducedMotion="always">
      <CompareItems {...props} />
    </YoujProvider>,
  )
const row = (name: string) => screen.getByRole('row', { name: new RegExp(`^${name}`) })
const columns = () => within(screen.getByRole('table', { name: 'Overview' })).getAllByRole('columnheader').slice(1).map((h) => h.textContent)
const spec = (id: string) => SPECS.find((s) => s.id === id)!
const picks = (...ids: string[]) => ids.map((id) => ITEMS.find((i) => i.id === id)!)

describe('compare items block', () => {
  test('opens with three models: a column and a picker each, the radar above the overview', () => {
    renderBlock()
    expect(screen.getByRole('heading', { level: 2, name: 'Compare models' })).toBeInTheDocument()
    expect(columns()).toEqual(['Atlas 2', 'Quill S', 'Meridian'])
    expect(screen.getAllByRole('combobox').map((c) => c.textContent)).toEqual(['Atlas 2', 'Quill S', 'Meridian'])
    expect(screen.getByRole('group', { name: 'Scores by model' })).toBeInTheDocument()
    expect(row('Context length')).toHaveTextContent('1Mtokens')
    expect(row('Input price')).toHaveTextContent('$3.00per 1M tokens')
    expect(within(row('Reasoning mode')).getAllByText(/^(Yes|No)$/).map((b) => b.textContent)).toEqual(['Yes', 'No', 'Yes'])
  })

  test('picks the best value per row only when asked', async () => {
    const user = userEvent.setup()
    renderBlock()
    expect(document.querySelectorAll('[data-yj-best]')).toHaveLength(0)
    await user.click(screen.getByRole('switch', { name: 'Highlight best' }))
    const best = (name: string) => [...row(name).querySelectorAll('[data-yj-best]')].map((c) => c.textContent)
    expect(best('Context length')).toEqual(['1Mtokens, best in this row'])
    expect(best('Input price')).toEqual(['$0.25per 1M tokens, best in this row'])
    // Made by has no best; Tool calling is Yes for two and No for one.
    expect(best('Made by')).toEqual([])
    expect(best('Tool calling')).toEqual(['Yes, best in this row', 'Yes, best in this row'])
  })

  test('a tie, or a row everyone agrees on, marks nothing', () => {
    expect([...bestOf(spec('input'), picks('atlas', 'atlas'))]).toEqual([])
    expect([...bestOf(spec('weights'), picks('atlas', 'quill'))]).toEqual([])
    expect([...bestOf(spec('weights'), picks('atlas', 'basalt'))]).toEqual(['basalt'])
    expect([...bestOf(spec('output'), picks('lumen', 'quill', 'basalt'))]).toEqual(['basalt'])
  })

  test('adds a column from the models not yet picked, and stops at the most', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderBlock({ onValueChange })
    await user.click(screen.getByRole('button', { name: 'Add model' }))
    expect(columns()).toEqual(['Atlas 2', 'Quill S', 'Meridian', 'Lumen Pro'])
    expect(onValueChange).toHaveBeenLastCalledWith(['atlas', 'quill', 'meridian', 'lumen'])
    expect(screen.queryByRole('button', { name: 'Add model' })).not.toBeInTheDocument()
  })

  test('removes a column down to two, then no more', async () => {
    const user = userEvent.setup()
    renderBlock()
    await user.click(screen.getByRole('button', { name: 'Remove Quill S' }))
    expect(columns()).toEqual(['Atlas 2', 'Meridian'])
    expect(screen.queryByRole('button', { name: /^Remove/ })).not.toBeInTheDocument()
  })

  test('changing a picker swaps that column and offers only models not taken', async () => {
    const user = userEvent.setup()
    renderBlock()
    await user.click(screen.getAllByRole('combobox')[1]!)
    const options = (await screen.findAllByRole('option')).map((o) => o.textContent)
    expect(options).toEqual(['Quill S', 'Lumen Pro', 'Basalt 8B', 'Cirrus'])
    await user.click(screen.getByRole('option', { name: 'Basalt 8B' }))
    expect(columns()).toEqual(['Atlas 2', 'Basalt 8B', 'Meridian'])
  })

  test('is driven by its props: picks, copy and the data it is given', () => {
    renderBlock({
      value: ['basalt', 'cirrus'],
      highlight: true,
      copy: { title: 'Choose a model', add: 'Add another' },
    })
    expect(screen.getByRole('heading', { name: 'Choose a model' })).toBeInTheDocument()
    expect(columns()).toEqual(['Basalt 8B', 'Cirrus'])
    expect(screen.getByRole('switch', { name: 'Highlight best' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Add another' })).toBeInTheDocument()
  })

  test('another world: items, axes, specs and copy drive the columns, units and best marks', async () => {
    const user = userEvent.setup()
    renderBlock({
      copy: { title: 'Compare laptops' },
      axes: [
        { id: 'battery', label: 'Battery' },
        { id: 'weight', label: 'Lightness' },
        { id: 'value', label: 'Value' },
      ],
      specs: [
        { id: 'battery', label: 'Battery life', kind: 'number', format: { maximumFractionDigits: 0 }, unit: 'hours', better: 'higher' },
        { id: 'weight', label: 'Weight', kind: 'number', format: { minimumFractionDigits: 1, maximumFractionDigits: 1 }, unit: 'lb', better: 'lower' },
        { id: 'touch', label: 'Touchscreen', kind: 'boolean' },
      ],
      items: [
        { id: 'a', name: 'Slate 11', scores: { battery: 90, weight: 90, value: 60 }, specs: { battery: 14, weight: 2.4, touch: true } },
        { id: 'b', name: 'Brindle Study', scores: { battery: 60, weight: 50, value: 90 }, specs: { battery: 9, weight: 3.6, touch: false } },
      ],
      defaultValue: ['a', 'b'],
    })
    expect(screen.getByRole('heading', { level: 2, name: 'Compare laptops' })).toBeInTheDocument()
    expect(columns()).toEqual(['Slate 11', 'Brindle Study'])
    expect(row('Battery life')).toHaveTextContent('14hours')
    expect(row('Weight')).toHaveTextContent('2.4lb')
    await user.click(screen.getByRole('switch', { name: 'Highlight best' }))
    const best = (name: string) => [...row(name).querySelectorAll('[data-yj-best]')].map((c) => c.textContent)
    expect(best('Battery life')).toEqual(['14hours, best in this row'])
    expect(best('Weight')).toEqual(['2.4lb, best in this row'])
    expect(best('Touchscreen')).toEqual(['Yes, best in this row'])
  })

  test('standalone draws its own page with an h1', () => {
    renderBlock({ embedded: false })
    expect(screen.getByRole('heading', { level: 1, name: 'Compare models' })).toBeInTheDocument()
  })
})
