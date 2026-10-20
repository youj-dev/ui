import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Procedure } from './procedure'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
/** A quantity as a screen reader hears it: Counter keeps the final value in its sr-only text. */
const quantity = (name: string) => screen.getByText(name).closest('label')!.querySelector('[data-slot=counter] .sr-only')!.textContent

describe('Procedure', () => {
  test('shows the dish, its facts as a ring, and the checklist’s count', () => {
    reduced(<Procedure />)
    expect(screen.getByRole('heading', { level: 2, name: 'Miso salmon bowl' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '606 kcal: Protein 25%, Carbs 42%, and Fat 33%' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Ingredients' }).parentElement).toHaveTextContent('2 of 9')
    expect(quantity('Salmon fillet')).toBe('300 g')
    expect(screen.getByRole('button', { name: 'Add 7 to list' })).toBeEnabled()
  })

  test('stepping the servings rescales every quantity, rounded as a cook would', async () => {
    const user = userEvent.setup()
    reduced(<Procedure />)
    await user.click(screen.getByRole('button', { name: /increase/i }))
    expect(screen.getByRole('textbox', { name: 'Servings' })).toHaveValue('3')
    expect(quantity('Salmon fillet')).toBe('450 g')
    expect(quantity('Short-grain rice')).toBe('270 g')
    expect(quantity('White miso')).toBe('3')
    expect(quantity('Cucumber')).toBe('1.5')
  })

  test('Whole dish flips the ring and the footer from one bowl to the pot', async () => {
    const user = userEvent.setup()
    reduced(<Procedure />)
    expect(screen.getByText(/606 kcal per serving/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Whole dish' }))
    expect(screen.getByRole('img', { name: /^1,212 kcal:/ })).toBeInTheDocument()
    expect(screen.getByText(/1,212 kcal for the dish/)).toBeInTheDocument()
  })

  test('ticking an ingredient counts it and takes it off the shopping list', async () => {
    const user = userEvent.setup()
    const added: string[][] = []
    reduced(<Procedure onAddToList={(items: { id: string }[]) => void added.push(items.map((i) => i.id))} />)
    await user.click(screen.getByRole('checkbox', { name: /Salmon fillet/ }))
    expect(screen.getByRole('heading', { level: 3, name: 'Ingredients' }).parentElement).toHaveTextContent('3 of 9')
    await user.click(screen.getByRole('button', { name: 'Add 6 to list' }))
    await waitFor(() => expect(added).toEqual([['miso', 'mirin', 'edamame', 'cucumber', 'avocado', 'sesame']]))
    await waitFor(() => expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('6 items added to your shopping list'))
  })

  test('a step’s timer counts down, pauses, and sounds done when it runs out', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] })
    try {
      reduced(<Procedure />)
      fireEvent.click(screen.getByRole('button', { name: 'Start the edamame timer, 3:00' }))
      await act(async () => vi.advanceTimersByTime(5000))
      const timer = screen.getByRole('button', { name: 'Pause the edamame timer, 2:55 left' })
      expect(timer).toHaveAttribute('aria-pressed', 'true')
      fireEvent.click(timer)
      await act(async () => vi.advanceTimersByTime(5000))
      expect(screen.getByRole('button', { name: 'Start the edamame timer, 2:55' })).toHaveAttribute('aria-pressed', 'false')
      fireEvent.click(screen.getByRole('button', { name: 'Start the edamame timer, 2:55' }))
      await act(async () => vi.advanceTimersByTime(176_000))
      expect(screen.getByRole('button', { name: 'Reset the edamame timer' })).toHaveTextContent('Done')
      expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('Edamame timer done')
    } finally {
      vi.useRealTimers()
    }
  })

  test('embedded, it is a section named by an h2', () => {
    reduced(<Procedure embedded />)
    expect(screen.getByRole('heading', { level: 2, name: 'Miso salmon bowl' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Method' })).toBeInTheDocument()
  })

  test('your own units, facts and words drive the quantities, the ring and the footer', async () => {
    const user = userEvent.setup()
    reduced(
      <Procedure
        baseYield={4}
        maxYield={40}
        defaultGathered={['tequila']}
        units={[
          { id: 'floz', format: { style: 'unit', unit: 'fluid-ounce', unitDisplay: 'short', maximumFractionDigits: 2 }, step: 0.25 },
          { id: 'tsp', label: 'tsp' },
        ]}
        inputs={[
          { id: 'tequila', name: 'Blanco tequila', amount: 8, unit: 'floz' },
          { id: 'syrup', name: 'Simple syrup', amount: 2, unit: 'floz' },
          { id: 'salt', name: 'Flaky salt', amount: 2, unit: 'tsp' },
        ]}
        steps={[{ id: 'chill', text: 'Chill the batch.', timer: 1800, timerName: 'Chill' }]}
        facts={[
          { id: 'tequila', label: 'Tequila', amount: 2 },
          { id: 'syrup', label: 'Syrup', amount: 0.5 },
        ]}
        factsFormat={{ style: 'unit', unit: 'fluid-ounce', unitDisplay: 'short', maximumFractionDigits: 2 }}
        totalFormat={{ maximumFractionDigits: 2 }}
        copy={{ title: 'Margarita, batched', yield: 'Drinks', perUnit: 'Per drink', whole: 'Whole batch', factsUnit: 'fl oz', facts: 'Drink spec', inputs: 'Ingredients', status: (n) => `Batched for ${n} drinks`, totalPerUnit: (t) => `${t} per drink`, totalWhole: (t) => `${t} for the batch` }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Margarita, batched' })).toBeInTheDocument()
    // The gathered count follows the inputs that exist.
    expect(screen.getByRole('heading', { level: 3, name: 'Ingredients' }).parentElement).toHaveTextContent('1 of 3')
    expect(screen.getByRole('img', { name: /^2\.5 fl oz: Tequila 80% and Syrup 20%/ })).toBeInTheDocument()
    expect(screen.getByText(/Batched for 4 drinks · 2\.5 fl oz per drink/)).toBeInTheDocument()
    expect(quantity('Blanco tequila')).toBe('8 fl oz')
    // The unit's label sits after the number; its step rounds the scaled amount.
    await user.click(screen.getByRole('button', { name: /increase/i }))
    expect(screen.getByRole('textbox', { name: 'Drinks' })).toHaveValue('5')
    expect(quantity('Blanco tequila')).toBe('10 fl oz')
    expect(quantity('Simple syrup')).toBe('2.5 fl oz')
    expect(quantity('Flaky salt')).toBe('2.5')
    expect(screen.getByText('tsp')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Whole batch' }))
    expect(screen.getByText(/12\.5 fl oz for the batch/)).toBeInTheDocument()
  })

  test('no inputs shows the empty message; your own node replaces it', () => {
    const { unmount } = reduced(<Procedure inputs={[]} />)
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3, name: 'Ingredients' })).not.toBeInTheDocument()
    unmount()
    reduced(<Procedure inputs={[]} empty={<p>Add the first input</p>} />)
    expect(screen.getByText('Add the first input')).toBeInTheDocument()
  })

  test('an error shows its message with Retry, and no demo quantities', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<Procedure error="No connection." onRetry={onRetry} />)
    expect(screen.getByText('No connection.')).toBeInTheDocument()
    expect(screen.queryByText('Salmon fillet')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  test('loading shows skeletons and none of the demo content', () => {
    const { container } = reduced(<Procedure loading />)
    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot=skeleton]').length).toBeGreaterThan(10)
    expect(screen.queryByText('Salmon fillet')).not.toBeInTheDocument()
  })
})
