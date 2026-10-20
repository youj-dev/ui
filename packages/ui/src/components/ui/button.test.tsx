import { useState, type ComponentProps } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Button } from './button'

describe('Button', () => {
  test('a className that sets a fill marks it, so a style drops its sheen; layout classes do not', () => {
    render(
      <>
        <Button className="bg-red-500">Red</Button>
        <Button className="w-full rounded-none">Wide</Button>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Red' })).toHaveAttribute('data-fill', 'custom')
    expect(screen.getByRole('button', { name: 'Wide' })).not.toHaveAttribute('data-fill')
  })

  test('is a native button that fires on click, Enter and Space', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })
    await user.click(button)
    button.focus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(3)
  })

  test('the small and extra-small sizes take a 44px touch hit area; the default and large sizes already clear it', () => {
    render(
      <>
        <Button size="xs">xs</Button>
        <Button size="sm">sm</Button>
        <Button size="icon-xs" aria-label="a" />
        <Button size="icon-sm" aria-label="b" />
        <Button>md</Button>
        <Button size="lg">lg</Button>
      </>,
    )
    const hit = screen.getAllByRole('button').map((b) => b.className.includes('touch:yj-hit'))
    expect(hit).toEqual([true, true, true, true, false, false])
  })

  test('the variants that cast a shadow press the theme’s way; the flat ones only scale', () => {
    render(
      <>
        <Button>Deploy</Button>
        <Button variant="outline">Preview</Button>
        <Button variant="ghost">Cancel</Button>
      </>,
    )
    // A hard-shadow theme presses into the shadow (--ui--press-shift) as it collapses; a soft one scales like before.
    for (const name of ['Deploy', 'Preview']) {
      const button = screen.getByRole('button', { name })
      expect(button).toHaveClass('own:active:translate-(--ui--press-shift)', 'active:scale-[calc(1_-_var(--ui--press-depth,0.03)_*_var(--ui--press-soft)_*_var(--yj-motion,1))]', 'own:active:shadow-xs-soft', 'reduced:active:translate-none')
      expect(button).not.toHaveClass('active:scale-[calc(1_-_var(--ui--press-depth,0.03)_*_var(--yj-motion,1))]')
    }
    const ghost = screen.getByRole('button', { name: 'Cancel' })
    expect(ghost).toHaveClass('active:scale-[calc(1_-_var(--ui--press-depth,0.03)_*_var(--yj-motion,1))]')
    expect(ghost).not.toHaveClass('own:active:translate-(--ui--press-shift)')
    // Filled buttons take an ink edge only when the theme inks its lines.
    expect(screen.getByRole('button', { name: 'Deploy' })).toHaveClass('own:border-(--ui--fill-edge)')
    expect(screen.getByRole('button', { name: 'Deploy' })).not.toHaveClass('own:border-transparent')
  })

  test('every size reads as the same push: icons press deeper, wide buttons shallower', () => {
    render(
      <>
        <Button size="icon" aria-label="Close" />
        <Button>Save</Button>
        <Button className="w-full">Continue</Button>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('[--ui--press-depth:0.04]')
    const width = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.textContent === 'Continue' ? 320 : 72
    })
    for (const name of ['Save', 'Continue']) fireEvent.pointerDown(screen.getByRole('button', { name }))
    expect(screen.getByRole('button', { name: 'Save' })).not.toHaveAttribute('data-wide')
    expect(screen.getByRole('button', { name: 'Continue' })).toHaveAttribute('data-wide')
    expect(screen.getByRole('button', { name: 'Continue' })).toHaveClass('data-wide:[--ui--press-depth:0.015]')
    width.mockRestore()
  })

  test('a trigger that anchors a popup is exempt from the press, so the popup never opens off by a pixel', () => {
    render(<Button aria-haspopup="menu">Options</Button>)
    const anchor = '[&:is([aria-haspopup]:not([aria-haspopup=false]),[role=combobox],[data-popup-open])]'
    expect(screen.getByRole('button', { name: 'Options' })).toHaveClass(`${anchor}:[--ui--press-depth:0]`, `${anchor}:[--ui--press-shift:0px]`)
  })

  test('the primary action fills with the theme’s action colour (the accent, or ink), not the accent of the "on" states', () => {
    render(
      <>
        <Button>Deploy</Button>
        <Button variant="danger">Delete</Button>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Deploy' })).toHaveClass('own:bg-action', 'own:text-on-action', 'own:yj-solid-hover')
    expect(screen.getByRole('button', { name: 'Deploy' })).not.toHaveClass('bg-accent')
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('own:bg-danger')
  })

  test('exposes its variant and size for styling hooks', () => {
    render(
      <Button variant="outline" size="sm">
        Export
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Export' })
    expect(button).toHaveAttribute('data-variant', 'outline')
    expect(button).toHaveAttribute('data-size', 'sm')
  })

  describe('render', () => {
    // A router link: a component that takes href (or to) and renders an anchor.
    function RouterLink({ to, ...props }: ComponentProps<'a'> & { to: string }) {
      return <a href={to} {...props} />
    }

    test('a link stays a link, without the nativeButton error', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      render(
        <>
          <Button render={<a href="/deployments" />}>Deployments</Button>
          <Button variant="outline" render={<RouterLink to="/settings" />}>
            Settings
          </Button>
        </>,
      )
      const anchor = screen.getByRole('link', { name: 'Deployments' })
      expect(anchor.tagName).toBe('A')
      expect(anchor).toHaveAttribute('href', '/deployments')
      expect(anchor).not.toHaveAttribute('type')
      expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('data-variant', 'outline')
      expect(screen.queryByRole('button')).toBeNull()
      expect(error).not.toHaveBeenCalled()
      error.mockRestore()
    })

    test('another tag acts as a button; an explicit nativeButton wins', async () => {
      const user = userEvent.setup()
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      const onClick = vi.fn()
      render(
        <>
          <Button render={<span />} onClick={onClick}>
            Span
          </Button>
          <Button render={<button type="submit" />}>Native</Button>
        </>,
      )
      const span = screen.getByRole('button', { name: 'Span' })
      expect(span.tagName).toBe('SPAN')
      span.focus()
      await user.keyboard('{Enter}')
      expect(onClick).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('button', { name: 'Native' })).toHaveAttribute('type', 'submit')
      expect(error).not.toHaveBeenCalled()
      error.mockRestore()
    })
  })

  test('disabled blocks presses', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    )
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  describe('loading', () => {
    function Saver({ onSave }: { onSave: () => void }) {
      const [loading, setLoading] = useState(false)
      return (
        <Button
          loading={loading}
          loadingLabel="Saving"
          onClick={() => {
            onSave()
            setLoading(true)
          }}
        >
          Save
        </Button>
      )
    }

    test('goes busy without dropping focus, blocks further presses and announces', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      render(<Saver onSave={onSave} />)
      const button = screen.getByRole('button', { name: /Save/ })
      const status = screen.getByRole('status')
      expect(status).toBeEmptyDOMElement()

      await user.click(button)
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toHaveAttribute('aria-disabled', 'true')
      // Not natively disabled: a disabled button would drop keyboard focus onto <body>.
      expect(button).not.toBeDisabled()
      expect(button).toHaveFocus()
      expect(status).toHaveTextContent('Saving')

      await user.click(button)
      await user.keyboard('{Enter}')
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    test('keeps the label in place (hidden) so the width does not change', () => {
      render(
        <Button loading loadingLabel="Deploying">
          Deploy
        </Button>,
      )
      const button = screen.getByRole('button')
      expect(button.querySelector('[data-slot=button-label]')).toHaveTextContent('Deploy')
      expect(button).toHaveAttribute('data-loading')
      expect(button.querySelector('[data-slot=spinner]')).toBeInTheDocument()
    })

    test('an explicit disabled={false} cannot undo the loading block', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      render(
        <Button loading disabled={false} onClick={onClick}>
          Deploy
        </Button>,
      )
      await user.click(screen.getByRole('button'))
      expect(onClick).not.toHaveBeenCalled()
    })

    test('a button that never loads renders no live region', () => {
      render(<Button>Plain</Button>)
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  describe('async click handlers', () => {
    function deferred() {
      let resolve!: () => void
      let reject!: (error: Error) => void
      const promise = new Promise<void>((res, rej) => {
        resolve = res
        reject = rej
      })
      return { promise, resolve, reject }
    }

    test('a promise returned from onClick keeps the button busy and disabled until it resolves', async () => {
      const user = userEvent.setup()
      const work = deferred()
      const onClick = vi.fn(() => work.promise)
      render(<Button onClick={onClick}>Save</Button>)
      const button = screen.getByRole('button')
      expect(button).not.toHaveAttribute('aria-busy')
      await user.click(button)
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toHaveAttribute('aria-disabled', 'true')
      await user.click(button)
      expect(onClick).toHaveBeenCalledTimes(1)
      await act(async () => work.resolve())
      expect(button).not.toHaveAttribute('aria-busy')
      expect(button).not.toHaveAttribute('aria-disabled')
    })

    test('a rejected promise ends the busy state and still surfaces as an unhandled rejection', async () => {
      const user = userEvent.setup()
      const work = deferred()
      const seen: unknown[] = []
      const listeners = process.listeners('unhandledRejection')
      process.removeAllListeners('unhandledRejection')
      process.on('unhandledRejection', (error) => seen.push(error))
      try {
        render(<Button onClick={() => work.promise}>Save</Button>)
        const button = screen.getByRole('button')
        await user.click(button)
        expect(button).toHaveAttribute('aria-busy', 'true')
        const error = new Error('save failed')
        await act(async () => work.reject(error))
        await vi.waitFor(() => expect(seen).toEqual([error]))
        expect(button).not.toHaveAttribute('aria-busy')
      } finally {
        process.removeAllListeners('unhandledRejection')
        for (const listener of listeners) process.on('unhandledRejection', listener)
      }
    })

    test('a handler that returns nothing never makes the button busy', async () => {
      const user = userEvent.setup()
      render(<Button onClick={() => {}}>Save</Button>)
      const button = screen.getByRole('button')
      await user.click(button)
      expect(button).not.toHaveAttribute('aria-busy')
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    test('an explicit loading prop wins over the promise, either way', async () => {
      const user = userEvent.setup()
      const work = deferred()
      const { rerender } = render(
        <Button loading={false} onClick={() => work.promise}>
          Save
        </Button>,
      )
      const button = screen.getByRole('button')
      await user.click(button)
      expect(button).not.toHaveAttribute('aria-busy')
      await act(async () => work.resolve())

      const next = deferred()
      rerender(
        <Button loading onClick={() => next.promise}>
          Save
        </Button>,
      )
      expect(button).toHaveAttribute('aria-busy', 'true')
      await act(async () => next.resolve())
      expect(button).toHaveAttribute('aria-busy', 'true')
    })
  })

  test('marks itself for reduced motion so CSS drops the press scale', () => {
    const { rerender } = render(
      <YoujProvider reducedMotion="always">
        <Button>Go</Button>
      </YoujProvider>,
    )
    expect(screen.getByRole('button')).toHaveAttribute('data-reduced-motion')
    rerender(
      <YoujProvider reducedMotion="never">
        <Button>Go</Button>
      </YoujProvider>,
    )
    expect(screen.getByRole('button')).not.toHaveAttribute('data-reduced-motion')
  })
})
