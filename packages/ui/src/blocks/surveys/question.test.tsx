import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SurveyQuestionCard, type SurveyQuestion } from './question'
import { asked, designTheme, ordered, problem, QUESTION_COPY, readable, SURVEY } from './question/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const format = { list: new Intl.ListFormat('en', { type: 'conjunction' }), date: new Intl.DateTimeFormat('en', { dateStyle: 'long' }) }

describe('the survey definition', () => {
  test('show-if logic: a question is asked while its conditions hold for earlier answers', () => {
    const ids = (answers: Record<string, unknown>) => asked(SURVEY.questions, answers as never).map((q) => q.id)
    expect(ids({})).toEqual(['role', 'use', 'score', 'setup', 'speed', 'planner', 'value', 'next', 'hours', 'follow'])
    expect(ids({ score: 4 })).toContain('fix')
    expect(ids({ score: 4 })).not.toContain('love')
    expect(ids({ score: 10 })).toContain('love')
    expect(ids({ follow: true })).toEqual(expect.arrayContaining(['email', 'call']))
  })

  test('a condition on a later or hidden question never holds, so no answer is read that wasn’t asked for', () => {
    const questions: SurveyQuestion[] = [
      { id: 'b', type: 'yesno', title: 'B', showIf: { conditions: [{ question: 'a', op: 'is', value: true }] } },
      { id: 'a', type: 'yesno', title: 'A' },
      { id: 'c', type: 'text', title: 'C', showIf: { conditions: [{ question: 'b', op: 'answered' }] } },
    ]
    // `b` reads `a`, which comes later: it never shows, and `c`, which reads `b`, stays hidden even with a stale answer to `b`.
    expect(asked(questions, { a: true, b: true }).map((q) => q.id)).toEqual(['a'])
  })

  test('any of several conditions, and numbers at most or at least', () => {
    const questions: SurveyQuestion[] = [
      { id: 'n', type: 'nps', title: 'N' },
      {
        id: 'x',
        type: 'text',
        title: 'X',
        showIf: {
          match: 'any',
          conditions: [
            { question: 'n', op: 'lte', value: 2 },
            { question: 'n', op: 'gte', value: 9 },
          ],
        },
      },
    ]
    expect(asked(questions, { n: 1 }).map((q) => q.id)).toEqual(['n', 'x'])
    expect(asked(questions, { n: 5 }).map((q) => q.id)).toEqual(['n'])
    expect(asked(questions, { n: 9 }).map((q) => q.id)).toEqual(['n', 'x'])
  })

  test('says what stops an answer, by type', () => {
    const q = (id: string) => SURVEY.questions.find((x) => x.id === id)!
    expect(problem(q('role'), undefined, QUESTION_COPY)).toBe('Choose an answer to go on.')
    expect(problem(q('love'), undefined, QUESTION_COPY)).toBeUndefined()
    expect(problem(q('email'), 'ada@', QUESTION_COPY)).toBe('Enter an email like name@company.com.')
    expect(problem(q('value'), { cycles: 'very' }, QUESTION_COPY)).toBe('Answer every row.')
    expect(problem(q('fix'), 'x'.repeat(501), QUESTION_COPY)).toBe('Keep it under 500 characters.')
    expect(problem(q('role'), undefined, QUESTION_COPY, true)).toBe('Say what “Other” is, or choose another answer.')
  })

  test('reads an answer in words', () => {
    const q = (id: string) => SURVEY.questions.find((x) => x.id === id)!
    expect(readable(q('use'), ['sprints', 'docs'], format, QUESTION_COPY)).toBe('Planning sprints and Docs and specs')
    expect(readable(q('role'), 'Research', format, QUESTION_COPY)).toBe('Research')
    expect(readable(q('follow'), true, format, QUESTION_COPY)).toBe('Yes')
    expect(readable(q('speed'), 3, format, QUESTION_COPY)).toBe('3 of 5')
    expect(readable(q('call'), '2026-10-14', format, QUESTION_COPY)).toBe('October 14, 2026')
  })

  test('randomized options take an order of the seed’s own, the same every time', () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    expect(ordered(items, false, 'x')).toBe(items)
    expect(ordered(items, true, 'respondent-1')).toEqual(ordered(items, true, 'respondent-1'))
    expect([...ordered(items, true, 'respondent-1')].sort()).toEqual(items)
    expect(ordered(items, true, 'respondent-1')).not.toEqual(ordered(items, true, 'respondent-2'))
  })

  test('the design becomes a theme override, and nothing at all when it changes nothing', () => {
    expect(designTheme(undefined)).toBeUndefined()
    expect(designTheme({ corners: 'soft', font: 'sans' })).toBeUndefined()
    expect(designTheme({ accent: 'teal', corners: 'round' })).toEqual({ accent: 'teal', radius: 'full', controls: 'pill' })
    expect(designTheme({ font: 'serif' })?.fonts?.display).toMatch(/serif/)
  })
})

