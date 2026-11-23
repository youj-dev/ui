import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SoundCueContext } from '@youj/core/internal'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { InlineEdit, type InlineEditProps } from './inline-edit'

function deferred() {
  let resolve!: () => void
  let reject!: (error: unknown) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/* Reduced motion, so a reason lands at once. `sink` hears the sound cues. */
function renderEdit(props: Partial<InlineEditProps> = {}, sink = vi.fn()) {
  const result = render(
    <YoujProvider reducedMotion="always">
      <SoundCueContext.Provider value={sink}>
        <InlineEdit label="Project name" defaultValue="Apollo" {...props} />
        <button type="button">Elsewhere</button>
      </SoundCueContext.Provider>
    </YoujProvider>,
  )
  const root = result.container.querySelector<HTMLElement>('[data-slot=inline-edit]')!
  return { ...result, root, sink }
}

const preview = (name = 'Apollo, edit Project name') => screen.getByRole('button', { name })
const field = (name = 'Project name') => screen.getByRole('textbox', { name }) as HTMLInputElement & HTMLTextAreaElement
const reason = () => document.querySelector('[data-slot=inline-edit-error]')

describe('InlineEdit', () => {
  afterEach(() => vi.useRealTimers())

  test('reads as text named by what it shows, and opens a field in its place, focused with the text selected', async () => {
    const user = userEvent.setup()
    const onEditingChange = vi.fn()
    const { root } = renderEdit({ onEditingChange })
    expect(root).toHaveAttribute('data-state', 'preview')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    await user.click(preview())
    expect(root).toHaveAttribute('data-state', 'editing')
    const input = field()
    expect(input).toHaveValue('Apollo')
    expect(input).toHaveFocus()
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 6])
    expect(input).toHaveAccessibleDescription('Enter to save. Escape to cancel.')
    expect(onEditingChange).toHaveBeenLastCalledWith(true)
  })

  test('a click puts the caret where it landed, where the browser can say', async () => {
    const user = userEvent.setup()
    renderEdit()
    const text = document.querySelector('[data-slot=inline-edit-text]')!.firstChild!
    const lookup = document as unknown as { caretPositionFromPoint?: () => { offsetNode: Node; offset: number } }
    lookup.caretPositionFromPoint = () => ({ offsetNode: text, offset: 3 })
    try {
      await user.click(preview())
      expect([field().selectionStart, field().selectionEnd]).toEqual([3, 3])
    } finally {
      delete lookup.caretPositionFromPoint
    }
  })

  test('F2 opens it from the keyboard too', () => {
    renderEdit()
    preview().focus()
    fireEvent.keyDown(preview(), { key: 'F2' })
    expect(field()).toHaveFocus()
  })

  test('Enter saves the change and returns focus to the text', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onValueChange = vi.fn()
    const { root } = renderEdit({ onSave, onValueChange })
    await user.click(preview())
    await user.keyboard('Artemis{Enter}')
    expect(onSave).toHaveBeenCalledWith('Artemis')
    expect(onValueChange).toHaveBeenCalledWith('Artemis')
    expect(root).toHaveAttribute('data-state', 'preview')
    expect(preview('Artemis, edit Project name')).toHaveFocus()
    // Saved at once, with no promise: nothing to wait for, so no check.
    expect(root).not.toHaveAttribute('data-status')
  })

  test('Escape cancels the draft here, not in a dialog around it, and returns focus to the text', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onKeyDown = vi.fn()
    render(
      <YoujProvider reducedMotion="always">
        <div onKeyDown={onKeyDown}>
          <InlineEdit label="Project name" defaultValue="Apollo" onSave={onSave} />
        </div>
      </YoujProvider>,
    )
    await user.click(preview())
    await user.keyboard('Artemis{Escape}')
    expect(onSave).not.toHaveBeenCalled()
    expect(preview()).toHaveFocus()
    expect(onKeyDown.mock.calls.some(([event]) => event.key === 'Escape')).toBe(false)
    // The next opening starts from the saved value, not the dropped draft.
    await user.click(preview())
    expect(field()).toHaveValue('Apollo')
  })

  test('leaving the field saves the draft and leaves focus where it went', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderEdit({ onValueChange })
    await user.click(preview())
    await user.keyboard('Artemis')
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
    expect(onValueChange).toHaveBeenCalledWith('Artemis')
    expect(preview('Artemis, edit Project name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus()
  })

  test('saveOnBlur={false}: leaving the field cancels instead', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderEdit({ onValueChange, saveOnBlur: false })
    await user.click(preview())
    await user.keyboard('Artemis')
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(preview()).toBeInTheDocument()
  })

  test('an unchanged draft just closes, without saving', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onValueChange = vi.fn()
    const onEditingChange = vi.fn()
    renderEdit({ onSave, onValueChange, onEditingChange })
    await user.click(preview())
    await user.keyboard('{Enter}')
    expect(onSave).not.toHaveBeenCalled()
    expect(onValueChange).not.toHaveBeenCalled()
    expect(onEditingChange).toHaveBeenLastCalledWith(false)
    expect(preview()).toHaveFocus()
  })

  test('validate refuses a draft: it stays open and invalid with the reason, through a blur, until it is fixed', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const { root, sink } = renderEdit({ onSave, validate: (next) => (next.trim() ? null : 'A project needs a name.') })
    await user.click(preview())
    await user.clear(field())
    await user.keyboard('{Enter}')
    expect(onSave).not.toHaveBeenCalled()
    expect(root).toHaveAttribute('data-state', 'editing')
    expect(root).toHaveAttribute('data-invalid')
    expect(field()).toHaveAttribute('aria-invalid', 'true')
    expect(field()).toHaveAccessibleDescription('A project needs a name. Enter to save. Escape to cancel.')
    expect(reason()).toHaveAttribute('role', 'alert')
    expect(reason()).toHaveTextContent('A project needs a name.')
    expect(sink).toHaveBeenCalledWith('error', true)
    // Leaving doesn't drop a refused draft.
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
    expect(root).toHaveAttribute('data-state', 'editing')
    // Typing clears the reason, and the fix saves.
    await user.click(field())
    await user.keyboard('Artemis')
    expect(field()).not.toHaveAttribute('aria-invalid')
    expect(reason()).not.toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(onSave).toHaveBeenCalledWith('Artemis')
    expect(root).toHaveAttribute('data-state', 'preview')
  })

  test('an async save holds the field read-only with a spinner, then closes with a check and says so', async () => {
    const work = deferred()
    const onSave = vi.fn(() => work.promise)
    const onValueChange = vi.fn()
    const { root, sink } = renderEdit({ onSave, onValueChange })
    fireEvent.click(preview())
    fireEvent.change(field(), { target: { value: 'Artemis' } })
    fireEvent.keyDown(field(), { key: 'Enter' })
    const input = field()
    expect(root).toHaveAttribute('data-status', 'pending')
    expect(input).toHaveAttribute('readonly')
    expect(input).toHaveAttribute('aria-busy', 'true')
    expect(root.querySelector('[data-slot=spinner]')).toBeInTheDocument()
    expect(screen.getByText('Saving…')).toBeInTheDocument()
    expect(onValueChange).not.toHaveBeenCalled()
    // Saving again, cancelling and leaving all wait for it.
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(root).toHaveAttribute('data-state', 'editing')

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await act(async () => work.resolve())
    expect(onValueChange).toHaveBeenCalledWith('Artemis')
    expect(root).toHaveAttribute('data-state', 'preview')
    expect(root).toHaveAttribute('data-status', 'success')
    expect(preview('Artemis, edit Project name')).toHaveFocus()
    expect(preview('Artemis, edit Project name').querySelector('svg')).toBeInTheDocument()
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(sink).toHaveBeenCalledWith('success', true)
    // The check holds for a moment, then goes.
    act(() => vi.advanceTimersByTime(5000))
    expect(root).not.toHaveAttribute('data-status')
    expect(preview('Artemis, edit Project name').querySelector('svg')).not.toBeInTheDocument()
  })

  test('a rejected save keeps the draft open with the error’s message, to fix and save again', async () => {
    const work = deferred()
    const onValueChange = vi.fn()
    const { root } = renderEdit({ onSave: () => work.promise, onValueChange })
    fireEvent.click(preview())
    fireEvent.change(field(), { target: { value: 'apollo' } })
    fireEvent.keyDown(field(), { key: 'Enter' })
    await act(async () => work.reject(new Error('That address is taken.')))
    expect(root).toHaveAttribute('data-state', 'editing')
    expect(root).not.toHaveAttribute('data-status')
    expect(field()).toHaveValue('apollo')
    expect(field()).not.toHaveAttribute('readonly')
    expect(field()).toHaveAttribute('aria-invalid', 'true')
    expect(reason()).toHaveTextContent('That address is taken.')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('a save that throws, or rejects with no message, shows errorLabel or “Couldn’t save”', async () => {
    renderEdit({ label: 'One', onSave: () => Promise.reject('offline') })
    renderEdit({
      label: 'Two',
      onSave: () => {
        throw new Error('offline')
      },
      errorLabel: (error) => `Not saved: ${(error as Error).message}`,
    })
    fireEvent.click(preview('Apollo, edit Two'))
    fireEvent.change(field('Two'), { target: { value: 'Artemis' } })
    fireEvent.keyDown(field('Two'), { key: 'Enter' })
    expect(screen.getByText('Not saved: offline')).toBeInTheDocument()
    fireEvent.click(preview('Apollo, edit One'))
    fireEvent.change(field('One'), { target: { value: 'Artemis' } })
    // The rejection lands a microtask later.
    await act(async () => fireEvent.keyDown(field('One'), { key: 'Enter' }))
    expect(screen.getByText('Couldn’t save')).toBeInTheDocument()
  })

  test('multiline: Enter starts a new line, Ctrl or Command with Enter saves, and the preview keeps the break', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderEdit({ label: 'Notes', defaultValue: 'One', multiline: true, onValueChange })
    await user.click(screen.getByRole('button', { name: 'One, edit Notes' }))
    const area = field('Notes')
    expect(area.tagName).toBe('TEXTAREA')
    // The caret goes to the end rather than selecting a paragraph.
    expect([area.selectionStart, area.selectionEnd]).toEqual([3, 3])
    expect(area).toHaveAccessibleDescription('Control or Command and Enter to save. Escape to cancel.')
    await user.keyboard('{Enter}Two')
    expect(area).toHaveValue('One\nTwo')
    expect(onValueChange).not.toHaveBeenCalled()
    await user.keyboard('{Control>}{Enter}{/Control}')
    expect(onValueChange).toHaveBeenCalledWith('One\nTwo')
    expect(document.querySelector('[data-slot=inline-edit-text]')!.textContent).toBe('One\nTwo')
  })

  test('multiline has Save and Cancel in its frame; a press anywhere there keeps focus, so Cancel never saves first', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderEdit({ label: 'Notes', defaultValue: 'One', multiline: true, onValueChange })
    await user.click(screen.getByRole('button', { name: 'One, edit Notes' }))
    await user.keyboard(' more')
    // The toolbar row's empty space isn't leaving the field either.
    await user.click(field('Notes').parentElement!.querySelector<HTMLElement>('[data-slot=input-group-addon]')!)
    expect(field('Notes')).toHaveFocus()
    expect(onValueChange).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'One, edit Notes' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'One, edit Notes' }))
    await user.keyboard(' more')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onValueChange).toHaveBeenCalledWith('One more')
  })

  test('actions adds Save and Cancel to one line, and actions={false} takes them from multiline', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderEdit({ actions: true, onValueChange })
    renderEdit({ label: 'Notes', multiline: true, actions: false })
    await user.click(preview())
    await user.keyboard('Artemis')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onValueChange).toHaveBeenCalledWith('Artemis')
    await user.click(screen.getByRole('button', { name: 'Apollo, edit Notes' }))
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
  })

  test('Enter never saves mid IME composition', () => {
    const onValueChange = vi.fn()
    renderEdit({ onValueChange })
    fireEvent.click(preview())
    const input = field()
    fireEvent.change(input, { target: { value: 'にほんご' } })
    // Chrome and Firefox flag the keydown itself.
    fireEvent.compositionStart(input)
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    // Our own flag covers a browser that doesn't.
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.compositionEnd(input)
    // Safari's committing Enter arrives after compositionend, as keyCode 229.
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 })
    expect(onValueChange).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onValueChange).toHaveBeenCalledWith('にほんご')
  })

  test('editing can be controlled: it opens focused with the text selected, and closes when told', () => {
    const onEditingChange = vi.fn()
    const ui = (editing: boolean) => (
      <YoujProvider reducedMotion="always">
        <InlineEdit label="Card title" defaultValue="Untitled card" editing={editing} onEditingChange={onEditingChange} />
      </YoujProvider>
    )
    const { rerender } = render(ui(false))
    // A press asks; the owner decides.
    fireEvent.click(screen.getByRole('button', { name: 'Untitled card, edit Card title' }))
    expect(onEditingChange).toHaveBeenLastCalledWith(true)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    rerender(ui(true))
    const input = field('Card title')
    expect(input).toHaveFocus()
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 13])
    rerender(ui(false))
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  test('defaultEditing opens it on the first render, focused, for an item just created', () => {
    renderEdit({ label: 'Card title', defaultValue: 'Untitled card', defaultEditing: true })
    expect(field('Card title')).toHaveFocus()
    expect(field('Card title').selectionEnd).toBe(13)
  })

  test('an empty value shows the placeholder, muted, and names the text by it', () => {
    renderEdit({ label: 'Nickname', defaultValue: '' })
    renderEdit({ label: 'Alias', defaultValue: '', placeholder: 'Add an alias…' })
    expect(screen.getByRole('button', { name: 'Empty, edit Nickname' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add an alias…, edit Alias' }))
    expect(field('Alias')).toHaveAttribute('placeholder', 'Add an alias…')
  })

  test('disabled reads as text and never opens', () => {
    renderEdit({ disabled: true })
    expect(preview()).toBeDisabled()
    fireEvent.click(preview())
    fireEvent.keyDown(preview(), { key: 'F2' })
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  test('its strings come from the provider’s language pack', () => {
    render(
      <YoujProvider reducedMotion="always" labels={de}>
        <InlineEdit label="Projektname" defaultValue="Apollo" actions />
      </YoujProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Apollo, Projektname bearbeiten' }))
    expect(field('Projektname')).toHaveAccessibleDescription('Eingabetaste zum Speichern. Esc zum Abbrechen.')
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeInTheDocument()
  })
})
