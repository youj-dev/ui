import { useContext, type ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type SoundCue } from '@youj/core'
import { SoundCueContext } from '@youj/core/internal'
import { YoujProvider, type ReducedMotionSetting } from '@youj/core/lib/youj/provider'
import { DEFAULT_SOUND_SETTINGS, SoundEventFilter, SoundSettings, type SoundSettingsValue } from './sound-settings'
import { DEFAULT_COPY } from './sound-settings/data'

/* A recorder stands in for the app's YoujProvider on the cue bus: the block
 * never imports @youj/sound, so what it emits is what's tested. */
const heard = vi.fn<(cue: SoundCue, reduced: boolean) => void>()
beforeEach(() => heard.mockClear())
/** jsdom hides Base UI's thumb input, so its name is read from aria-label. */
const volume = () => screen.getAllByRole('slider', { hidden: true }).find((el) => el.getAttribute('aria-label') === 'Volume')!
const cues = () => heard.mock.calls.map(([cue]) => cue)

function On({ children, reducedMotion = 'never' }: { children: ReactNode; reducedMotion?: ReducedMotionSetting }) {
  return (
    <YoujProvider reducedMotion={reducedMotion}>
      <SoundCueContext.Provider value={heard}>{children}</SoundCueContext.Provider>
    </YoujProvider>
  )
}

