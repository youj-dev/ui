import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SetupStepper, type SetupStepperProps } from './setup-stepper'

const setup = (props: Partial<SetupStepperProps> = {}) =>
  render(
    <YoujProvider reducedMotion="always">
      <SetupStepper {...props} />
    </YoujProvider>,
  )

const config = () => screen.getByRole('region', { name: 'Config' })
const line = (text: RegExp) => within(config()).getByText((_, el) => el?.getAttribute('data-changed') !== null && el?.tagName === 'SPAN' && el.classList.contains('grid') && text.test(el.textContent ?? ''))

describe('SetupStepper', () => {
  test('opens on step 2 of 3, with the template as the config', () => {
    setup()
    expect(screen.getByRole('heading', { level: 2, name: 'New assistant' })).toBeInTheDocument()
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Behavior' })).toBeInTheDocument()
    expect(within(config()).getByText('Template defaults')).toBeInTheDocument()
    expect(config()).toHaveTextContent('name = "release-scribe"')
    expect(config()).toHaveTextContent('temperature = 0.50 # balanced')
  })

  test('the config rebuilds as you edit, marking what differs from the template', async () => {
    const user = userEvent.setup()
    setup()
    const name = screen.getByRole('textbox', { name: /Name/ })
    await user.clear(name)
    await user.type(name, 'Triage Bot')
    expect(screen.getByText('Mention it as @triage-bot')).toBeInTheDocument()
    expect(line(/name = "triage-bot"/)).toHaveAttribute('data-changed')
    expect(within(config()).getByText('1 change from the template')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Web search' }))
    expect(screen.getByRole('button', { name: 'Web search' })).toHaveAttribute('aria-pressed', 'true')
    expect(config()).toHaveTextContent('enabled = ["web.search", "repo.read"]')
    expect(screen.getByText('2 on')).toBeInTheDocument()

    const creativity = screen.getByRole('slider', { hidden: true })
    creativity.focus()
    await user.keyboard('{End}')
    expect(config()).toHaveTextContent('temperature = 1.50 # exploratory')
    expect(creativity).toHaveAttribute('aria-valuetext', '1.50, Exploratory')
    expect(within(config()).getByText('3 changes from the template')).toBeInTheDocument()
  })

  test('a name it can’t use keeps you on the step and says why', async () => {
    const user = userEvent.setup()
    setup()
    await user.clear(screen.getByRole('textbox', { name: /Name/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText('Give it a name of 3 to 32 characters.')).toBeInTheDocument()
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
  })

  test('Back and Continue move through the steps; creating hands over the config', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    setup({ onCreate })
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: 'Purpose' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('heading', { name: 'Access' })).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Only me' }))
    expect(config()).toHaveTextContent('audience = "me"')
    await user.click(screen.getByRole('button', { name: 'Create assistant' }))
    expect(await screen.findByText('@release-scribe is ready')).toBeInTheDocument()
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'release-scribe', audience: 'me', options: ['repo'] }))
  })

  test('embedded: a section under an h2, with rewritten copy', () => {
    setup({ embedded: true, copy: { title: 'Neuer Assistent' } })
    const heading = screen.getByRole('heading', { level: 2, name: 'Neuer Assistent' })
    expect(heading.closest('section')).toHaveAttribute('aria-labelledby', heading.id)
    expect(screen.queryByRole('main')).toBeNull()
  })
  test('your choices, options, scale and audiences replace the assistant’s, and the config follows the copy', async () => {
    const user = userEvent.setup()
    setup({
      initial: { description: 'A first course in charts.', name: 'Charts for everyone', choice: 'beginner', level: 4, options: ['data'], audience: 'cohort' },
      choices: [
        { value: 'beginner', label: 'Beginner', hint: 'No prerequisites', measure: 6 },
        { value: 'advanced', label: 'Advanced', hint: 'Projects with real data' },
      ],
      options: [
        { value: 'data', label: 'Reading data', id: 'modules.data' },
        { value: 'color', label: 'Color and contrast', id: 'modules.color' },
      ],
      scale: { min: 1, max: 12, step: 1, ticks: 11, decimals: 0, zones: [{ label: 'Relaxed', to: 3 }, { label: 'Steady' }] },
      audiences: [
        { value: 'self', label: 'Self-paced' },
        { value: 'cohort', label: 'Cohort' },
      ],
      copy: {
        title: 'New course',
        scale: 'Pace',
        measure: (amount) => `${amount} weeks`,
        previewFile: 'course.toml',
        previewSections: { main: '[course]', scale: '[schedule]', options: '[modules]', access: '[enrollment]' },
        previewKeys: { name: 'title', choice: 'level', description: 'summary', level: 'hours_per_week', options: 'included', audience: 'open_to' },
        changed: (count) => `${count} edits from the draft`,
      },
    })
    expect(screen.getByRole('heading', { level: 2, name: 'New course' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Web search' })).toBeNull()
    expect(screen.getByText('No prerequisites · 6 weeks')).toBeInTheDocument()
    expect(config()).toHaveTextContent('[schedule]')
    expect(config()).toHaveTextContent('hours_per_week = 4 # steady')
    expect(config()).toHaveTextContent('included = ["modules.data"]')
    expect(within(config()).getByText('0 edits from the draft')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Color and contrast' }))
    expect(config()).toHaveTextContent('included = ["modules.data", "modules.color"]')
    expect(within(config()).getByText('1 edits from the draft')).toBeInTheDocument()
  })

  test('scale={null} leaves the slider and its section out', () => {
    setup({ scale: null })
    expect(screen.queryByRole('slider', { hidden: true })).toBeNull()
    expect(config()).not.toHaveTextContent('[sampling]')
    expect(config()).toHaveTextContent('[tools]')
  })
})
