import { useState } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import { CopyButton } from './copy-button'
import { Segmented, Switch, TabList } from './controls'

function mockClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
}

describe('CopyButton', () => {
  afterEach(() => vi.useRealTimers())

  it('copies its value, confirms, then resets', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    mockClipboard(writeText)
    render(<CopyButton value="pnpm add @youj/motion" label="Copy command" />)

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy command' })))
    expect(writeText).toHaveBeenCalledWith('pnpm add @youj/motion')
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
    expect(screen.getByText('Copied to clipboard')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(5000))
    expect(screen.getByRole('button', { name: 'Copy command' })).toBeInTheDocument()
  })

  it('copies the nearest code block when it has no value', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    mockClipboard(writeText)
    render(
      <figure data-copy-root>
        <CopyButton />
        <pre>const k = useYouj()</pre>
      </figure>,
    )
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy' })))
    expect(writeText).toHaveBeenCalledWith('const k = useYouj()')
  })

  it('claims nothing when the clipboard refuses', async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error('denied')))
    render(<CopyButton value="x" label="Copy command" />)
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy command' })))
    expect(screen.queryByRole('button', { name: 'Copied' })).not.toBeInTheDocument()
  })

  it('clears its reset timer on unmount', async () => {
    mockClipboard(vi.fn().mockResolvedValue(undefined))
    const clear = vi.spyOn(globalThis, 'clearTimeout')
    const { unmount } = render(<CopyButton value="x" />)
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy' })))
    clear.mockClear()
    unmount()
    expect(clear).toHaveBeenCalled()
  })
})

function Speed({ onChange }: { onChange?: (value: string, segment: HTMLElement | null) => void }) {
  const [value, setValue] = useState<'a' | 'b' | 'c'>('a')
  return (
    <Segmented
      label="Speed"
      value={value}
      onChange={(next, segment) => {
        setValue(next)
        onChange?.(next, segment)
      }}
      options={[
        { value: 'a', label: 'Assembled' },
        { value: 'b', label: 'B', title: 'Second' },
        { value: 'c', label: 'C' },
      ]}
    />
  )
}

const pressed = (group: HTMLElement) => within(group).getAllByRole('button').find((b) => b.getAttribute('aria-pressed') === 'true')

describe('Segmented', () => {
  it('is one tab stop: arrows, Home and End rove, wrapping at the ends, and Space or Enter chooses', async () => {
    const user = userEvent.setup()
    render(<Speed />)
    const group = screen.getByRole('group', { name: 'Speed' })
    const [a, b, c] = within(group).getAllByRole('button')
    expect(pressed(group)).toBe(a)

    await user.tab()
    expect(a).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(b).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(pressed(group)).toBe(b)
    await user.keyboard('{End}')
    expect(c).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(a).toHaveFocus()
    await user.keyboard(' ')
    expect(pressed(group)).toBe(a)
  })

  it('always has a choice: pressing the chosen segment keeps it', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Speed onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Assembled' }))
    expect(pressed(screen.getByRole('group'))).toHaveTextContent('Assembled')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('names a terse option by its title, and reports the pressed segment (where a theme change grows from)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Speed onChange={onChange} />)
    const second = screen.getByRole('button', { name: 'Second' })
    await user.click(second)
    expect(onChange).toHaveBeenCalledWith('b', second)
  })

  it('keeps every label whole: each segment sizes to its label and only truncates it, never its padding', () => {
    render(<Speed />)
    for (const segment of within(screen.getByRole('group')).getAllByRole('button')) {
      expect(segment).toHaveClass('flex-auto', 'min-w-0', 'px-3')
      expect(segment.firstElementChild).toHaveClass('min-w-0', 'truncate')
    }
  })

  it('holds 32px (44px on touch) even in a compact preset', () => {
    render(<Speed />)
    expect(screen.getByRole('group').className).toContain('[--spacing-control:max(calc(2rem_+_max(0rem,var(--yj-density)*0.25rem)_+_var(--yj-touch)*0.5rem),calc(var(--yj-touch)*2.75rem))]')
  })

  it('jumps instead of gliding under reduced motion', () => {
    render(
      <YoujProvider reducedMotion="always">
        <Speed />
      </YoujProvider>,
    )
    for (const segment of within(screen.getByRole('group')).getAllByRole('button')) expect(segment).toHaveAttribute('data-reduced-motion')
  })
})

describe('TabList', () => {
  function Views() {
    const [tab, setTab] = useState<'preview' | 'code'>('preview')
    return (
      <>
        <TabList
          idBase="demo"
          label="Example"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'preview', label: 'Preview' },
            { value: 'code', label: 'Code' },
          ]}
        />
        <div role="tabpanel" id="demo-panel-preview" aria-labelledby="demo-tab-preview" hidden={tab !== 'preview'}>
          Stage
        </div>
        <div role="tabpanel" id="demo-panel-code" aria-labelledby="demo-tab-code" hidden={tab !== 'code'}>
          Source
        </div>
      </>
    )
  }

  it('wires each tab to the host’s panel by id', () => {
    render(<Views />)
    const preview = screen.getByRole('tab', { name: 'Preview' })
    expect(preview).toHaveAttribute('id', 'demo-tab-preview')
    expect(preview).toHaveAttribute('aria-controls', 'demo-panel-preview')
    expect(preview).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Preview' })).toHaveTextContent('Stage')
  })

  it('selects with the arrow keys, wrapping, as focus moves', async () => {
    const user = userEvent.setup()
    render(<Views />)
    await user.tab()
    expect(screen.getByRole('tab', { name: 'Preview' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Code' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Source')
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Preview' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Stage')
  })

  it('stands on its own as a pill track the tabs share, each taking in the track’s padding', () => {
    render(
      <TabList
        idBase="steps"
        label="Steps"
        value="frame"
        onChange={() => {}}
        variant="pill"
        fill
        tabs={[
          { value: 'frame', label: 'Frame' },
          { value: 'theme', label: 'Theme' },
        ]}
      />,
    )
    const list = screen.getByRole('tablist', { name: 'Steps' })
    expect(list).toHaveAttribute('data-variant', 'pill')
    expect(list).toHaveClass('w-full')
    for (const tab of screen.getAllByRole('tab')) expect(tab).toHaveClass('flex-1', 'after:absolute', 'after:-inset-0.5')
  })

  it('leaves the hairline to the host, and runs its bar along it', () => {
    render(<Views />)
    const list = screen.getByRole('tablist', { name: 'Example' })
    expect(list.querySelector('[data-slot=tabs-indicator]')).toHaveAttribute('data-yj-indicator', 'underline')
  })
})

describe('Switch', () => {
  function Harness() {
    const [on, setOn] = useState(false)
    return <Switch checked={on} onCheckedChange={setOn} label="Reduced motion" />
  }

  it('is named by its label, and toggles from the switch or the label, once per press', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const toggle = screen.getByRole('switch', { name: 'Reduced motion' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByText('Reduced motion'))
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('toggles from the keyboard', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.tab()
    expect(screen.getByRole('switch')).toHaveFocus()
    await user.keyboard(' ')
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })
})
