import { useRef, useState } from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import { Tour, TourBeacon, type TourStep } from './tour'

const steps: TourStep[] = [
  { target: '#search', title: 'Search', body: 'Find any record.' },
  { target: '#filters', title: 'Filters', body: 'Narrow the list.' },
  { target: '#export', title: 'Export', body: 'Download as CSV.' },
]

function Page({ children, without }: { children: React.ReactNode; without?: string }) {
  return (
    <div>
      {['search', 'filters', 'export'].filter((id) => id !== without).map((id) => (
        <button key={id} id={id} type="button">
          {id}
        </button>
      ))}
      {children}
    </div>
  )
}

const card = () => screen.getByRole('dialog')
const flush = () => act(async () => {})

describe('Tour', () => {
  test('walks the steps with Next and Back, then Done completes and closes', async () => {
    const user = userEvent.setup()
    const onStepChange = vi.fn()
    const onComplete = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <Page>
        <Tour steps={steps} defaultOpen onStepChange={onStepChange} onComplete={onComplete} onOpenChange={onOpenChange} />
      </Page>,
    )
    await flush()
    expect(card()).toHaveAccessibleName('Search')
    expect(screen.getByText('1 of 3')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(onStepChange).toHaveBeenLastCalledWith(1)
    expect(card()).toHaveAccessibleName('Filters')
    expect(screen.getByText('2 of 3')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(onStepChange).toHaveBeenLastCalledWith(0)

    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  test('a step whose target is missing is skipped, forward and back', async () => {
    const user = userEvent.setup()
    render(
      <Page without="filters">
        <Tour steps={steps} defaultOpen />
      </Page>,
    )
    await flush()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(card()).toHaveAccessibleName('Export')
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(card()).toHaveAccessibleName('Search')
  })

  test('a tour with no target on the page closes without completing', async () => {
    const onComplete = vi.fn()
    const onOpenChange = vi.fn()
    render(<Tour steps={steps} defaultOpen onComplete={onComplete} onOpenChange={onOpenChange} />)
    await flush()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onComplete).not.toHaveBeenCalled()
  })

  test('Escape and Skip end the tour early with the step it was on', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    const { unmount } = render(
      <Page>
        <Tour steps={steps} defaultOpen defaultStep={1} onSkip={onSkip} />
      </Page>,
    )
    await flush()
    await user.keyboard('{Escape}')
    expect(onSkip).toHaveBeenLastCalledWith(1)
    unmount()

    render(
      <Page>
        <Tour steps={steps} defaultOpen onSkip={onSkip} />
      </Page>,
    )
    await flush()
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    expect(onSkip).toHaveBeenLastCalledWith(0)
  })

  test('without dismissible there is no Skip and Escape does nothing', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    render(
      <Page>
        <Tour steps={steps} defaultOpen dismissible={false} onSkip={onSkip} />
      </Page>,
    )
    await flush()
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull()
    await user.keyboard('{Escape}')
    expect(onSkip).not.toHaveBeenCalled()
    expect(card()).toBeInTheDocument()
  })

  test('focus moves into the card, and the arrow keys go Next and Back (mirrored in RTL)', async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <Page>
        <Tour steps={steps} defaultOpen />
      </Page>,
    )
    await flush()
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(card()).toHaveAccessibleName('Filters')
    await user.keyboard('{ArrowLeft}')
    expect(card()).toHaveAccessibleName('Search')
    unmount()

    render(
      <YoujProvider dir="rtl">
        <Page>
          <Tour steps={steps} defaultOpen />
        </Page>
      </YoujProvider>,
    )
    await flush()
    await user.keyboard('{ArrowLeft}')
    expect(card()).toHaveAccessibleName('Filters')
  })

  test('the spotlighted element is described by the step, and each new step is announced', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <Page>
        <button id="other" type="button" aria-describedby="other-hint">
          other
        </button>
        <span id="other-hint">hint</span>
        <Tour steps={[...steps, { target: '#other', title: 'Other', body: 'More.' }]} defaultOpen />
      </Page>,
    )
    await flush()
    expect(screen.getByRole('button', { name: 'search' })).toHaveAccessibleDescription(/Find any record\./)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await act(async () => vi.advanceTimersByTime(100))
    expect(screen.getByRole('status')).toHaveTextContent('Step 2 of 4: Filters')
    expect(screen.getByRole('button', { name: 'search' })).not.toHaveAttribute('aria-describedby')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('button', { name: 'other' }).getAttribute('aria-describedby')).toMatch(/^other-hint \S+/)
    vi.useRealTimers()
  })

  test('open and step can be controlled, and a ref target works', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const ref = useRef<HTMLButtonElement>(null)
      const [open, setOpen] = useState(false)
      const [step, setStep] = useState(0)
      return (
        <Page>
          <button ref={ref} type="button">
            by ref
          </button>
          <TourBeacon onClick={() => setOpen(true)} />
          <Tour
            steps={[{ target: ref, title: 'By ref' }, ...steps]}
            open={open}
            onOpenChange={setOpen}
            step={step}
            onStepChange={setStep}
          />
          <output>{`step ${step}`}</output>
        </Page>
      )
    }
    render(<Controlled />)
    expect(screen.queryByRole('dialog')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Start the tour' }))
    await flush()
    expect(card()).toHaveAccessibleName('By ref')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('step 1')).toBeInTheDocument()
    expect(card()).toHaveAccessibleName('Search')
  })

  test('the scrim cuts a hole around the target, padded and rounded', async () => {
    const { rerender } = render(<Page>{null}</Page>)
    const target = document.querySelector<HTMLElement>('#search')!
    target.style.borderTopLeftRadius = '6px'
    target.getBoundingClientRect = () => DOMRect.fromRect({ x: 20, y: 30, width: 100, height: 40 })
    rerender(
      <Page>
        <Tour steps={steps} defaultOpen spotlightPadding={4} />
      </Page>,
    )
    await flush()
    const scrim = document.querySelector<HTMLElement>('[data-slot="tour-scrim"]')!
    // The box is 108×48 at (16, 26), its corners the target's 6px plus the 4px padding.
    expect(scrim.style.clipPath).toContain('M26,26H114A10,10 0 0 1 124,36V64')
  })
})

describe('TourBeacon', () => {
  test('is a named button that can be renamed', () => {
    render(<TourBeacon label="What’s new in reports" />)
    expect(screen.getByRole('button', { name: 'What’s new in reports' })).toBeInTheDocument()
  })
})
