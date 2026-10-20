import { useState } from 'react'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromptInput, usePromptAttachments, type PromptAttachment, type PromptStatus } from './chat-prompt-input'

const field = () => screen.getByRole('textbox', { name: 'Message' })
const send = () => screen.getByRole('button', { name: 'Send message' })

describe('PromptInput', () => {
  test('Enter sends the trimmed text, clears the field and keeps focus in it', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<PromptInput onSubmit={onSubmit} />)
    await user.click(field())
    await user.keyboard('  Ship orion  {Enter}')
    expect(onSubmit).toHaveBeenCalledWith({ text: 'Ship orion', attachments: [] })
    expect(field()).toHaveValue('')
    expect(field()).toHaveFocus()
  })

  test('Shift+Enter adds a line instead of sending', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<PromptInput onSubmit={onSubmit} />)
    await user.click(field())
    await user.keyboard('one{Shift>}{Enter}{/Shift}two')
    expect(onSubmit).not.toHaveBeenCalled()
    expect(field()).toHaveValue('one\ntwo')
    await user.click(send())
    expect(onSubmit).toHaveBeenCalledWith({ text: 'one\ntwo', attachments: [] })
  })

  test('Enter never sends mid IME composition', () => {
    const onSubmit = vi.fn()
    render(<PromptInput defaultValue="にほんご" onSubmit={onSubmit} />)
    // Chrome and Firefox flag the keydown itself.
    fireEvent.compositionStart(field())
    fireEvent.keyDown(field(), { key: 'Enter', isComposing: true })
    expect(onSubmit).not.toHaveBeenCalled()
    // Our own flag covers a browser that doesn't.
    fireEvent.keyDown(field(), { key: 'Enter' })
    expect(onSubmit).not.toHaveBeenCalled()
    fireEvent.compositionEnd(field())
    // Safari's committing Enter arrives after compositionend, as keyCode 229.
    fireEvent.keyDown(field(), { key: 'Enter', keyCode: 229 })
    expect(onSubmit).not.toHaveBeenCalled()
    // The next Enter is a real one.
    fireEvent.keyDown(field(), { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalledWith({ text: 'にほんご', attachments: [] })
  })

  test('send is off while there is nothing to send', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<PromptInput onSubmit={onSubmit} />)
    expect(send()).toHaveAttribute('aria-disabled', 'true')
    await user.click(field())
    await user.keyboard('   {Enter}')
    expect(onSubmit).not.toHaveBeenCalled()
    await user.keyboard('x')
    expect(send()).not.toHaveAttribute('aria-disabled', 'true')
  })

  test('attachments alone are enough to send, but not while one uploads', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const pdf: PromptAttachment = { id: 'a', name: 'incident.pdf', type: 'application/pdf', size: 2048 }
    const { rerender } = render(<PromptInput attachments={[{ ...pdf, status: 'uploading' }]} onSubmit={onSubmit} />)
    expect(send()).toHaveAttribute('aria-disabled', 'true')
    rerender(<PromptInput attachments={[pdf]} onSubmit={onSubmit} />)
    await user.click(send())
    expect(onSubmit).toHaveBeenCalledWith({ text: '', attachments: [pdf] })
  })

  describe('while the assistant works', () => {
    function Busy({ onStop, onSubmit }: { onStop: () => void; onSubmit: () => void }) {
      const [status, setStatus] = useState<PromptStatus>('streaming')
      return (
        <PromptInput
          status={status}
          defaultValue="next question"
          onSubmit={onSubmit}
          onStop={() => {
            onStop()
            setStatus('idle')
          }}
        />
      )
    }

    test('send becomes stop; Enter waits, and the button or Escape stops', async () => {
      const user = userEvent.setup()
      const onStop = vi.fn()
      const onSubmit = vi.fn()
      render(<Busy onStop={onStop} onSubmit={onSubmit} />)
      const stop = screen.getByRole('button', { name: 'Stop generating' })
      await user.click(field())
      await user.keyboard('{Enter}')
      expect(onSubmit).not.toHaveBeenCalled()
      await user.click(stop)
      expect(onStop).toHaveBeenCalledTimes(1)
      // The same button, now sending again: focus wasn't lost to a remount.
      expect(send()).toBe(stop)
    })

    test('Escape in the field stops', async () => {
      const user = userEvent.setup()
      const onStop = vi.fn()
      render(<Busy onStop={onStop} onSubmit={() => {}} />)
      await user.click(field())
      await user.keyboard('{Escape}')
      expect(onStop).toHaveBeenCalledTimes(1)
    })
  })

  test('disabled blocks typing, attaching and sending', () => {
    render(<PromptInput disabled defaultValue="hi" onAttach={() => {}} onSubmit={() => {}} />)
    expect(field()).toBeDisabled()
    expect(send()).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'Attach files' })).toBeDisabled()
  })

  describe('attachments', () => {
    test('a pasted image is attached, and nothing else is pasted', () => {
      const onAttach = vi.fn()
      render(<PromptInput onAttach={onAttach} accept="image/*" onSubmit={() => {}} />)
      const image = new File(['png'], 'shot.png', { type: 'image/png' })
      const text = new File(['x'], 'notes.txt', { type: 'text/plain' })
      const event = fireEvent.paste(field(), { clipboardData: { files: [image, text], getData: () => '' } })
      expect(onAttach).toHaveBeenCalledWith([image])
      expect(event).toBe(false) // default prevented
    })

    test('pasting text with an image keeps the text', () => {
      const onAttach = vi.fn()
      render(<PromptInput onAttach={onAttach} onSubmit={() => {}} />)
      const image = new File(['png'], 'shot.png', { type: 'image/png' })
      const event = fireEvent.paste(field(), { clipboardData: { files: [image], getData: () => 'caption' } })
      expect(onAttach).toHaveBeenCalledWith([image])
      expect(event).toBe(true)
    })

    function Attached() {
      const [items, setItems] = useState<PromptAttachment[]>([
        { id: 'a', name: 'one.pdf', size: 10 },
        { id: 'b', name: 'two.pdf', size: 20 },
      ])
      return <PromptInput attachments={items} onRemoveAttachment={(id) => setItems((list) => list.filter((a) => a.id !== id))} onSubmit={() => {}} />
    }

    test('removing one moves focus to its neighbour, then back to the text field', async () => {
      const user = userEvent.setup()
      render(<Attached />)
      expect(screen.getByRole('list', { name: 'Attachments' })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Remove one.pdf' }))
      expect(screen.getByRole('button', { name: 'Remove two.pdf' })).toHaveFocus()
      await user.keyboard('{Enter}')
      expect(field()).toHaveFocus()
      expect(screen.queryByRole('list', { name: 'Attachments' })).toBeNull()
    })
  })

  test('a character limit counts near the end and blocks sending past it', async () => {
    const user = userEvent.setup()
    render(<PromptInput maxLength={10} defaultValue="12345678" onSubmit={() => {}} />)
    await user.click(field())
    await user.keyboard('9')
    expect(field()).toHaveAccessibleDescription('1 characters left')
    await user.keyboard('abc')
    expect(field()).toHaveAttribute('aria-invalid', 'true')
    expect(field()).toHaveAccessibleDescription('2 characters over the limit')
    expect(send()).toHaveAttribute('aria-disabled', 'true')
  })
})

describe('usePromptAttachments', () => {
  test('previews images with object URLs and revokes them when removed or unmounted', () => {
    let n = 0
    const create = vi.fn(() => `blob:preview-${++n}`)
    const revoke = vi.fn()
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke })
    const { result, unmount } = renderHook(() => usePromptAttachments())
    act(() => result.current.add([new File(['a'], 'a.png', { type: 'image/png' }), new File(['b'], 'b.pdf', { type: 'application/pdf' })]))
    expect(result.current.attachments.map((a) => a.url)).toEqual(['blob:preview-1', undefined])
    act(() => result.current.remove(result.current.attachments[0]!.id))
    expect(revoke).toHaveBeenCalledWith('blob:preview-1')
    act(() => result.current.add([new File(['c'], 'c.png', { type: 'image/png' })]))
    unmount()
    expect(revoke).toHaveBeenCalledWith('blob:preview-2')
  })
})
