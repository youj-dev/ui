import { useState } from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SoundCueContext } from '@youj/core/internal'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { ReactionGroup, type ReactionGroupItem, type ReactionGroupProps } from './reaction-group'

function deferred() {
  let resolve!: () => void
  let reject!: (error: unknown) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const REACTIONS: ReactionGroupItem[] = [
  { emoji: '👍', count: 3, reacted: true, by: ['Mara', 'Theo'] },
  { emoji: '🎉', count: 1, by: ['Priya'] },
  { emoji: '👀', count: 5, by: ['Theo', 'Priya'] },
]

/* Reduced motion, so pills come and go at once. `sink` hears the sound cues. */
function renderGroup(props: Partial<ReactionGroupProps> = {}, sink = vi.fn()) {
  const result = render(
    <YoujProvider reducedMotion="always">
      <SoundCueContext.Provider value={sink}>
        <ReactionGroup defaultValue={REACTIONS} {...props} />
      </SoundCueContext.Provider>
    </YoujProvider>,
  )
  const root = result.container.querySelector<HTMLElement>('[data-slot=reaction-group]')!
  return { ...result, root, sink }
}

const pill = (name: string | RegExp) => screen.getByRole('button', { name })
const addButton = () => screen.getByRole('button', { name: 'Add reaction' })
/** The reason under the row; Collapse leaves nothing there while it's closed. */
const reason = () => document.querySelector('[data-slot=reaction-group-error]')?.textContent ?? ''
const closed = () => waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
const announced = () => document.querySelector('[role=status]')?.textContent?.trim()
const sounds = (sink: ReturnType<typeof vi.fn>) => sink.mock.calls.map(([cue]) => cue)

async function openPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(addButton())
  return screen.findByRole('dialog', { name: 'Add reaction' })
}

