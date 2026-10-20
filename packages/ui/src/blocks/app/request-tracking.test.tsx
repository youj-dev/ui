import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { RequestTracking, type TrackingResult } from './request-tracking'
import { standing } from './request-tracking/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const RESULT: TrackingResult = {
  reference: 'INC-7',
  title: 'Webhook delays',
  status: 'Identified',
  tone: 'warning',
  eta: Date.UTC(2026, 9, 7, 16, 0),
  steps: [
    { title: 'Detected', at: Date.UTC(2026, 9, 7, 14, 0), state: 'done' },
    { title: 'Fixing', state: 'current' },
    { title: 'Replayed', state: 'upcoming' },
  ],
}

describe('RequestTracking', () => {
  test('the demo is an order being packed, beside a decorative packaging line', async () => {
    const { container } = reduced(<RequestTracking />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Track your order')
    expect(screen.getByRole('region', { name: 'Order ORD-48213' })).toBeInTheDocument()
    await waitFor(() => expect(container.querySelector('.yjm-packaging-line')).not.toBeNull())
    expect(container.querySelector('.yjm-packaging-line')!.closest('[aria-hidden]')).not.toBeNull()
  })

  test('media={null} shows no miniature', async () => {
    const { container } = reduced(<RequestTracking media={null} />)
    await act(async () => {})
    expect(container.querySelector('.yjm')).toBeNull()
  })

  test('the line follows the steps: half a step for the current one, stopped on a failure, done when all are', () => {
    expect(standing(null)).toEqual({ progress: undefined, done: false, stopped: false })
    expect(standing(RESULT)).toEqual({ progress: 0.5, done: false, stopped: false })
    expect(standing({ ...RESULT, steps: RESULT.steps.map((s) => ({ ...s, state: 'done' as const })) })).toEqual({
      progress: 1,
      done: true,
      stopped: false,
    })
    expect(standing({ ...RESULT, steps: [{ title: 'Paused', state: 'failed' }] }).stopped).toBe(true)
  })

  test('shows the request as an ordered list with the current step marked', () => {
    reduced(<RequestTracking media={null} result={RESULT} copy={{ title: 'Track your request', resultLabel: (r) => `Request ${r}` }} />)
    const main = screen.getByRole('main')
    expect(within(main).getByRole('heading', { level: 1 })).toHaveTextContent('Track your request')
    const region = within(main).getByRole('region', { name: 'Request INC-7' })
    expect(within(region).getByRole('heading', { level: 2 })).toHaveTextContent('Webhook delays')
    expect(within(region).getByText('Identified')).toBeInTheDocument()
    const steps = within(within(region).getByRole('list', { name: 'Progress' })).getAllByRole('listitem')
    expect(steps).toHaveLength(3)
    expect(steps[1]).toHaveAttribute('aria-current', 'step')
    expect(steps[0]).toHaveTextContent('Detected (Done)')
    expect(within(region).getByText(/Expected Oct 7, 4:00 PM UTC/)).toBeInTheDocument()
  })

  test('result null starts on the bare lookup', () => {
    reduced(<RequestTracking media={null} result={null} />)
    expect(screen.getByRole('textbox', { name: 'Order number' })).toHaveValue('')
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })

  test('tracking a reference calls onTrack, shows the result and announces it', async () => {
    const user = userEvent.setup()
    const onTrack = vi.fn().mockResolvedValue(RESULT)
    reduced(<RequestTracking media={null} result={null} onTrack={onTrack} />)
    await user.type(screen.getByRole('textbox', { name: 'Order number' }), ' INC-7 ')
    await user.click(screen.getByRole('button', { name: /Track/ }))
    expect(onTrack).toHaveBeenCalledWith('INC-7')
    expect(await screen.findByRole('region', { name: 'Order INC-7' })).toBeInTheDocument()
    expect(screen.getAllByRole('status').some((node) => node.textContent === 'Showing order INC-7.')).toBe(true)
  })

  test('an empty reference and a failed lookup show their messages', async () => {
    const user = userEvent.setup()
    const onTrack = vi.fn().mockRejectedValue(new Error('No such request.'))
    reduced(<RequestTracking media={null} result={null} onTrack={onTrack} />)
    await user.click(screen.getByRole('button', { name: /Track/ }))
    expect(await screen.findByText('Enter the order number from your email.')).toBeInTheDocument()
    expect(onTrack).not.toHaveBeenCalled()
    await user.type(screen.getByRole('textbox', { name: 'Order number' }), 'nope')
    await user.click(screen.getByRole('button', { name: /Try again|Track/ }))
    expect(await screen.findByText('No such request.')).toBeInTheDocument()
  })

  test('timeZone, headingLevel and copy', () => {
    reduced(
      <RequestTracking media={null} result={RESULT} timeZone="America/New_York" headingLevel={2} copy={{ title: 'Follow it', expected: 'Due' }} />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Follow it' })).toBeInTheDocument()
    expect(screen.getByText(/Due Oct 7, 12:00 PM EDT/)).toBeInTheDocument()
  })
})
