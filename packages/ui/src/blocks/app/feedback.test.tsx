import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Feedback } from './feedback'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const instant = () => Promise.resolve()

describe('Feedback block: NPS survey', () => {
  test('slides in as a named region with 0–10 as one radio group, and nothing to send yet', async () => {
    reduced(<Feedback delay={0} onAnswer={instant} />)
    const survey = await screen.findByRole('region', { name: 'Tern feedback survey' })
    const scale = within(survey).getByRole('radiogroup', { name: /How likely are you to recommend Tern/ })
    expect(within(scale).getAllByRole('radio')).toHaveLength(11)
    expect(scale).toHaveAccessibleDescription('0 means not likely at all, 10 means extremely likely.')
    expect(within(survey).getByRole('button', { name: 'Send' })).toBeDisabled()
    expect(screen.getByRole('main')).not.toContainElement(document.activeElement as HTMLElement)
  })

  test('the follow-up question follows the score band', async () => {
    const user = userEvent.setup()
    reduced(<Feedback delay={0} onAnswer={instant} />)
    const survey = await screen.findByRole('region', { name: 'Tern feedback survey' })
    await user.click(within(survey).getByRole('radio', { name: '3' }))
    expect(within(survey).getByText('Sorry it’s falling short. What got in the way?')).toBeInTheDocument()
    await user.click(within(survey).getByRole('radio', { name: '8' }))
    expect(within(survey).getByText('What would make Tern a 10 for you?')).toBeInTheDocument()
    await user.click(within(survey).getByRole('radio', { name: '10' }))
    expect(within(survey).getByText('Glad to hear it. What do you like most?')).toBeInTheDocument()
  })

  test('arrow keys move the score and a digit jumps to it', async () => {
    const user = userEvent.setup()
    reduced(<Feedback delay={0} onAnswer={instant} />)
    const survey = await screen.findByRole('region', { name: 'Tern feedback survey' })
    await user.click(within(survey).getByRole('radio', { name: '5' }))
    await user.keyboard('{ArrowRight}')
    expect(within(survey).getByRole('radio', { name: '6' })).toBeChecked()
    await user.keyboard('9')
    const nine = within(survey).getByRole('radio', { name: '9' })
    expect(nine).toBeChecked()
    expect(nine).toHaveFocus()
  })

  test('sending the answer lands on the thanks step with focus on its heading', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn(instant)
    reduced(<Feedback delay={0} onAnswer={onAnswer} />)
    const survey = await screen.findByRole('region', { name: 'Tern feedback survey' })
    await user.click(within(survey).getByRole('radio', { name: '9' }))
    await user.click(await within(survey).findByRole('button', { name: 'Speed' }))
    await user.type(within(survey).getByRole('textbox'), 'The command bar.')
    await user.click(within(survey).getByRole('button', { name: 'Send' }))
    const heading = await within(survey).findByRole('heading', { name: 'You just made our week' })
    await waitFor(() => expect(heading).toHaveFocus())
    expect(onAnswer).toHaveBeenCalledWith({ score: 9, reasons: ['Speed'], comment: 'The command bar.' })
    expect(within(survey).getByText('You said 9 / 10')).toBeInTheDocument()
  })

  test('a band change clears the reasons picked for the old band', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn(instant)
    reduced(<Feedback delay={0} onAnswer={onAnswer} />)
    const survey = await screen.findByRole('region', { name: 'Tern feedback survey' })
    await user.click(within(survey).getByRole('radio', { name: '2' }))
    await user.click(await within(survey).findByRole('button', { name: 'Bugs' }))
    await user.click(within(survey).getByRole('radio', { name: '7' }))
    await user.click(within(survey).getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith({ score: 7, reasons: [], comment: '' }))
  })

  test('dismissing hands focus back to the page and offers Undo', async () => {
    const user = userEvent.setup()
    reduced(<Feedback delay={0} onAnswer={instant} />)
    const survey = await screen.findByRole('region', { name: 'Tern feedback survey' })
    await user.click(within(survey).getByRole('button', { name: 'Dismiss survey' }))
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Tern feedback survey' })).not.toBeInTheDocument())
    expect(screen.getByRole('main')).toHaveFocus()
    expect(await screen.findByText('Survey dismissed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(await screen.findByRole('region', { name: 'Tern feedback survey' })).toBeInTheDocument()
  })

  test('Not now snoozes the survey', async () => {
    const user = userEvent.setup()
    reduced(<Feedback delay={0} onAnswer={instant} />)
    const survey = await screen.findByRole('region', { name: 'Tern feedback survey' })
    await user.click(within(survey).getByRole('button', { name: 'Not now' }))
    expect(await screen.findByText('We’ll ask again in 2 weeks')).toBeInTheDocument()
  })
})

