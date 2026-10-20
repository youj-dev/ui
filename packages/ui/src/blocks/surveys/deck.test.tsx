import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SurveyDeck, type Survey } from './deck'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const question = () => screen.getByRole('heading', { level: 2 })

const EVENT: Survey = {
  title: 'How was Fieldwork 2026?',
  description: 'Three questions while it’s fresh.',
  questions: [
    { id: 'overall', type: 'emoji', title: 'How was the day overall?' },
    {
      id: 'best',
      type: 'choice',
      title: 'Which session stayed with you?',
      options: [
        { value: 'keynote', label: 'The opening keynote' },
        { value: 'panel', label: 'The research panel' },
      ],
    },
    { id: 'again', type: 'yesno', title: 'Would you come back next year?' },
  ],
  ending: { title: 'See you next year' },
}

describe('Card deck survey', () => {
  test('deals a cover first; Start turns to the first card and focus goes with it', async () => {
    const user = userEvent.setup()
    reduced(<SurveyDeck survey={EVENT} />)
    expect(screen.getByRole('heading', { level: 1, name: 'How was Fieldwork 2026?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Start' }))
    await waitFor(() => expect(question()).toHaveTextContent('How was the day overall?'))
    await waitFor(() => expect(question()).toHaveFocus())
    expect(screen.getByRole('progressbar', { name: 'Progress' })).toHaveAttribute('aria-valuetext', 'Question 1 of 3')
  })

  test('Next says what’s missing; a pick goes on by itself; Back returns', async () => {
    const user = userEvent.setup()
    reduced(<SurveyDeck survey={EVENT} welcome={false} />)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('Choose an answer to go on.')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Great' }))
    await waitFor(() => expect(question()).toHaveTextContent('Which session stayed with you?'))
    await user.click(screen.getByRole('button', { name: 'Back' }))
    await waitFor(() => expect(question()).toHaveTextContent('How was the day overall?'))
    expect(screen.getByRole('radio', { name: 'Great' })).toBeChecked()
  })

  test('the last card sends what was asked, then the ending; Start over begins again', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onValueChange = vi.fn()
    reduced(
      <SurveyDeck
        survey={EVENT}
        welcome={false}
        defaultValue={{ overall: 5, best: 'panel' }}
        onSubmit={onSubmit}
        onValueChange={onValueChange}
        copy={{ send: 'Send to Fieldwork' }}
      />,
    )
    expect(question()).toHaveTextContent('Would you come back next year?')
    await user.click(screen.getByRole('radio', { name: 'Yes' }))
    expect(onValueChange).toHaveBeenLastCalledWith({ overall: 5, best: 'panel', again: true })
    await user.click(screen.getByRole('button', { name: 'Send to Fieldwork' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ overall: 5, best: 'panel', again: true }))
    expect(await screen.findByRole('heading', { name: 'See you next year' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Start over' }))
    expect(onValueChange).toHaveBeenLastCalledWith({})
  })

  test('embedded, it is a panel of a phone’s size in your page: an h2, each question an h3', () => {
    reduced(<SurveyDeck survey={EVENT} embedded welcome={false} />)
    expect(screen.queryByRole('main')).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'How was Fieldwork 2026?' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('How was the day overall?')
  })
})