describe('ReactionGroup', () => {
  test('a list of toggle buttons named by emoji and count, pressed where you reacted, with an add button last', () => {
    renderGroup()
    const list = screen.getByRole('list', { name: 'Reactions' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(items[0]).toHaveAttribute('aria-posinset', '1')
    expect(items[0]).toHaveAttribute('aria-setsize', '3')
    expect(pill('Thumbs up, 3')).toHaveAttribute('aria-pressed', 'true')
    expect(pill('Hooray, 1')).toHaveAttribute('aria-pressed', 'false')
    expect(pill('Eyes, 5')).toHaveAttribute('aria-pressed', 'false')
    expect(within(items[3]!).getByRole('button', { name: 'Add reaction' })).toBeInTheDocument()
  })

  test('each pill is described by who reacted: you first, the names given, then how many others', () => {
    renderGroup({
      defaultValue: [
        { emoji: '👍', count: 3, reacted: true, by: ['Mara', 'Theo'] },
        { emoji: '🎉', count: 5, reacted: true, by: ['Mara', 'Theo'] },
        { emoji: '👀', count: 2, reacted: true },
        { emoji: '🚀', count: 4 },
      ],
    })
    expect(pill('Thumbs up, 3')).toHaveAccessibleDescription('You, Mara, and Theo')
    expect(pill('Hooray, 5')).toHaveAccessibleDescription('You, Mara, and 3 others')
    expect(pill('Eyes, 2')).toHaveAccessibleDescription('You and 1 other')
    // No names and not yours: the count says it all.
    expect(pill('Rocket, 4')).not.toHaveAccessibleDescription()
  })

  test('pressing a pill adds yours: the count goes up, it shows pressed, and onReact hears it', async () => {
    const user = userEvent.setup()
    const onReact = vi.fn()
    const onValueChange = vi.fn()
    const { sink } = renderGroup({ onReact, onValueChange })
    await user.click(pill('Hooray, 1'))
    expect(pill('Hooray, 2')).toHaveAttribute('aria-pressed', 'true')
    expect(pill('Hooray, 2')).toHaveAccessibleDescription('You and Priya')
    expect(onReact).toHaveBeenCalledWith('🎉', true)
    expect(onValueChange).toHaveBeenLastCalledWith([REACTIONS[0], { emoji: '🎉', count: 2, reacted: true, by: ['Priya'] }, REACTIONS[2]])
    expect(sounds(sink)).toEqual(['toggleOn'])
  })

  test('pressing your own pill takes yours away', async () => {
    const user = userEvent.setup()
    const onReact = vi.fn()
    const { sink } = renderGroup({ onReact })
    await user.click(pill('Thumbs up, 3'))
    expect(pill('Thumbs up, 2')).toHaveAttribute('aria-pressed', 'false')
    expect(pill('Thumbs up, 2')).toHaveAccessibleDescription('Mara and Theo')
    expect(onReact).toHaveBeenCalledWith('👍', false)
    expect(sounds(sink)).toEqual(['toggleOff'])
  })

  test('a reaction nobody holds any more leaves; focus moves to the next pill and the removal is announced', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderGroup({ defaultValue: [{ emoji: '🎉', count: 1, reacted: true }, ...REACTIONS.slice(2)], onValueChange })
    await user.click(pill('Hooray, 1'))
    expect(screen.queryByRole('button', { name: /^Hooray/ })).not.toBeInTheDocument()
    expect(onValueChange).toHaveBeenLastCalledWith([REACTIONS[2]])
    expect(pill('Eyes, 5')).toHaveFocus()
    expect(announced()).toBe('Removed Hooray')
  })

  test('with no pill left, focus lands on the add button', async () => {
    const user = userEvent.setup()
    renderGroup({ defaultValue: [{ emoji: '🎉', count: 1, reacted: true }] })
    await user.click(pill('Hooray, 1'))
    expect(screen.getByRole('list', { name: 'Reactions' }).querySelectorAll('[data-slot=reaction-group-item]')).toHaveLength(0)
    expect(addButton()).toHaveFocus()
  })

  test('the add button offers the default emoji, named and pressed where they are yours', async () => {
    const user = userEvent.setup()
    renderGroup()
    const panel = await openPanel(user)
    const names = within(panel)
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'))
    expect(names).toEqual(['Thumbs up', 'Thumbs down', 'Laugh', 'Hooray', 'Confused', 'Heart', 'Rocket', 'Eyes'])
    expect(within(panel).getByRole('button', { name: 'Thumbs up' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(panel).getByRole('button', { name: 'Rocket' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('a new emoji from the panel joins at the end with yours on it; the panel closes and it is announced', async () => {
    const user = userEvent.setup()
    const onReact = vi.fn()
    const onValueChange = vi.fn()
    renderGroup({ onReact, onValueChange })
    const panel = await openPanel(user)
    await user.click(within(panel).getByRole('button', { name: 'Rocket' }))
    await closed()
    expect(onReact).toHaveBeenCalledWith('🚀', true)
    expect(onValueChange).toHaveBeenLastCalledWith([...REACTIONS, { emoji: '🚀', count: 1, reacted: true }])
    const pills = screen.getByRole('list', { name: 'Reactions' }).querySelectorAll('[data-slot=reaction-group-item]')
    expect(pills[3]).toHaveAccessibleName('Rocket, 1')
    expect(pills[3]).toHaveAttribute('aria-pressed', 'true')
    expect(announced()).toBe('Added Rocket')
  })

  test('picking one that is already yours takes it away', async () => {
    const user = userEvent.setup()
    const onReact = vi.fn()
    renderGroup({ onReact })
    const panel = await openPanel(user)
    await user.click(within(panel).getByRole('button', { name: 'Thumbs up' }))
    expect(onReact).toHaveBeenCalledWith('👍', false)
    expect(pill('Thumbs up, 2')).toHaveAttribute('aria-pressed', 'false')
    expect(announced()).toBe('Removed Thumbs up')
  })

  test('❤ and ❤️ are one reaction', async () => {
    const user = userEvent.setup()
    const onReact = vi.fn()
    renderGroup({ defaultValue: [{ emoji: '❤', count: 2 }], onReact })
    expect(pill('Heart, 2')).toBeInTheDocument()
    const panel = await openPanel(user)
    await user.click(within(panel).getByRole('button', { name: 'Heart' }))
    // The pill's own spelling goes to the app.
    expect(onReact).toHaveBeenCalledWith('❤', true)
    expect(pill('Heart, 3')).toHaveAttribute('aria-pressed', 'true')
    expect(within(screen.getByRole('list', { name: 'Reactions' })).getAllByRole('button', { name: /^Heart/ })).toHaveLength(1)
  })

  test('the app chooses the emoji and names them; a pill takes its name from its label or its choice', async () => {
    const user = userEvent.setup()
    renderGroup({
      defaultValue: [
        { emoji: '🦄', count: 2 },
        { emoji: '🪐', count: 1, label: 'Ringed planet' },
        { emoji: '🧪', count: 4 },
      ],
      choices: [{ emoji: '🦄', label: 'Unicorn' }, '✅'],
    })
    expect(pill('Unicorn, 2')).toBeInTheDocument()
    expect(pill('Ringed planet, 1')).toBeInTheDocument()
    // No name anywhere: the emoji itself.
    expect(pill('🧪, 4')).toBeInTheDocument()
    const panel = await openPanel(user)
    expect(within(panel).getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual(['Unicorn', '✅'])
  })

  test("renderPicker puts the app's own picker under the choices, and pick reacts and closes", async () => {
    const user = userEvent.setup()
    const onReact = vi.fn()
    renderGroup({
      onReact,
      renderPicker: (pick) => (
        <button type="button" onClick={() => pick('🦄', 'Unicorn')}>
          More emoji
        </button>
      ),
    })
    const panel = await openPanel(user)
    expect(within(panel).getByRole('separator')).toBeInTheDocument()
    await user.click(within(panel).getByRole('button', { name: 'More emoji' }))
    await closed()
    expect(onReact).toHaveBeenCalledWith('🦄', true)
    expect(pill('Unicorn, 1')).toHaveAttribute('aria-pressed', 'true')
  })

  test('while onReact runs the pill is busy and ignores presses, then settles', async () => {
    const user = userEvent.setup()
    const save = deferred()
    const onReact = vi.fn(() => save.promise)
    renderGroup({ onReact })
    await user.click(pill('Hooray, 1'))
    expect(pill('Hooray, 2')).toHaveAttribute('aria-busy', 'true')
    await user.click(pill('Hooray, 2'))
    expect(onReact).toHaveBeenCalledTimes(1)
    expect(pill('Hooray, 2')).toHaveAttribute('aria-pressed', 'true')
    await act(async () => save.resolve())
    expect(pill('Hooray, 2')).not.toHaveAttribute('aria-busy')
    expect(reason()).toBe('')
  })

  test('a rejection undoes the press and shows why under the row, until the next press', async () => {
    const user = userEvent.setup()
    const save = deferred()
    const onValueChange = vi.fn()
    // Only the first press fails: the next one clears the reason.
    const { sink } = renderGroup({ onReact: vi.fn().mockReturnValueOnce(save.promise), onValueChange })
    await user.click(pill('Hooray, 1'))
    await act(async () => save.reject(new Error('503')))
    expect(pill('Hooray, 1')).toHaveAttribute('aria-pressed', 'false')
    expect(onValueChange).toHaveBeenLastCalledWith(REACTIONS)
    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t save your reaction')
    expect(sounds(sink)).toEqual(['toggleOn', 'error'])
    await user.click(pill('Eyes, 5'))
    await waitFor(() => expect(reason()).toBe(''))
  })

  test('a removal that fails puts the pill back in its place', async () => {
    const user = userEvent.setup()
    const save = deferred()
    renderGroup({ defaultValue: [REACTIONS[2]!, { emoji: '🎉', count: 1, reacted: true, label: 'Party' }, REACTIONS[0]!], onReact: () => save.promise })
    await user.click(pill('Party, 1'))
    expect(screen.queryByRole('button', { name: /^Party/ })).not.toBeInTheDocument()
    await act(async () => save.reject(new Error('offline')))
    const pills = [...document.querySelectorAll('[data-slot=reaction-group-item]')]
    expect(pills.map((p) => p.getAttribute('aria-label'))).toEqual(['Eyes, 5', 'Party, 1', 'Thumbs up, 3'])
    expect(pills[1]).toHaveAttribute('aria-pressed', 'true')
  })

  test('a rejection keeps changes made since: only the press is taken back', async () => {
    const save = deferred()
    function Live() {
      const [value, setValue] = useState<ReactionGroupItem[]>(REACTIONS)
      return (
        <>
          <ReactionGroup value={value} onValueChange={setValue} onReact={() => save.promise} />
          <button type="button" onClick={() => setValue((v) => v.map((r) => (r.emoji === '🎉' ? { ...r, count: r.count + 1, by: [...(r.by ?? []), 'Noor'] } : r)))}>
            Someone reacts
          </button>
        </>
      )
    }
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <Live />
      </YoujProvider>,
    )
    await user.click(pill('Hooray, 1'))
    await user.click(screen.getByRole('button', { name: 'Someone reacts' }))
    expect(pill('Hooray, 3')).toHaveAttribute('aria-pressed', 'true')
    await act(async () => save.reject(new Error('503')))
    expect(pill('Hooray, 2')).toHaveAttribute('aria-pressed', 'false')
    expect(pill('Hooray, 2')).toHaveAccessibleDescription('Priya and Noor')
  })

  test('errorLabel replaces the reason, or makes it from what was thrown; a throw undoes too', async () => {
    const user = userEvent.setup()
    const { unmount } = renderGroup({
      onReact: () => {
        throw new Error('Reactions are closed on this post')
      },
      errorLabel: (error) => (error as Error).message,
    })
    await user.click(pill('Eyes, 5'))
    expect(pill('Eyes, 5')).toHaveAttribute('aria-pressed', 'false')
    expect(await screen.findByRole('alert')).toHaveTextContent('Reactions are closed on this post')
    unmount()
    renderGroup({ onReact: () => Promise.reject(new Error('x')), errorLabel: 'Try again in a moment' })
    await user.click(pill('Eyes, 5'))
    expect(await screen.findByText('Try again in a moment')).toHaveAttribute('role', 'alert')
  })

  test('disabled: the reactions still show and say who reacted, but presses do nothing and there is no add button', async () => {
    const user = userEvent.setup()
    const onReact = vi.fn()
    const { root } = renderGroup({ disabled: true, onReact })
    expect(root).toHaveAttribute('data-disabled')
    expect(pill('Thumbs up, 3')).toHaveAttribute('aria-disabled', 'true')
    expect(pill('Thumbs up, 3')).toHaveAccessibleDescription('You, Mara, and Theo')
    await user.click(pill('Thumbs up, 3'))
    expect(onReact).not.toHaveBeenCalled()
    expect(pill('Thumbs up, 3')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('button', { name: 'Add reaction' })).not.toBeInTheDocument()
  })

  test('controlled: it shows the value it is given, and reports presses without changing it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = renderGroup({ value: REACTIONS, onValueChange })
    await user.click(pill('Eyes, 5'))
    expect(onValueChange).toHaveBeenCalledWith([REACTIONS[0], REACTIONS[1], { ...REACTIONS[2], count: 6, reacted: true }])
    expect(pill('Eyes, 5')).toHaveAttribute('aria-pressed', 'false')
    rerender(
      <YoujProvider reducedMotion="always">
        <ReactionGroup value={[{ emoji: '👀', count: 6, reacted: true }]} onValueChange={onValueChange} />
      </YoujProvider>,
    )
    expect(pill('Eyes, 6')).toHaveAttribute('aria-pressed', 'true')
    // A reaction with no one on it isn't shown.
    rerender(
      <YoujProvider reducedMotion="always">
        <ReactionGroup value={[{ emoji: '👀', count: 0 }]} />
      </YoujProvider>,
    )
    expect(screen.queryByRole('button', { name: /^Eyes/ })).not.toBeInTheDocument()
  })

  test('arrow keys move between the choices, reversed right to left, with Home and End', async () => {
    const user = userEvent.setup()
    renderGroup()
    const panel = await openPanel(user)
    const choice = (name: string) => within(panel).getByRole('button', { name })
    choice('Laugh').focus()
    fireEvent.keyDown(choice('Laugh'), { key: 'ArrowRight' })
    expect(choice('Hooray')).toHaveFocus()
    fireEvent.keyDown(choice('Hooray'), { key: 'ArrowLeft' })
    expect(choice('Laugh')).toHaveFocus()
    fireEvent.keyDown(choice('Laugh'), { key: 'End' })
    expect(choice('Eyes')).toHaveFocus()
    fireEvent.keyDown(choice('Eyes'), { key: 'Home' })
    expect(choice('Thumbs up')).toHaveFocus()
  })

  test('right to left, ArrowLeft moves forward', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always" dir="rtl">
        <ReactionGroup defaultValue={REACTIONS} />
      </YoujProvider>,
    )
    const panel = await openPanel(user)
    const choice = (name: string) => within(panel).getByRole('button', { name })
    choice('Laugh').focus()
    fireEvent.keyDown(choice('Laugh'), { key: 'ArrowLeft' })
    expect(choice('Hooray')).toHaveFocus()
  })

  test('size sm makes a denser row; sound={false} keeps it silent', async () => {
    const user = userEvent.setup()
    const { root, sink } = renderGroup({ size: 'sm', sound: false })
    expect(root).toHaveAttribute('data-size', 'sm')
    expect(pill('Hooray, 1').className).toContain('h-control-xs')
    await user.click(pill('Hooray, 1'))
    expect(sink).not.toHaveBeenCalled()
  })

  test('its words come from the labels: German', () => {
    render(
      <YoujProvider reducedMotion="always" locale="de" labels={de}>
        <ReactionGroup defaultValue={[{ emoji: '👍', count: 1200, reacted: true, by: ['Mara'] }]} />
      </YoujProvider>,
    )
    expect(screen.getByRole('list', { name: 'Reaktionen' })).toBeInTheDocument()
    expect(pill('Daumen hoch, 1.200')).toHaveAccessibleDescription('Sie, Mara und 1.198 weitere Personen')
    expect(screen.getByRole('button', { name: 'Reaktion hinzufügen' })).toBeInTheDocument()
  })
})
