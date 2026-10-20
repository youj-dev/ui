import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SurveyBuilder, type Survey } from './builder'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const outline = () => screen.getByRole('navigation', { name: /Questions/ })
const rows = () =>
  within(outline())
    .getAllByRole('button', { name: /^\d+\. / })
    .map((b) => b.getAttribute('aria-label'))
const title = () => screen.getByRole('textbox', { name: 'Question' }) as HTMLTextAreaElement

const SMALL: Survey = {
  title: 'Workshop feedback',
  questions: [
    { id: 'overall', type: 'rating', title: 'How was the workshop?' },
    {
      id: 'pace',
      type: 'choice',
      title: 'How was the pace?',
      options: [
        { value: 'slow', label: 'Too slow' },
        { value: 'fast', label: 'Too fast' },
      ],
    },
  ],
}

describe('Survey builder', () => {
  beforeAll(() => {
    Element.prototype.scrollTo ??= () => {}
  })

  test('the outline lists every question with its kind and logic; a row opens it in the editor', async () => {
    const user = userEvent.setup()
    reduced(<SurveyBuilder />)
    expect(rows()).toHaveLength(14)
    expect(rows()[3]).toBe('4. What’s the one thing we should fix first?, Long text, has logic')
    expect(title().value).toBe('What best describes your role?')
    await user.click(within(outline()).getByRole('button', { name: /^3\. How likely/ }))
    expect(title().value).toBe('How likely are you to recommend Tern to a friend or colleague?')
    expect(screen.getByRole('textbox', { name: 'Low end' })).toHaveAttribute('placeholder', 'Not likely')
  })

  test('Add question puts the kind picked after the selected question, and selects it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(<SurveyBuilder defaultValue={SMALL} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: 'Add question' }))
    await user.click(await screen.findByRole('menuitem', { name: /Net Promoter Score/ }))
    expect(rows()).toEqual([
      '1. How was the workshop?, Star rating',
      '2. How likely are you to recommend us to a friend or colleague?, Net Promoter Score',
      '3. How was the pace?, Single choice',
    ])
    expect(title().value).toBe('How likely are you to recommend us to a friend or colleague?')
    expect(onValueChange.mock.lastCall![0].questions.map((q: { id: string }) => q.id)).toEqual(['overall', 'nps', 'pace'])
  })

  test('typing is one undo step; ⌘Z undoes it and ⇧⌘Z brings it back, each said aloud', async () => {
    const user = userEvent.setup()
    reduced(<SurveyBuilder defaultValue={SMALL} />)
    await user.clear(title())
    await user.type(title(), 'Rate the workshop')
    expect(rows()[0]).toBe('1. Rate the workshop, Star rating')
    // Out of the text field, ⌘Z is the builder's.
    screen.getByRole('button', { name: 'Undo' }).focus()
    await user.keyboard('{Meta>}z{/Meta}')
    expect(rows()[0]).toBe('1. How was the workshop?, Star rating')
    expect(screen.getAllByRole('status').some((s) => s.textContent === 'Undone')).toBe(true)
    await user.keyboard('{Meta>}{Shift>}z{/Shift}{/Meta}')
    expect(rows()[0]).toBe('1. Rate the workshop, Star rating')
  })

  test('a kind changes in place: the words stay, and a choice keeps its options', async () => {
    const user = userEvent.setup()
    reduced(<SurveyBuilder defaultValue={SMALL} defaultSelected="pace" />)
    await user.click(screen.getByRole('combobox', { name: 'Type' }))
    await user.click(await screen.findByRole('option', { name: 'Ranking' }))
    expect(rows()[1]).toBe('2. How was the pace?, Ranking')
    expect(screen.getByRole('textbox', { name: 'Option 1' })).toHaveValue('Too slow')
  })

  test('options: Enter adds the next, and a pasted list becomes one option per line', async () => {
    const user = userEvent.setup()
    reduced(<SurveyBuilder defaultValue={SMALL} defaultSelected="pace" />)
    await user.click(screen.getByRole('textbox', { name: 'Option 2' }))
    await user.keyboard('{End}{Enter}')
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Option 3' })).toHaveFocus())
    await user.paste('About right\nNo opinion')
    expect(screen.getByRole('textbox', { name: 'Option 3' })).toHaveValue('About right')
    expect(screen.getByRole('textbox', { name: 'Option 4' })).toHaveValue('No opinion')
  })

  test('logic: “Only if…” reads an earlier question', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(<SurveyBuilder defaultValue={SMALL} defaultSelected="pace" onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: 'Only if…' }))
    expect(onValueChange.mock.lastCall![0].questions[1].showIf).toEqual({
      match: undefined,
      conditions: [{ question: 'overall', op: 'lte', value: 3 }],
    })
    expect(rows()[1]).toBe('2. How was the pace?, Single choice, has logic')
  })

  test('a deleted question offers Undo', async () => {
    const user = userEvent.setup()
    reduced(<SurveyBuilder defaultValue={SMALL} defaultSelected="pace" />)
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    expect(rows()).toHaveLength(1)
    await user.click(await screen.findByRole('button', { name: 'Undo', hidden: false }))
    await waitFor(() => expect(rows()).toHaveLength(2))
  })

  test('saves itself a beat after a change; a failed save says so and retries', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined)
    reduced(<SurveyBuilder defaultValue={SMALL} onSave={onSave} />)
    await user.type(title(), '!')
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1), { timeout: 2000 })
    expect(await screen.findByText('Couldn’t save')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2))
    expect(onSave.mock.lastCall![0].questions[0].title).toBe('How was the workshop?!')
    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })

  test('Publish: where, then when, then the live link', async () => {
    const user = userEvent.setup()
    const onPublish = vi.fn().mockResolvedValue({ url: 'https://forms.example.com/workshop' })
    reduced(<SurveyBuilder defaultValue={SMALL} onPublish={onPublish} />)
    await user.click(screen.getByRole('button', { name: /^Publish$/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Publish survey' })
    expect(within(dialog).getByRole('textbox')).toHaveValue('workshop-feedback')
    await user.click(within(dialog).getByRole('button', { name: 'Continue' }))
    await user.click(await within(dialog).findByRole('button', { name: 'After responses' }))
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }))
    await waitFor(() => expect(onPublish).toHaveBeenCalledTimes(1))
    expect(onPublish.mock.lastCall![0]).toMatchObject({
      channel: 'link',
      slug: 'workshop-feedback',
      start: null,
      close: { kind: 'responses', responses: 500 },
    })
    expect(await within(dialog).findByRole('textbox', { name: 'Link' })).toHaveValue('https://forms.example.com/workshop')
  })

  test('a new survey offers the kinds to begin with', async () => {
    const user = userEvent.setup()
    reduced(<SurveyBuilder defaultValue={{ title: 'Untitled survey', questions: [] }} />)
    expect(screen.getByText('Start with a question')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Yes or no/ }))
    expect(rows()).toEqual(['1. Would you use this again?, Yes or no'])
  })
})
