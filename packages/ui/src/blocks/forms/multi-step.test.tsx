import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { MultiStepForm, type ApplicationValues } from './multi-step'

const NOW = new Date(2026, 9, 10)
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const steps = () => [...document.querySelectorAll('[data-slot=wizard] ol > li')].length
const stepTitle = () => document.querySelector('[data-slot=wizard-step] [tabindex="-1"]')?.textContent
const next = () => screen.getByRole('button', { name: 'Continue' })
/** The Wizard's last button: Send (whose label changes while it reports). */
const finish = () => within(document.querySelector<HTMLElement>('[data-slot=wizard-footer]')!).getAllByRole('button').at(-1)!
const quick = async () => {}

/** Fills the first step as a business of `type`. */
async function business(user: ReturnType<typeof userEvent.setup>, type: RegExp) {
  await user.click(screen.getByRole('radio', { name: type }))
  await user.type(screen.getByRole('textbox', { name: 'Business name' }), 'Northwind Studio')
  await user.click(screen.getByRole('combobox', { name: 'What it does' }))
  await user.click(await screen.findByRole('option', { name: 'Software and online services' }))
}

describe('Application block', () => {
  test('opens on the business, with a company’s path in the Stepper until the type says otherwise', () => {
    reduced(<MultiStepForm now={NOW} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Open a business account' })).toBeInTheDocument()
    expect(stepTitle()).toBe('Business')
    expect(steps()).toBe(5)
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull()
  })

  test('Continue with something missing gathers the problems at the top, focused, each linking to its field; fixing one takes it off', async () => {
    const user = userEvent.setup()
    reduced(<MultiStepForm now={NOW} />)
    await user.click(next())
    const summary = await screen.findByText('There’s a problem')
    const box = summary.closest<HTMLElement>('[data-slot=error-summary]')!
    await waitFor(() => expect(box).toHaveFocus())
    const links = within(box).getAllByRole('link').map((a) => a.textContent)
    expect(links).toEqual(['Choose the type of business.', 'Enter the business’s name.', 'Choose what the business does.'])
    // The same words under the fields.
    expect(screen.getAllByText('Enter the business’s name.')).toHaveLength(2)
    await user.click(within(box).getByRole('link', { name: 'Enter the business’s name.' }))
    expect(screen.getByRole('textbox', { name: 'Business name' })).toHaveFocus()
    await user.keyboard('Northwind Studio')
    await waitFor(() => expect(within(box).getAllByRole('link')).toHaveLength(2))
    expect(stepTitle()).toBe('Business')
  })

  test('a sole trader’s path asks about them instead, and the Stepper follows', async () => {
    const user = userEvent.setup()
    reduced(<MultiStepForm now={NOW} />)
    await business(user, /Sole trader/)
    expect(steps()).toBe(4)
    await user.click(next())
    await waitFor(() => expect(stepTitle()).toBe('About you'))
  })

  test('the date of birth is checked as one date, in words that say what to fix', async () => {
    const user = userEvent.setup()
    reduced(<MultiStepForm now={NOW} defaultValue={{ type: 'sole', name: 'Fernhill', industry: 'food' }} />)
    expect(stepTitle()).toBe('About you')
    await user.type(screen.getByRole('textbox', { name: 'Your full name' }), 'Jo Marsh')
    await user.type(screen.getByRole('textbox', { name: 'Day' }), '31')
    await user.type(screen.getByRole('textbox', { name: 'Month' }), '2')
    await user.click(next())
    expect(await screen.findAllByText('Date of birth must include a year.')).not.toHaveLength(0)
    await user.type(screen.getByRole('textbox', { name: 'Year' }), '1990')
    await user.click(next())
    expect(await screen.findAllByText('Date of birth must be a real date.')).not.toHaveLength(0)
    await user.clear(screen.getByRole('textbox', { name: 'Day' }))
    await user.type(screen.getByRole('textbox', { name: 'Day' }), '28')
    await user.clear(screen.getByRole('textbox', { name: 'Year' }))
    await user.type(screen.getByRole('textbox', { name: 'Year' }), '2012')
    await user.click(next())
    expect(await screen.findAllByText('You must be 18 or over to open an account.')).not.toHaveLength(0)
  })

  test('people are added and removed as cards; owners need a share, and shares can’t pass 100%', async () => {
    const user = userEvent.setup()
    reduced(<MultiStepForm now={NOW} defaultValue={{ type: 'company', name: 'Northwind Studio Ltd', industry: 'software', registration: '09446231' }} />)
    expect(stepTitle()).toBe('People')
    await user.type(screen.getByRole('textbox', { name: 'Full name' }), 'Ada Lovelace')
    await user.click(screen.getByRole('combobox', { name: 'Role' }))
    await user.click(await screen.findByRole('option', { name: 'Director and owner' }))
    await user.type(screen.getByRole('textbox', { name: 'Share' }), '70')
    await user.click(screen.getByRole('button', { name: 'Add a person' }))
    const names = await screen.findAllByRole('textbox', { name: 'Full name' })
    expect(names).toHaveLength(2)
    await waitFor(() => expect(names[1]).toHaveFocus())
    await user.type(names[1]!, 'Charles Babbage')
    await user.click(screen.getAllByRole('combobox', { name: 'Role' })[1]!)
    await user.click(await screen.findByRole('option', { name: 'Owner' }))
    await user.type(screen.getAllByRole('textbox', { name: 'Share' })[1]!, '40')
    expect(screen.getByText('110% of the business')).toBeInTheDocument()
    await user.click(next())
    expect(await screen.findAllByText('Shares add up to 110%. They can’t be more than 100%.')).not.toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Remove Charles Babbage' }))
    await waitFor(() => expect(screen.getAllByRole('textbox', { name: 'Full name' })).toHaveLength(1))
    expect(screen.getByText('70% of the business')).toBeInTheDocument()
    await user.click(next())
    await waitFor(() => expect(stepTitle()).toBe('Documents'))
  })

  test('Enter in a field goes on, as Continue does', async () => {
    const user = userEvent.setup()
    reduced(<MultiStepForm now={NOW} defaultValue={{ type: 'company', name: 'Northwind Studio Ltd', industry: 'software' }} />)
    expect(stepTitle()).toBe('Company')
    await user.type(screen.getByRole('textbox', { name: 'Company number' }), '09446231{Enter}')
    await waitFor(() => expect(stepTitle()).toBe('People'))
  })

  test('the review lists every step with a Change that comes back to it; the declaration has to be ticked; the application and its documents are sent', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(async (_application: unknown) => 'NW-1')
    reduced(
      <MultiStepForm now={NOW} onUpload={quick} onSubmit={onSubmit} defaultValue={{ type: 'sole', name: 'Fernhill Coffee', industry: 'food', you: { name: 'Jo Marsh', day: '4', month: '7', year: '1988' } }} />,
    )
    expect(stepTitle()).toBe('Documents')
    const file = new File(['id'], 'passport.pdf', { type: 'application/pdf' })
    await user.upload(document.querySelector<HTMLInputElement>('input[type=file]')!, file)
    await waitFor(() => expect(screen.getByText('passport.pdf')).toBeInTheDocument())
    await user.click(next())
    await waitFor(() => expect(stepTitle()).toBe('Review'))
    expect(screen.getByText('Jo Marsh')).toBeInTheDocument()
    expect(screen.getByText('4 7 1988')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Change business' }))
    await waitFor(() => expect(stepTitle()).toBe('Business'))
    const name = screen.getByRole('textbox', { name: 'Business name' })
    await user.clear(name)
    await user.type(name, 'Fernhill Roasters')
    await user.click(next())
    await waitFor(() => expect(stepTitle()).toBe('Review'))
    expect(screen.getByText('Fernhill Roasters')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Send application' }))
    expect(await screen.findAllByText('Confirm the information is true to send it.')).not.toHaveLength(0)
    await user.click(screen.getByRole('checkbox'))
    await user.click(finish())
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const sent = onSubmit.mock.calls[0]![0] as { values: ApplicationValues; documents: File[] }
    expect(sent.values).toMatchObject({ type: 'sole', name: 'Fernhill Roasters', declaration: true })
    expect(sent.documents.map((f) => f.name)).toEqual(['passport.pdf'])
    expect(await screen.findByRole('heading', { level: 3, name: 'Application received' })).toBeInTheDocument()
    expect(screen.getByText('Your reference is NW-1.')).toBeInTheDocument()
  })

  test('Save and finish later hands over the answers and the step, and says when', async () => {
    const user = userEvent.setup()
    const onSaveDraft = vi.fn()
    reduced(<MultiStepForm now={NOW} onSaveDraft={onSaveDraft} />)
    await user.type(screen.getByRole('textbox', { name: 'Business name' }), 'Northwind')
    await user.click(screen.getByRole('button', { name: 'Save and finish later' }))
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalledWith(expect.objectContaining({ name: 'Northwind' }), 'business'))
    expect(await screen.findAllByText(/^Saved at /)).not.toHaveLength(0)
  })

  test('a failed send keeps everything and says why', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('Applications are paused for an hour.'))
    reduced(<MultiStepForm now={NOW} onUpload={quick} onSubmit={onSubmit} defaultValue={{ type: 'nonprofit', name: 'Code Club', industry: 'other', registration: '1129338' }} />)
    await user.upload(document.querySelector<HTMLInputElement>('input[type=file]')!, new File(['c'], 'charter.pdf', { type: 'application/pdf' }))
    await waitFor(() => expect(screen.getByText('charter.pdf')).toBeInTheDocument())
    await user.click(next())
    await waitFor(() => expect(stepTitle()).toBe('Review'))
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Send application' }))
    expect(await screen.findByText('Applications are paused for an hour.')).toBeInTheDocument()
    expect(screen.getByText('Code Club')).toBeInTheDocument()
  })

  test('your lists and copy replace the demo, and every answer is reported', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(
      <MultiStepForm
        now={NOW}
        onValueChange={onValueChange}
        industries={[{ value: 'food', label: 'Food and drink' }]}
        copy={{ title: 'Become a stockist', next: 'Next step' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Become a stockist' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next step' })).toBeInTheDocument()
    await user.click(screen.getByRole('combobox', { name: 'What it does' }))
    expect(await screen.findAllByRole('option')).toHaveLength(1)
    await user.click(screen.getByRole('option', { name: 'Food and drink' }))
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(expect.objectContaining({ industry: 'food' })))
  })

  test('a scholarship’s steps, lists and roles come from props: references carry no share, and the student type sets the path', async () => {
    const user = userEvent.setup()
    reduced(
      <MultiStepForm
        now={NOW}
        types={[{ value: 'company', label: 'Undergraduate' }]}
        roles={[{ value: 'teacher', label: 'Teacher' }]}
        defaultValue={{ type: 'company', name: 'Maya Okafor', industry: 'other', registration: '20418835' }}
        copy={{
          steps: { business: 'Applicant', company: 'School', people: 'References', you: 'About you', documents: 'Documents', review: 'Review' },
          person: (index: number) => `Reference ${index}`,
          addPerson: 'Add a reference',
          role: 'How they know you',
        }}
      />,
    )
    expect(stepTitle()).toBe('References')
    expect(screen.getByText('Reference 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add a reference' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Share' })).toBeNull()
    expect(screen.queryByText(/of the business/)).toBeNull()
    await user.click(screen.getByRole('combobox', { name: 'How they know you' }))
    expect(await screen.findAllByRole('option')).toHaveLength(1)
    await user.click(screen.getByRole('option', { name: 'Teacher' }))
    await user.type(screen.getByRole('textbox', { name: 'Full name' }), 'Dana Ruiz')
    await user.click(next())
    await waitFor(() => expect(stepTitle()).toBe('Documents'))
  })

  test('the youngest age that may apply is a prop', async () => {
    const user = userEvent.setup()
    reduced(<MultiStepForm now={NOW} minAge={16} defaultValue={{ type: 'sole', name: 'Fernhill', industry: 'food', you: { name: 'Jo Marsh', day: '4', month: '7', year: '2009' } }} />)
    await user.click(next())
    await waitFor(() => expect(stepTitle()).toBe('Documents'))
  })

  test('the country starts on the first of your countries', () => {
    reduced(<MultiStepForm now={NOW} countries={[{ value: 'US', label: 'United States' }, { value: 'CA', label: 'Canada' }]} />)
    expect(screen.getByRole('combobox', { name: 'Country of registration' })).toHaveTextContent('United States')
  })
})
