import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SurveyForm, type Survey } from './form'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const SHORT: Survey = {
  title: 'Tell us about your team',
  questions: [
    {
      id: 'size',
      type: 'choice',
      title: 'How many people will use it?',
      options: [
        { value: 'small', label: 'Up to 10' },
        { value: 'large', label: 'More than 50' },
      ],
    },
    { id: 'sso', type: 'yesno', title: 'Do you sign in with SSO?', showIf: { conditions: [{ question: 'size', op: 'is', value: 'large' }] } },
    { id: 'note', type: 'text', required: false, title: 'Anything else?' },
  ],
}

describe('Single-page survey', () => {
  beforeAll(() => {
    Element.prototype.scrollTo ??= () => {}
  })

  test('asks every question on this path at once, numbered, and counts what’s answered', () => {
    reduced(<SurveyForm survey={SHORT} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Tell us about your team' })).toBeInTheDocument()
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(titles).toEqual(['1How many people will use it?', '2Anything else?'])
    expect(screen.getByText('0 of 2 answered')).toBeInTheDocument()
  })

  test('an answer reveals the question its logic waits on, renumbering the rest', async () => {
    const user = userEvent.setup()
    reduced(<SurveyForm survey={SHORT} />)
    await user.click(screen.getByRole('radio', { name: 'More than 50' }))
    await waitFor(() =>
      expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
        '1How many people will use it?',
        '2Do you sign in with SSO?',
        '3Anything else?',
      ]),
    )
    expect(screen.getByText('1 of 3 answered')).toBeInTheDocument()
  })

  test('Send lists every problem in a summary that takes focus and links to each question', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    reduced(<SurveyForm survey={SHORT} defaultValue={{ size: 'large' }} onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: 'Send answers' }))
    const summary = await screen.findByRole('region', { name: 'There’s a problem with your answers' })
    await waitFor(() => expect(summary).toHaveFocus())
    expect(within(summary).getByRole('link', { name: 'Question 2: Choose an answer.' })).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
    await user.click(within(summary).getByRole('link', { name: 'Question 2: Choose an answer.' }))
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Yes' })).toHaveFocus())
    // Answering clears it, and the summary goes with its last problem.
    await user.click(screen.getByRole('radio', { name: 'No' }))
    expect(screen.queryByRole('region', { name: 'There’s a problem with your answers' })).toBeNull()
  })

  test('sends the answers to the questions that were asked, then thanks', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onValueChange = vi.fn()
    reduced(
      <SurveyForm
        survey={SHORT}
        defaultValue={{ size: 'large', sso: true }}
        onSubmit={onSubmit}
        onValueChange={onValueChange}
        copy={{ send: 'Set up my workspace' }}
      />,
    )
    await user.click(screen.getByRole('radio', { name: 'Up to 10' }))
    expect(onValueChange).toHaveBeenLastCalledWith({ size: 'small', sso: true })
    await user.click(screen.getByRole('button', { name: 'Set up my workspace' }))
    // SSO isn't asked for a small team any more, so its stale answer stays home.
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ size: 'small' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Thank you' })).toBeInTheDocument()
  })

  test('Enter in a question moves on to the next one', async () => {
    const user = userEvent.setup()
    reduced(<SurveyForm survey={SHORT} defaultValue={{ size: 'small' }} />)
    screen.getByRole('radio', { name: 'Up to 10' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('textbox', { name: 'Anything else?' })).toHaveFocus()
  })

  test('embedded, it is a panel in your page: an h2, each question an h3', () => {
    reduced(<SurveyForm survey={SHORT} embedded />)
    expect(screen.queryByRole('main')).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'Tell us about your team' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2)
  })
})
