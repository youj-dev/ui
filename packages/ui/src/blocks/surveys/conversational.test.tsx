import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ConversationalSurvey, type Survey } from './conversational'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const question = () => screen.getByRole('heading', { level: 2 })
const ok = () => screen.getAllByRole('button', { name: /^(OK|Skip|Review answers|Back to review)$/ })[0]!
const status = () => screen.getAllByRole('status').find((el) => /Question/.test(el.textContent ?? ''))
/** Answers that reach the score: the first two questions answered. */
const START = { role: 'design', use: ['sprints'] }

describe('Conversational survey', () => {
  beforeAll(() => {
    Element.prototype.scrollTo ??= () => {}
  })

  test('opens on a welcome with the title and how long it takes; Start asks the first question of this path', async () => {
    const user = userEvent.setup()
    reduced(<ConversationalSurvey />)
    expect(screen.getByRole('heading', { level: 1, name: 'Help shape Tern' })).toBeInTheDocument()
    expect(screen.getByText(/Takes about \d+ min/)).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Start' })[0]!)
    await waitFor(() => expect(question()).toHaveTextContent('What best describes your role?'))
    // Logic waits on the score and the follow-up: ten questions on this path for now.
    expect(screen.getByText('1 of 10')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Question 1 of 10')
  })

  test('a letter picks a single choice and the survey goes on by itself; focus lands on the next question', async () => {
    const user = userEvent.setup()
    reduced(<ConversationalSurvey welcome={false} />)
    screen.getByRole('radio', { name: 'Engineering' }).focus()
    await user.keyboard('b')
    expect(screen.getByRole('radio', { name: 'Design' })).toBeChecked()
    await waitFor(() => expect(question()).toHaveTextContent('What do you use Tern for?'))
    await waitFor(() => expect(question()).toHaveFocus())
    expect(status()).toHaveTextContent('Question 2 of 10')
  })

  test('arrow keys only move the pick; Enter goes on', async () => {
    const user = userEvent.setup()
    reduced(<ConversationalSurvey welcome={false} autoAdvance={false} />)
    await user.click(screen.getByRole('radio', { name: 'Engineering' }))
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: 'Design' })).toBeChecked()
    expect(question()).toHaveTextContent('What best describes your role?')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(question()).toHaveTextContent('What do you use Tern for?'))
  })

  test('a multiple choice takes letters as toggles and refuses to go on empty; “Other” opens its own field', async () => {
    const user = userEvent.setup()
    reduced(<ConversationalSurvey defaultValue={{ role: 'design' }} />)
    expect(question()).toHaveTextContent('What do you use Tern for?')
    await user.click(ok())
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose an answer to go on.')
    screen.getByRole('checkbox', { name: 'Planning sprints' }).focus()
    await user.keyboard('ac')
    expect(screen.getByRole('checkbox', { name: 'Planning sprints' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Roadmaps' })).toBeChecked()

    await user.click(screen.getAllByRole('button', { name: 'Back' })[0]!)
    await waitFor(() => expect(question()).toHaveTextContent('What best describes your role?'))
    screen.getByRole('radio', { name: 'Design' }).focus()
    await user.keyboard('e')
    const other = await screen.findByRole('textbox', { name: 'Other' })
    await waitFor(() => expect(other).toHaveFocus())
    await user.keyboard('{Enter}')
    expect(await screen.findByText('Say what “Other” is, or choose another answer.')).toBeInTheDocument()
    await user.type(other, 'Research{Enter}')
    await waitFor(() => expect(question()).toHaveTextContent('What do you use Tern for?'))
  })

  test('digits pick a score, 1 then 0 is ten, and the score decides what comes next', async () => {
    const user = userEvent.setup()
    reduced(<ConversationalSurvey defaultValue={START} />)
    expect(question()).toHaveTextContent('How likely are you to recommend Tern')
    // The keys are the kit's segmented control: pressed buttons in a group.
    const scale = screen.getByRole('group', { name: /How likely/ })
    within(scale).getByRole('button', { name: '5' }).focus()
    await user.keyboard('10')
    expect(within(scale).getByRole('button', { name: '10' })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(question()).toHaveTextContent('In a few words, what do you love about Tern?'))
    await user.click(screen.getAllByRole('button', { name: 'Back' })[0]!)
    await user.click(within(screen.getByRole('group', { name: /How likely/ })).getByRole('button', { name: '3' }))
    await waitFor(() => expect(question()).toHaveTextContent('What’s the one thing we should fix first?'))
    // A low score makes this one required.
    await user.click(ok())
    expect(await screen.findByText('This one needs an answer.')).toBeInTheDocument()
  })

  test('a long answer goes on with ⌘↵, not Enter', async () => {
    const user = userEvent.setup()
    reduced(<ConversationalSurvey defaultValue={{ ...START, score: 4 }} />)
    const box = screen.getByRole('textbox', { name: 'What’s the one thing we should fix first?' })
    await user.type(box, 'Search{Enter}is slow')
    expect(box).toHaveValue('Search\nis slow')
    expect(question()).toHaveTextContent('fix first')
    await user.keyboard('{Meta>}{Enter}{/Meta}')
    await waitFor(() => expect(question()).toHaveTextContent('How easy was Tern to set up?'))
  })

  test('faces, yes or no and a matrix answer from the keyboard; a matrix needs every row', async () => {
    const user = userEvent.setup()
    reduced(<ConversationalSurvey defaultValue={{ ...START, score: 8, setup: 6, speed: 4 }} />)
    expect(question()).toHaveTextContent('How does the new planner feel?')
    screen.getByRole('radio', { name: 'Awful' }).focus()
    await user.keyboard('4')
    expect(screen.getByRole('radio', { name: 'Good' })).toBeChecked()
    await waitFor(() => expect(question()).toHaveTextContent('How useful is each of these to you?'))
    await user.click(within(screen.getByRole('radiogroup', { name: 'Cycles' })).getByRole('radio', { name: 'Very useful' }))
    await user.click(ok())
    expect(await screen.findByText('Answer every row.')).toBeInTheDocument()
    await user.click(within(screen.getByRole('radiogroup', { name: 'Roadmaps' })).getByRole('radio', { name: 'Somewhat' }))
    await user.click(within(screen.getByRole('radiogroup', { name: 'Insights' })).getByRole('radio', { name: 'Not useful' }))
    await user.click(ok())
    await waitFor(() => expect(question()).toHaveTextContent('Rank what we should build next'))
    // The order on screen isn't an answer until it's kept or moved.
    await user.click(ok())
    expect(await screen.findByText('Put them in your order, or keep this one.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Keep this order' }))
    await user.click(ok())
    await waitFor(() => expect(question()).toHaveTextContent('How much time do you spend in Tern?'))
  })

  test('the review reads every answer in words; Edit returns to it, unless the change opens a question that needs an answer', async () => {
    const user = userEvent.setup()
    const answers = {
      role: 'design',
      use: ['sprints', 'docs'],
      score: 8,
      setup: 6,
      speed: 4,
      planner: 5,
      value: { cycles: 'very', roadmaps: 'some', insights: 'not' },
      next: ['offline', 'api', 'calendar', 'triage'],
      hours: 12,
      follow: false,
    }
    reduced(<ConversationalSurvey defaultValue={answers} />)
    expect(question()).toHaveTextContent('Check your answers')
    const rows = screen.getAllByRole('definition').map((dd) => dd.textContent)
    expect(rows).toEqual([
      'Design',
      'Planning sprints and Docs and specs',
      '8',
      '6',
      '4 of 5',
      'Great',
      'Cycles: Very useful\nRoadmaps: Somewhat\nInsights: Not useful',
      '1. Offline mode\n2. A public API\n3. Calendar sync\n4. Automatic triage',
      '12 h a week',
      'No',
    ])
    await user.click(screen.getByRole('button', { name: 'Edit your answer to “Can we follow up about your answers?”' }))
    expect(question()).toHaveTextContent('Can we follow up about your answers?')
    screen.getByRole('radio', { name: 'No' }).focus()
    await user.keyboard('y')
    // Yes opens the email question, which needs an answer before the review.
    await waitFor(() => expect(question()).toHaveTextContent('Where can we reach you?'))
    const email = screen.getByRole('textbox', { name: 'Where can we reach you?' })
    await user.type(email, 'ada@{Enter}')
    expect(await screen.findByText('Enter an email like name@company.com.')).toBeInTheDocument()
    await user.type(email, 'northwind.com{Enter}')
    await waitFor(() => expect(question()).toHaveTextContent('Check your answers'))
    expect(screen.getByText('ada@northwind.com')).toBeInTheDocument()
  })

  test('Send gets only the answers to questions that were asked, then the ending', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    // A stale answer to a question this path no longer asks is left out.
    const answers = {
      role: 'design',
      use: ['docs'],
      score: 9,
      fix: 'old',
      setup: 5,
      speed: 5,
      planner: 4,
      value: { cycles: 'very', roadmaps: 'very', insights: 'very' },
      next: ['api'],
      hours: 3,
      follow: false,
    }
    reduced(<ConversationalSurvey onSubmit={onSubmit} defaultValue={answers} />)
    await user.click(screen.getAllByRole('button', { name: 'Send answers' })[0]!)
    const { fix: _, ...asked } = answers
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(asked))
    expect(await screen.findByRole('heading', { level: 2, name: 'Thank you' })).toBeInTheDocument()
  })

  test('a failed send keeps every answer and says so', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('The survey closed an hour ago.'))
    const answers = {
      role: 'design',
      use: ['docs'],
      score: 9,
      setup: 5,
      speed: 5,
      planner: 4,
      value: { cycles: 'very', roadmaps: 'very', insights: 'very' },
      next: ['api'],
      hours: 3,
      follow: false,
    }
    reduced(<ConversationalSurvey onSubmit={onSubmit} defaultValue={answers} />)
    await user.click(screen.getAllByRole('button', { name: 'Send answers' })[0]!)
    expect(await screen.findByText('The survey closed an hour ago.')).toBeInTheDocument()
    expect(question()).toHaveTextContent('Check your answers')
    expect(screen.getByText('Design')).toBeInTheDocument()
  })

  test('your survey, brand, copy and callbacks drive it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const onSubmit = vi.fn()
    const survey: Survey = {
      title: 'After your tasting',
      questions: [
        { id: 'rating', type: 'scale', min: 1, max: 5, title: 'How was the tasting?' },
        { id: 'email', type: 'email', title: 'Where should we send the price list?' },
      ],
      ending: { title: 'Thanks, we’ll be in touch' },
    }
    reduced(
      <ConversationalSurvey
        survey={survey}
        welcome={false}
        review={false}
        brand={{ name: 'Fernhill' }}
        onValueChange={onValueChange}
        onSubmit={onSubmit}
        copy={{ send: 'Send to Fernhill' }}
      />,
    )
    expect(screen.getByText('Fernhill')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '4' }))
    expect(onValueChange).toHaveBeenLastCalledWith({ rating: 4 })
    await waitFor(() => expect(question()).toHaveTextContent('Where should we send the price list?'))
    await user.type(screen.getByRole('textbox'), 'jo@fernhill.coffee')
    // Without a review the last question sends.
    await user.click(screen.getAllByRole('button', { name: 'Send to Fernhill' })[0]!)
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ rating: 4, email: 'jo@fernhill.coffee' }))
    expect(await screen.findByRole('heading', { name: 'Thanks, we’ll be in touch' })).toBeInTheDocument()
  })

  test('embedded, it is a card in your page: an h2, and each question an h3', () => {
    reduced(<ConversationalSurvey embedded welcome={false} />)
    expect(screen.queryByRole('main')).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'Help shape Tern' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('What best describes your role?')
  })
})