describe('Question card', () => {
  test('a face sends itself after a beat, the thanks takes the question’s place and its focus', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    reduced(<SurveyQuestionCard onSubmit={onSubmit} />)
    expect(screen.getByRole('heading', { level: 2, name: 'How was this article?' })).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Good' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(4))
    const thanks = await screen.findByRole('heading', { name: 'Thanks for the feedback' })
    await waitFor(() => expect(thanks).toHaveFocus())
    await user.click(screen.getByRole('button', { name: 'Change your answer' }))
    expect(screen.getByRole('radio', { name: 'Good' })).toBeChecked()
  })

  test('a question that needs more than a pick sends with Send, and says what’s missing', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onValueChange = vi.fn()
    const poll: SurveyQuestion = {
      id: 'when',
      type: 'choice',
      multiple: true,
      title: 'Which days work?',
      options: [
        { value: 'tue', label: 'Tuesday' },
        { value: 'wed', label: 'Wednesday' },
      ],
    }
    reduced(
      <SurveyQuestionCard question={poll} onSubmit={onSubmit} onValueChange={onValueChange} copy={{ send: 'Vote', doneTitle: 'Vote counted' }} />,
    )
    await user.click(screen.getByRole('button', { name: 'Vote' }))
    expect(await screen.findByText('Choose an answer to go on.')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Wednesday' }))
    expect(onValueChange).toHaveBeenLastCalledWith(['wed'])
    await user.click(screen.getByRole('button', { name: 'Vote' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(['wed']))
    expect(await screen.findByRole('heading', { name: 'Vote counted' })).toBeInTheDocument()
  })

  test('a failed send keeps the answer and says why', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('Voting has closed.'))
    reduced(<SurveyQuestionCard onSubmit={onSubmit} autoSubmit={false} />)
    await user.click(screen.getByRole('radio', { name: 'Okay' }))
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText('Voting has closed.')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Okay' })).toBeChecked()
  })

  test('a scale is one line of keys, and where that is too narrow a slider holding the same answer', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const nps: SurveyQuestion = { id: 'nps', type: 'nps', title: 'How likely are you to recommend us?' }
    reduced(<SurveyQuestionCard question={nps} onValueChange={onValueChange} autoSubmit={false} />)
    const keys = screen.getByRole('group', { name: /How likely/ })
    expect(within(keys).getAllByRole('button')).toHaveLength(11)
    await user.click(within(keys).getByRole('button', { name: '9' }))
    expect(within(keys).getByRole('button', { name: '9' })).toHaveAttribute('aria-pressed', 'true')
    expect(onValueChange).toHaveBeenLastCalledWith(9)

    // jsdom applies no container queries, so the narrow form is in the tree too.
    const slider = screen.getByRole('slider', { hidden: true })
    expect(slider).toHaveAttribute('aria-valuetext', '9')
    slider.focus()
    await user.keyboard('{ArrowLeft}')
    expect(onValueChange).toHaveBeenLastCalledWith(8)
    expect(within(keys).getByRole('button', { name: '8' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('standalone, it is the page: an h1', () => {
    reduced(<SurveyQuestionCard embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'How was this article?' })).toBeInTheDocument()
  })

  test('a lesson’s rating question and thanks come from props, and a star sends itself', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const question: SurveyQuestion = { id: 'lesson', type: 'rating', title: 'How would you rate today’s lesson on fractions?', description: 'Your teacher reads the ratings without names.' }
    reduced(<SurveyQuestionCard question={question} onSubmit={onSubmit} copy={{ doneTitle: 'Thanks, that helps', change: 'Change your rating' }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'How would you rate today’s lesson on fractions?' })).toBeInTheDocument()
    expect(screen.getByText('Your teacher reads the ratings without names.')).toBeInTheDocument()
    screen.getByRole('slider').focus()
    await user.keyboard('4')
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(4))
    expect(await screen.findByRole('heading', { name: 'Thanks, that helps' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change your rating' })).toBeInTheDocument()
  })
})