describe('Feedback block: widget', () => {
  const openWidget = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: 'Feedback' }))
    return screen.findByRole('dialog', { name: 'Send feedback' })
  }

  test('the type re-words the prompt, and an empty message is refused', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn(instant)
    reduced(<Feedback variant="widget" onSend={onSend} />)
    const popover = await openWidget(user)
    expect(within(popover).getByRole('textbox', { name: 'What went wrong?' })).toBeInTheDocument()
    await user.click(within(popover).getByRole('button', { name: /Idea/ }))
    const message = within(popover).getByRole('textbox', { name: 'What’s your idea?' })
    await user.click(within(popover).getByRole('button', { name: 'Send' }))
    expect(within(popover).getByText('Add a few words so we can act on it.')).toBeInTheDocument()
    expect(message).toHaveFocus()
    expect(onSend).not.toHaveBeenCalled()
  })

  test('⌘↵ sends; the sent state gives a reference and focus', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn(instant)
    reduced(<Feedback variant="widget" onSend={onSend} />)
    const popover = await openWidget(user)
    await user.type(within(popover).getByRole('textbox'), 'Export to CSV drops the last row.')
    await user.keyboard('{Meta>}{Enter}{/Meta}')
    const heading = await within(popover).findByRole('heading', { name: 'Sent. Thank you.' })
    await waitFor(() => expect(heading).toHaveFocus())
    expect(onSend).toHaveBeenCalledWith({ kind: 'bug', message: 'Export to CSV drops the last row.', screenshot: null })
    expect(within(popover).getByText(/^Reference FB-\d+$/)).toBeInTheDocument()
    await user.click(within(popover).getByRole('button', { name: 'Send another' }))
    await waitFor(() => expect(within(popover).getByRole('textbox')).toHaveValue(''))
  })

  test('a failed send raises an alert and keeps the draft', async () => {
    const user = userEvent.setup()
    reduced(<Feedback variant="widget" onSend={() => Promise.reject(new Error('Offline'))} />)
    const popover = await openWidget(user)
    await user.type(within(popover).getByRole('textbox'), 'Love the new board view.')
    await user.click(within(popover).getByRole('button', { name: 'Send' }))
    expect(await within(popover).findByRole('alert')).toHaveTextContent('Couldn’t send your feedback')
    expect(within(popover).getByRole('textbox')).toHaveValue('Love the new board view.')
    expect(within(popover).getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  test('a screenshot can be attached', async () => {
    const { createObjectURL, revokeObjectURL } = URL
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
    onTestFinished(() => {
      URL.createObjectURL = createObjectURL
      URL.revokeObjectURL = revokeObjectURL
    })
    const user = userEvent.setup()
    const onSend = vi.fn(instant)
    reduced(<Feedback variant="widget" onSend={onSend} />)
    const popover = await openWidget(user)
    const attach = within(popover).getByRole('button', { name: 'Attach a screenshot' })
    await user.click(attach)
    expect(attach).toHaveAttribute('aria-expanded', 'true')
    const shot = new File([new Uint8Array(64)], 'board.png', { type: 'image/png' })
    await user.upload(popover.querySelector<HTMLInputElement>('input[type=file]')!, shot)
    expect(within(popover).getByRole('button', { name: 'Screenshot attached' })).toBeInTheDocument()
    await user.type(within(popover).getByRole('textbox'), 'The board header overlaps.')
    await user.click(within(popover).getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ screenshot: shot })))
  })
})

describe('Feedback block: embedded', () => {
  test('a named section with the survey and the form inline; the answer can be changed', async () => {
    const user = userEvent.setup()
    reduced(<Feedback embedded onAnswer={instant} onSend={instant} />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Feedback' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Feedback' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Dismiss survey' })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Feedback type' })).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: '6' }))
    await user.click(screen.getAllByRole('button', { name: 'Send' })[0]!)
    await user.click(await screen.findByRole('button', { name: 'Change answer' }))
    expect(await screen.findByRole('radio', { name: '6' })).toBeChecked()
  })
})

