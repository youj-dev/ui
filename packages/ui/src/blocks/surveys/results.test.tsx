import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SurveyResults, type Survey, type SurveyResponse } from './results'
import { nps } from './results/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const POLL: Survey = {
  title: 'Team offsite',
  questions: [
    {
      id: 'city',
      type: 'choice',
      title: 'Where should we go?',
      options: [
        { value: 'lisbon', label: 'Lisbon' },
        { value: 'porto', label: 'Porto' },
      ],
    },
    { id: 'score', type: 'nps', title: 'How likely are you to recommend the last one?' },
  ],
}
const response = (id: string, answers: SurveyResponse['answers'], completed = true): SurveyResponse => ({ id, answers, completed, seconds: 60 })

describe('Survey results', () => {
  test('NPS is promoters minus detractors, as shares of everyone who answered', () => {
    expect(nps([10, 9, 8, 7, 3])).toMatchObject({ score: 20, promoters: 2, passives: 2, detractors: 1, total: 5 })
    expect(nps([]).score).toBe(0)
  })

  test('counts responses and completion, and opens on the NPS question', () => {
    const responses = [
      response('a', { city: 'lisbon', score: 10 }),
      response('b', { city: 'porto', score: 9 }),
      response('c', { city: 'lisbon', score: 2 }),
      response('d', { city: 'lisbon' }, false),
    ]
    reduced(<SurveyResults survey={POLL} responses={responses} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Team offsite' })).toBeInTheDocument()
    expect(screen.getByText('Responses').nextElementSibling).toHaveTextContent('4')
    expect(screen.getByText('Completed').nextElementSibling).toHaveTextContent('75%')
    expect(screen.getByText('Answered by 3')).toBeInTheDocument()
    expect(screen.getByText('Net Promoter Score')).toBeInTheDocument()
    // 2 promoters, 1 detractor of 3: +33.
    expect(screen.getByText('67%')).toBeInTheDocument()
  })

  test('another question replaces the summary in the same space', async () => {
    const user = userEvent.setup()
    const onQuestionChange = vi.fn()
    const responses = [response('a', { city: 'lisbon' }), response('b', { city: 'porto' }), response('c', { city: 'lisbon' })]
    reduced(<SurveyResults survey={POLL} responses={responses} onQuestionChange={onQuestionChange} />)
    await user.click(screen.getByRole('combobox', { name: 'Question' }))
    await user.click(await screen.findByRole('option', { name: '1. Where should we go?' }))
    expect(onQuestionChange).toHaveBeenCalledWith('city')
    const lisbon = screen.getByText('Lisbon').closest('li')!
    expect(within(lisbon).getByText(/67%/)).toBeInTheDocument()
  })

  test('says so when nobody has answered, and keeps its shape while loading', () => {
    const view = reduced(<SurveyResults survey={POLL} responses={[]} />)
    expect(screen.getByText('No responses yet')).toBeInTheDocument()
    view.unmount()
    reduced(<SurveyResults survey={POLL} loading />)
    expect(screen.getByRole('region', { name: 'Team offsite' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading results')).toBeInTheDocument()
  })

  test('standalone, it is the page: an h1', () => {
    reduced(<SurveyResults embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Help shape Tern' })).toBeInTheDocument()
  })

  test('an event’s survey, attendees and wording come from props: its NPS opens first and the labels are its own', () => {
    const event: Survey = {
      title: 'Harbor Tech Summit 2026',
      questions: [
        { id: 'keynote', type: 'rating', title: 'How was the opening keynote?' },
        { id: 'nps', type: 'nps', title: 'How likely are you to recommend the summit to a colleague?' },
      ],
    }
    const attendees = [10, 9, 8, 6].map((score, i) => response(`a${i}`, { nps: score, keynote: 5 }))
    reduced(<SurveyResults survey={event} responses={attendees} copy={{ title: 'Attendee feedback', live: 'Closed', responses: 'Attendees' }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Harbor Tech Summit 2026' })).toBeInTheDocument()
    expect(screen.getByText('Attendee feedback')).toBeInTheDocument()
    expect(screen.getByText('Closed')).toBeInTheDocument()
    expect(screen.getByText('Attendees').nextElementSibling).toHaveTextContent('4')
    expect(screen.getByText('Net Promoter Score')).toBeInTheDocument()
    // 2 promoters, 1 detractor of 4: +25.
    expect(screen.getByRole('combobox', { name: 'Question' })).toHaveTextContent('2. How likely are you to recommend the summit')
  })
})
