import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SurveyWidget } from './widget'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const question = () => screen.getByRole('heading', { level: 3 })

describe('In-app survey widget', () => {
  beforeAll(() => {
    Element.prototype.scrollTo ??= () => {}
  })

  test('appears in its corner over the page without taking focus', () => {
    reduced(
      <SurveyWidget>
        <button type="button">The page</button>
      </SurveyWidget>,
    )
    const page = screen.getByRole('button', { name: 'The page' })
    page.focus()
    expect(screen.getByRole('region', { name: 'Quick question' })).toBeInTheDocument()
    expect(question()).toHaveTextContent('How likely are you to recommend Tern')
    expect(page).toHaveFocus()
    // A follow-up waits on the score, so it counts already.
    expect(screen.getByText('1 of 2')).toBeInTheDocument()
  })

  test('the score decides the follow-up, and the last question sends', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    reduced(<SurveyWidget onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: '9' }))
    await waitFor(() => expect(question()).toHaveTextContent('What’s the main reason for your score?'))
    await user.type(screen.getByRole('textbox'), 'Fast and calm.')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ score: 9, why: 'Fast and calm.' }))
    expect(await screen.findByRole('heading', { name: 'Thanks for telling us' })).toBeInTheDocument()
  })

  test('minimize folds it into a pill that remembers where it was, and opens back', async () => {
    const user = userEvent.setup()
    reduced(<SurveyWidget defaultValue={{ score: 3 }} />)
    expect(question()).toHaveTextContent('What would make the biggest difference?')
    await user.click(screen.getByRole('button', { name: 'Minimize survey' }))
    const pill = await screen.findByRole('button', { name: 'Open survey, question 2 of 2' })
    await user.click(pill)
    await waitFor(() => expect(question()).toHaveTextContent('What would make the biggest difference?'))
  })

  test('× and Escape dismiss it, and the app hears it', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const view = reduced(<SurveyWidget onOpenChange={onOpenChange} />)
    await user.click(screen.getByRole('button', { name: 'Close survey' }))
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Quick question' })).toBeNull())
    view.unmount()

    reduced(<SurveyWidget onOpenChange={onOpenChange} />)
    screen.getByRole('button', { name: '5' }).focus()
    await user.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledTimes(2)
  })

  test('waits its delay before rising in', async () => {
    reduced(<SurveyWidget delay={200} />)
    expect(screen.queryByRole('region', { name: 'Quick question' })).toBeNull()
    expect(await screen.findByRole('region', { name: 'Quick question' })).toBeInTheDocument()
  })

  test('embedded, it sits in the flow of the page', () => {
    reduced(<SurveyWidget embedded data-testid="widget" />)
    const panel = screen.getByTestId('widget')
    expect(panel.closest('.fixed')).toBeNull()
    expect(panel).toHaveAttribute('aria-labelledby')
  })

  test('a shop’s single question, brand and thanks come from props', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const survey = {
      title: 'One quick question',
      questions: [{ id: 'found', type: 'yesno' as const, title: 'Did you find everything you were looking for?', labels: ['Yes', 'Not all'] as [string, string] }],
      ending: { title: 'Thanks for shopping with us', description: 'Your order confirmation is in your inbox.' },
    }
    reduced(<SurveyWidget survey={survey} brand={{ name: 'Linden & Co.' }} onSubmit={onSubmit} />)
    expect(screen.getByRole('region', { name: 'One quick question' })).toBeInTheDocument()
    expect(screen.getByText('L')).toBeInTheDocument()
    expect(question()).toHaveTextContent('Did you find everything you were looking for?')
    expect(screen.getByText('1 of 1')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Yes' }))
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ found: true }))
    expect(await screen.findByRole('heading', { name: 'Thanks for shopping with us' })).toBeInTheDocument()
  })
})
