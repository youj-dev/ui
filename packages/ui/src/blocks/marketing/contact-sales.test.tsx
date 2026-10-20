import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { ContactSales, type ContactSalesRegion, type ContactSalesSlot } from './contact-sales'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const TITLE = 'Tell us what you’re building'
const submit = () => document.querySelector<HTMLButtonElement>('button[type="submit"]')!
const day = (name: RegExp) => within(screen.getByRole('group', { name: 'Day' })).getByRole('button', { name })
const times = () => screen.getByRole('group', { name: /^Times on/ })

async function toDetails(user: ReturnType<typeof userEvent.setup>, time = '11:00 AM') {
  await user.click(within(times()).getByRole('button', { name: time }))
  await user.click(screen.getByRole('button', { name: /^Continue with/ }))
  await screen.findByRole('heading', { name: 'Your details' })
}

async function fill(user: ReturnType<typeof userEvent.setup>, who = { name: 'Ada Lovelace', email: 'ada@analytical.dev', company: 'Analytical Engines' }) {
  await user.type(screen.getByLabelText('Your name'), who.name)
  await user.type(screen.getByLabelText('Work email'), who.email)
  await user.type(screen.getByLabelText('Company'), who.company)
}

describe('ContactSales', () => {
  test('a labelled section whose card asks for a time first: who answers, the days and that day’s times', () => {
    reduced(<ContactSales />)
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: TITLE })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Pick a time' })).toBeInTheDocument()
    expect(screen.getByText('You’ll meet Dana Whitfield')).toBeInTheDocument()
    expect(day(/^Tuesday, October 6, 5 times open/)).toHaveAttribute('aria-pressed', 'true')
    expect(times()).toHaveAccessibleName('Times on Tuesday, October 6')
    // A taken time is said as taken and can't be picked.
    expect(within(times()).getByRole('button', { name: '10:00 AM, taken' })).toBeDisabled()
    expect(screen.queryByLabelText('Your name')).not.toBeInTheDocument()
  })

  test('Continue without a time says so and puts focus on the first open time', async () => {
    const user = userEvent.setup()
    reduced(<ContactSales />)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a time for the call, or send a message instead.')
    expect(within(times()).getByRole('button', { name: '9:00 AM' })).toHaveFocus()
    expect(screen.queryByRole('heading', { name: 'Your details' })).not.toBeInTheDocument()
  })

  test('another day shows its times; a time is named on Continue, and the details step pins it on top', async () => {
    const user = userEvent.setup()
    const onSlotChange = vi.fn()
    reduced(<ContactSales onSlotChange={onSlotChange} />)
    await user.click(day(/^Thursday, October 8/))
    expect(times()).toHaveAccessibleName('Times on Thursday, October 8')
    await user.click(within(times()).getByRole('button', { name: '2:00 PM' }))
    expect(onSlotChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'americas-2-14', region: 'americas' }))
    await user.click(screen.getByRole('button', { name: 'Continue with Thu, Oct 8, 2:00 PM' }))
    const heading = await screen.findByRole('heading', { level: 3, name: 'Your details' })
    await waitFor(() => expect(heading).toHaveFocus())
    expect(screen.getByText('Thursday, Oct 8, 2:00 PM')).toBeInTheDocument()
    expect(screen.getByText('30 minutes with Dana Whitfield')).toBeInTheDocument()
    // Back keeps the time.
    await user.click(screen.getByRole('button', { name: 'Change time' }))
    expect(await screen.findByRole('heading', { name: 'Pick a time' })).toBeInTheDocument()
    expect(within(times()).getByRole('button', { name: '2:00 PM' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('the region decides who answers: choosing another swaps the person, clears the time and offers its times', async () => {
    const user = userEvent.setup()
    const onRegionChange = vi.fn()
    reduced(<ContactSales onRegionChange={onRegionChange} />)
    await user.click(within(times()).getByRole('button', { name: '9:00 AM' }))
    await user.click(screen.getByRole('combobox', { name: 'Where are you based?' }))
    await user.click(await screen.findByRole('option', { name: 'Europe and Africa' }))
    expect(onRegionChange).toHaveBeenCalledWith('emea')
    expect(screen.getByText('You’ll meet Ines Duarte')).toBeInTheDocument()
    expect(screen.getByText('Account executive, Dublin')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    expect(within(times()).getByRole('button', { name: '9:00 AM, taken' })).toBeDisabled()
  })

  test('an empty form says what is missing under each field and focuses the first', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    reduced(<ContactSales onSubmit={onSubmit} />)
    await toDetails(user)
    await user.click(submit())
    expect(await screen.findByText('Enter your name.')).toBeInTheDocument()
    expect(screen.getByText('Enter your work email.')).toBeInTheDocument()
    expect(screen.getByText('Enter your company.')).toBeInTheDocument()
    expect(screen.getByLabelText('Your name')).toHaveFocus()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('a malformed or personal email is explained, and fixing a field clears its message', async () => {
    const user = userEvent.setup()
    reduced(<ContactSales />)
    await toDetails(user)
    await fill(user, { name: 'Ada', email: 'not-an-email', company: 'AE' })
    await user.click(submit())
    expect(await screen.findByText(/That doesn’t look like an email/)).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Work email'))
    expect(screen.queryByText(/That doesn’t look like an email/)).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Work email'), 'ada@gmail.com')
    await user.click(submit())
    expect(await screen.findByText('Use your work email, so we can find your team.')).toBeInTheDocument()
  })

  test('personal addresses are accepted when requireWorkEmail is off', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(() => Promise.resolve())
    reduced(<ContactSales requireWorkEmail={false} onSubmit={onSubmit} />)
    await toDetails(user)
    await fill(user, { name: 'Ada', email: 'ada@gmail.com', company: 'AE' })
    await user.click(submit())
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1), { timeout: 3000 })
  })

  test('booking sends the values with the chosen slot, confirms with the time in full, and Start over begins again', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(() => Promise.resolve())
    reduced(<ContactSales onSubmit={onSubmit} />)
    await toDetails(user)
    await fill(user)
    await user.selectOptions(screen.getByLabelText('Company size'), '51–200')
    await user.selectOptions(screen.getByLabelText('What’s it about?'), 'A security review')
    await user.click(submit())
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1), { timeout: 3000 })
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'call', name: 'Ada Lovelace', email: 'ada@analytical.dev', company: 'Analytical Engines', region: 'americas', size: '51–200', topic: 'A security review', slot: expect.objectContaining({ id: 'americas-0-11' }) }),
    )
    const heading = await screen.findByRole('heading', { level: 3, name: /with Dana Whitfield/ }, { timeout: 3000 })
    expect(heading).toHaveTextContent('Tuesday, October 6 at 11:00 AM')
    expect(screen.getByText('Your call is booked')).toBeInTheDocument()
    expect(screen.getByText('A calendar invite is on its way to ada@analytical.dev.')).toBeInTheDocument()
    await waitFor(() => expect(heading).toHaveFocus())
    await user.click(screen.getByRole('button', { name: 'Start over' }))
    expect(await screen.findByRole('heading', { name: 'Pick a time' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  })

  test('writing instead needs no time: the message step sends with no slot, and a call is one link back', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(() => Promise.resolve())
    const onModeChange = vi.fn()
    reduced(<ContactSales onSubmit={onSubmit} onModeChange={onModeChange} />)
    await user.click(screen.getByRole('button', { name: 'Rather write? Send a message' }))
    expect(onModeChange).toHaveBeenCalledWith('message')
    expect(await screen.findByRole('heading', { name: 'Send a message' })).toBeInTheDocument()
    expect(screen.getByText('Dana Whitfield will reply')).toBeInTheDocument()
    await fill(user)
    await user.type(screen.getByLabelText('Anything we should know?'), 'We are on a legacy host.')
    await user.click(submit())
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ mode: 'message', slot: null, message: 'We are on a legacy host.' })), { timeout: 3000 })
    expect(await screen.findByText('Message sent', undefined, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dana Whitfield will reply within one working day.' })).toBeInTheDocument()
  })

  test('the message step switches back to a call, keeping what was typed', async () => {
    const user = userEvent.setup()
    const onModeChange = vi.fn()
    reduced(<ContactSales defaultValues={{ mode: 'message' }} onModeChange={onModeChange} />)
    await user.type(screen.getByLabelText('Your name'), 'Ada')
    await user.click(screen.getByRole('button', { name: 'Rather talk? Book a call' }))
    expect(onModeChange).toHaveBeenCalledWith('call')
    await toDetails(user)
    expect(screen.getByLabelText('Your name')).toHaveValue('Ada')
  })

  test('a message over the limit is refused', async () => {
    const user = userEvent.setup()
    reduced(<ContactSales maxMessage={10} defaultValues={{ mode: 'message', name: 'Ada', email: 'ada@analytical.dev', company: 'AE', message: 'way too long a message' }} />)
    await user.click(submit())
    expect(await screen.findByText('Keep it under 10 characters.')).toBeInTheDocument()
  })

  test('a rejected send keeps everything typed and shows its message', async () => {
    const user = userEvent.setup()
    reduced(<ContactSales onSubmit={() => Promise.reject(new Error('Our CRM is down'))} />)
    await toDetails(user)
    await fill(user)
    await user.click(submit())
    expect(await screen.findByText('Our CRM is down', undefined, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByLabelText('Your name')).toHaveValue('Ada Lovelace')
    expect(screen.getByText('Tuesday, Oct 6, 11:00 AM')).toBeInTheDocument()
  })

  test('your regions and slots replace the demo; sizes and topics can be left out; copy rewrites the strings', async () => {
    const user = userEvent.setup()
    const regions: ContactSalesRegion[] = [{ id: 'uk', label: 'UK', contact: { name: 'Jo Marsh', role: 'Founder', location: 'Leeds' } }]
    const slots: ContactSalesSlot[] = [{ id: 'one', start: new Date(2026, 10, 3, 15, 0), region: 'uk' }]
    reduced(<ContactSales regions={regions} slots={slots} sizes={[]} topics={[]} copy={{ title: 'Talk to Jo', pickTitle: 'Pick a tasting' }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Talk to Jo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Pick a tasting' })).toBeInTheDocument()
    expect(screen.getByText('You’ll meet Jo Marsh')).toBeInTheDocument()
    // One region: no menu to choose it.
    expect(screen.queryByRole('combobox', { name: 'Where are you based?' })).not.toBeInTheDocument()
    expect(day(/^Tuesday, November 3, 1 time open/)).toBeInTheDocument()
    await toDetails(user, '3:00 PM')
    expect(screen.queryByLabelText('Company size')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('What’s it about?')).not.toBeInTheDocument()
  })

  test('a region with no times offers the message instead', async () => {
    const user = userEvent.setup()
    reduced(<ContactSales slots={[]} />)
    expect(screen.getByText('No open times for Americas this week.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Rather write? Send a message' }))
    expect(await screen.findByRole('heading', { name: 'Send a message' })).toBeInTheDocument()
  })

  test('the direct email and phone can be hidden', () => {
    const { unmount } = reduced(<ContactSales />)
    expect(screen.getByRole('link', { name: 'sales@northwind.dev' })).toHaveAttribute('href', 'mailto:sales@northwind.dev')
    expect(screen.getByRole('link', { name: '+1 (415) 555-0142' })).toHaveAttribute('href', 'tel:+14155550142')
    unmount()
    reduced(<ContactSales direct={false} />)
    expect(screen.queryByRole('link', { name: 'sales@northwind.dev' })).not.toBeInTheDocument()
  })

  test('headingLevel and rest props apply; embedded and a theme', () => {
    reduced(<ContactSales embedded theme={brutal} headingLevel={1} id="contact" />)
    const section = screen.getByRole('region', { name: TITLE })
    expect(section).toHaveAttribute('id', 'contact')
    expect(section.className).not.toMatch(/py-20/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: TITLE })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Pick a time' })).toBeInTheDocument()
  })
})