describe('Feedback block: your data', () => {
  const copy = {
    question: (product: string) => `Would you recommend ${product}?`,
    embeddedTitle: 'Tell Quarry',
    kinds: () => ({
      bug: { label: 'Problem', prompt: 'What broke?', placeholder: 'Steps, please', sent: 'We’ll be in touch.' },
      idea: { label: 'Wish', prompt: 'What do you wish for?', placeholder: '', sent: 'Noted.' },
      praise: { label: 'Kudos', prompt: 'What do you love?', placeholder: '', sent: 'Thanks!' },
    }),
  }

  test('brand names the product, copy rewrites the survey and children replace the demo page', async () => {
    reduced(
      <Feedback delay={0} onAnswer={instant} brand={{ name: 'Quarry' }} copy={copy} data-testid="root">
        <p>Quarry dashboard</p>
      </Feedback>,
    )
    expect(screen.getByTestId('root')).toHaveClass('min-h-dvh')
    const survey = await screen.findByRole('region', { name: 'Quarry feedback survey' })
    expect(within(survey).getByRole('radiogroup', { name: 'Would you recommend Quarry?' })).toBeInTheDocument()
    expect(screen.getByText('Quarry dashboard')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Roadmap' })).not.toBeInTheDocument()
  })

  test('onSend gets the message and a string reply becomes the reference', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn(async () => 'QRY-7')
    reduced(<Feedback embedded onSend={onSend} copy={copy} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Tell Quarry' })).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Feedback type' })).getByText('Problem')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'What broke?' }), 'Export hangs at 90%')
    await user.click(screen.getAllByRole('button', { name: 'Send' })[1]!)
    expect(await screen.findByText('Reference QRY-7')).toBeInTheDocument()
    expect(onSend).toHaveBeenCalledWith({ kind: 'bug', message: 'Export hangs at 90%', screenshot: null })
  })

  test('headingLevel sets the embedded outline, and a rejected send shows its message', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn(() => Promise.reject(new Error('Quota reached for today.')))
    reduced(<Feedback embedded headingLevel={1} onSend={onSend} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Feedback' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Send feedback' })).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'What went wrong?' }), 'Export hangs')
    await user.click(screen.getAllByRole('button', { name: 'Send' })[1]!)
    expect(await screen.findByText('Quota reached for today.')).toBeInTheDocument()
  })

  test('onInvite and onSurveyClose fire from the thanks step', async () => {
    const user = userEvent.setup()
    const onSurveyClose = vi.fn()
    const onInvite = vi.fn()
    reduced(<Feedback delay={0} defaultScore={10} onAnswer={instant} onInvite={onInvite} onSurveyClose={onSurveyClose} />)
    const survey = await screen.findByRole('region', { name: 'Tern feedback survey' })
    await user.click(within(survey).getByRole('button', { name: 'Send' }))
    await user.click(await within(survey).findByRole('button', { name: /Invite a teammate/ }))
    expect(onInvite).toHaveBeenCalledOnce()
    await user.click(within(survey).getByRole('button', { name: 'Done' }))
    expect(onSurveyClose).toHaveBeenCalledWith('done')
  })

  test('feedback kinds are data: your types, prompts and icons drive the form, and the entry carries your key', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn(async () => 'MA-1')
    reduced(
      <Feedback
        embedded
        onSend={onSend}
        copy={{
          kinds: () => ({
            content: { label: 'Content', prompt: 'What was unclear?', placeholder: 'Which example?', sent: 'Read by your instructor.' },
            pace: { label: 'Pace', prompt: 'How did the pace feel?', placeholder: 'Too fast or too slow?', sent: 'Thanks.' },
          }),
        }}
      />,
    )
    const types = screen.getByRole('group', { name: 'Feedback type' })
    expect(within(types).queryByText('Bug')).not.toBeInTheDocument()
    expect(screen.getByText('What was unclear?')).toBeInTheDocument()
    await user.click(within(types).getByRole('button', { name: /Pace/ }))
    expect(screen.getByText('How did the pace feel?')).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('Too fast or too slow?'), 'Slow down in week four')
    await user.keyboard('{Meta>}{Enter}{/Meta}')
    await waitFor(() => expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ kind: 'pace', message: 'Slow down in week four' })))
  })
})