describe('sound settings block: your copy', () => {
  test('copy renames the page, the packs and the events; rest props and headingLevel reach the root', async () => {
    const user = userEvent.setup()
    render(
      <SoundSettings
        embedded
        headingLevel={1}
        data-testid="root"
        copy={{
          title: 'Klang',
          volume: 'Lautstärke',
          volumeValue: (n) => `${n} Prozent`,
          play: 'Abspielen',
          playEvent: (name) => `${name} abspielen`,
          packs: { ...DEFAULT_COPY.packs, glass: { name: 'Glas', detail: 'Hell und kurz' } },
          events: { ...DEFAULT_COPY.events, error: { name: 'Fehler', detail: 'Etwas braucht deine Aufmerksamkeit' } },
        }}
      />,
      { wrapper: On },
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Klang' })).toBeInTheDocument()
    expect(screen.getByTestId('root')).toHaveAttribute('aria-labelledby')
    expect(volume()).toBeUndefined()
    expect(screen.getAllByRole('slider', { hidden: true }).find((el) => el.getAttribute('aria-label') === 'Lautstärke')).toHaveAttribute('aria-valuetext', '50 Prozent')
    expect(screen.getByRole('radio', { name: /Glas/ })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Fehler abspielen' }))
    expect(cues()).toEqual(['error'])
  })
})

describe('sound settings block', () => {
  test('names the page and its three sections', () => {
    render(<SoundSettings />, { wrapper: On })
    expect(screen.getByRole('region', { name: 'Sound' })).toBeInTheDocument()
    for (const name of ['Interface sounds', 'Sound pack', 'Play a sound for']) expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Sound pack' })).toBeInTheDocument()
    expect(volume()).toHaveAttribute('aria-valuetext', '50%')
  })

  test('nothing plays on its own, nor from any control but Play', async () => {
    const user = userEvent.setup()
    render(<SoundSettings />, { wrapper: On })
    await user.click(screen.getByRole('radio', { name: /Soft wood/ }))
    await user.click(screen.getByRole('switch', { name: 'Errors' }))
    await user.click(screen.getByRole('switch', { name: 'Keep sounds with reduced motion' }))
    fireEvent.keyDown(volume(), { key: 'ArrowRight' })
    expect(heard).not.toHaveBeenCalled()
  })

  test('each Play button emits its own cue, once per press', async () => {
    const user = userEvent.setup()
    render(<SoundSettings />, { wrapper: On })
    await user.click(screen.getByRole('button', { name: 'Play the success sound' }))
    await user.click(screen.getByRole('button', { name: 'Play the switches sound' }))
    await user.click(screen.getByRole('button', { name: 'Play the notifications sound' }))
    expect(cues()).toEqual(['success', 'toggleOn', 'notify'])
  })

  test('scrubbing the sound check plays each event as the playhead crosses into it, skipping the ones switched off', () => {
    const value: SoundSettingsValue = { ...DEFAULT_SOUND_SETTINGS, events: { ...DEFAULT_SOUND_SETTINGS.events, success: false } }
    render(<SoundSettings defaultValue={value} />, { wrapper: On })
    const strip = screen.getByRole('slider', { name: 'Sound check' })
    for (let i = 0; i < 4; i++) fireEvent.keyDown(strip, { key: 'ArrowRight' })
    expect(cues()).toEqual(['toggleOn', 'error', 'notify'])
  })

  test('switching sounds off reports it and makes the page inert', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<SoundSettings onValueChange={onValueChange} />, { wrapper: On })
    await user.click(screen.getByRole('switch', { name: 'Interface sounds' }))
    expect(onValueChange).toHaveBeenLastCalledWith({ ...DEFAULT_SOUND_SETTINGS, enabled: false })
    expect(screen.getByText('Sounds are off. Nothing in the app will make a sound.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play the taps sound' })).toBeDisabled()
    expect(screen.getByRole('switch', { name: 'Taps' })).toHaveAttribute('aria-disabled', 'true')
  })

  test('controlled, it reports each change and Reset brings back the defaults', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const value: SoundSettingsValue = { ...DEFAULT_SOUND_SETTINGS, pack: 'felt' }
    render(<SoundSettings value={value} onValueChange={onValueChange} />, { wrapper: On })
    await user.click(screen.getByRole('switch', { name: 'Taps' }))
    expect(onValueChange).toHaveBeenLastCalledWith({ ...value, events: { ...value.events, tap: false } })
    await user.click(screen.getByRole('button', { name: /Reset/ }))
    expect(onValueChange).toHaveBeenLastCalledWith(DEFAULT_SOUND_SETTINGS)
  })

  test('under reduced motion it says why sounds are quiet, until they are kept', async () => {
    const user = userEvent.setup()
    render(
      <On reducedMotion="always">
        <SoundSettings />
      </On>,
    )
    expect(screen.getByText('Quiet while motion is reduced')).toBeInTheDocument()
    await user.click(screen.getByRole('switch', { name: 'Keep sounds with reduced motion' }))
    // The note keeps its room, hidden, so the card doesn't resize.
    expect(screen.getByText('Quiet while motion is reduced').closest('[data-slot=alert]')).toHaveAttribute('aria-hidden', 'true')
  })

  test('without sound above, it says the previews are silent', () => {
    const { rerender } = render(<SoundSettings />)
    expect(screen.getByText(/no sound is set up/)).toBeInTheDocument()
    rerender(
      <On>
        <SoundSettings />
      </On>,
    )
    expect(screen.queryByText(/no sound is set up/)).not.toBeInTheDocument()
  })

  test('embedded, it is a section named by an h2', () => {
    render(<SoundSettings embedded />, { wrapper: On })
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Sound' })).toBeInTheDocument()
  })
})

describe('SoundEventFilter', () => {
  function Emit({ cue }: { cue: SoundCue }) {
    const sink = useContext(SoundCueContext)
    return <button onClick={() => sink?.(cue, false)}>{cue}</button>
  }

  test('drops the cues of events switched off and passes the rest', async () => {
    const user = userEvent.setup()
    render(
      <SoundCueContext.Provider value={heard}>
        <SoundEventFilter events={{ ...DEFAULT_SOUND_SETTINGS.events, toggle: false, tap: false }}>
          {(['tap', 'select', 'toggleOff', 'success', 'open'] as const).map((cue) => (
            <Emit key={cue} cue={cue} />
          ))}
        </SoundEventFilter>
      </SoundCueContext.Provider>,
    )
    for (const name of ['tap', 'select', 'toggleOff', 'success', 'open']) await user.click(screen.getByRole('button', { name }))
    expect(cues()).toEqual(['success', 'open'])
  })

  test('without a provider above, it adds no sink of its own', () => {
    let sink: unknown = 'unset'
    function Read() {
      sink = useContext(SoundCueContext)
      return null
    }
    render(
      <SoundEventFilter events={DEFAULT_SOUND_SETTINGS.events}>
        <Read />
      </SoundEventFilter>,
    )
    expect(sink).toBeNull()
  })
})
