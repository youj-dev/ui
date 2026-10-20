import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useRef, useState } from 'react'
import { basalt, cinnabar, graphite, heather, meadow, seaglass, umber } from '@youj/core'
import { ThemeScope, YoujProvider } from '@youj/core/lib/youj/provider'
import { MicIcon } from '@youj/icons/components/youj/icons/mic'
import { Specimen } from '../../../stories/kit'
import { Button } from '../button'
import { VoiceOrb, type VoiceOrbBands, type VoiceOrbProps, type VoiceOrbState } from './voice-orb'

const meta: Meta<VoiceOrbProps> = {
  title: 'UI/Media/Voice Orb',
  component: VoiceOrb,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A voice agent’s presence: a clean, softly lit sphere in the theme’s accent, from a light tint to a deep shade of it. The sphere never changes shape; the sound shows as rings and as its size. `idle` breathes slowly, `listening` draws rings in from the edge and swells with the input, `thinking` turns a calm swirl inside, `speaking` sends pulses out with the output; `muted` grays it and stops it hearing. Every change springs over the deliberate token. Feed it a `level` you measure (0–1, with optional `bands`) or an `audio` source (a MediaStream, a media element or an AudioNode) that it analyzes itself. The halo and rings stay inside its box unless `spill`. Drawn in WebGL2, else Canvas2D, else a CSS disc; paused offscreen. It is an image named by its state, and state changes are announced politely. Reduced motion: a still sphere that only scales gently with the level, no rings.',
      },
    },
  },
  args: { state: 'idle', level: 0, size: 'lg', muted: false, spill: false },
  argTypes: {
    state: { control: 'inline-radio', options: ['idle', 'listening', 'thinking', 'speaking'] },
    level: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg', 'xl'] },
    audio: { control: false },
    bands: { control: false },
  },
}
export default meta
type Story = StoryObj<VoiceOrbProps>

/** A stand-in for speech: syllables a few times a second, louder phrases and pauses between them. No microphone needed. */
function useSimulatedVoice(active: boolean) {
  const [sample, setSample] = useState<{ level: number; bands: VoiceOrbBands }>({ level: 0, bands: { low: 0, mid: 0, high: 0 } })
  useEffect(() => {
    if (!active) {
      setSample({ level: 0, bands: { low: 0, mid: 0, high: 0 } })
      return
    }
    let raf = 0
    let last = 0
    const start = performance.now()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (now - last < 33) return
      last = now
      const t = (now - start) / 1000
      const phrase = Math.max(0, Math.sin(t * 0.9) * 0.6 + 0.55)
      const syllable = Math.abs(Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1))
      const level = Math.min(1, phrase * (0.25 + 0.75 * syllable) + Math.random() * 0.05)
      setSample({
        level,
        bands: { low: Math.min(1, level * (0.8 + 0.3 * Math.sin(t * 2.1))), mid: Math.min(1, level * (0.6 + 0.4 * syllable)), high: Math.min(1, level * 0.5 * Math.abs(Math.sin(t * 11))) },
      })
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [active])
  return sample
}

const stage = (children: React.ReactNode) => <div className="grid min-h-80 w-[36rem] max-w-[calc(100vw-2rem)] place-items-center rounded-2xl border border-line bg-canvas p-10">{children}</div>

/** Every prop on the controls: pick a state and drag the level. */
export const Playground: Story = {
  render: (args) => stage(<VoiceOrb {...args} />),
}

/** The four states side by side, with a simulated voice where the state listens or speaks. */
export const States: Story = {
  render: function Render() {
    const voice = useSimulatedVoice(true)
    const states: VoiceOrbState[] = ['idle', 'listening', 'thinking', 'speaking']
    return (
      <div className="grid grid-cols-2 gap-10 rounded-2xl border border-line bg-canvas p-10 sm:grid-cols-4">
        {states.map((state) => (
          <Specimen key={state} label={state} className="items-center">
            <VoiceOrb state={state} level={state === 'listening' || state === 'speaking' ? voice.level : 0} bands={state === 'speaking' ? voice.bands : undefined} />
          </Specimen>
        ))}
      </div>
    )
  },
}

/** Speaking with a simulated voice: pulses go out on each rise, and the sphere swells with the low band. With `spill`, the rings reach past the box. */
export const Speaking: Story = {
  render: function Render() {
    const voice = useSimulatedVoice(true)
    return stage(<VoiceOrb state="speaking" size="xl" spill level={voice.level} bands={voice.bands} />)
  },
}

/** Muted while listening: the sphere grays and stops hearing; it still shows the agent speaking. */
export const Muted: Story = {
  render: function Render() {
    const voice = useSimulatedVoice(true)
    return stage(
      <div className="flex items-center gap-12">
        <Specimen label="listening, muted" className="items-center">
          <VoiceOrb state="listening" muted level={voice.level} size="lg" />
        </Specimen>
        <Specimen label="speaking, muted" className="items-center">
          <VoiceOrb state="speaking" muted level={voice.level} bands={voice.bands} size="lg" />
        </Specimen>
      </div>,
    )
  },
}

const PRESETS = [basalt, graphite, cinnabar, seaglass, heather, meadow, umber]

/** The same speaking orb under seven presets, dark and light: every color comes from the theme’s accent. */
export const Palettes: Story = {
  render: function Render() {
    const voice = useSimulatedVoice(true)
    return (
      <div className="flex flex-col gap-4">
        {(['dark', 'light'] as const).map((mode) => (
          <div key={mode} className="flex flex-wrap gap-3">
            {PRESETS.map((preset) => (
              <ThemeScope key={preset.id} theme={preset} mode={mode}>
                <Specimen label={`${preset.id} · ${mode}`} className="items-center rounded-xl border border-line bg-canvas p-4 text-fg">
                  <VoiceOrb state="speaking" level={voice.level} bands={voice.bands} />
                </Specimen>
              </ThemeScope>
            ))}
          </div>
        ))}
      </div>
    )
  },
}

/** Your real microphone, analyzed in the browser (nothing leaves it). The orb listens once you allow access. */
export const WithMicrophone: Story = {
  name: 'With microphone',
  render: function Render() {
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [error, setError] = useState<string | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), [])
    const toggle = async () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        setStream(null)
        return
      }
      try {
        const next = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = next
        setStream(next)
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    }
    return stage(
      <div className="flex flex-col items-center gap-6">
        <VoiceOrb state={stream ? 'listening' : 'idle'} audio={stream} size="xl" />
        <Button variant={stream ? 'outline' : 'default'} onClick={toggle}>
          <MicIcon />
          {stream ? 'Stop microphone' : 'Use my microphone'}
        </Button>
        {error && <p className="text-ui-sm text-danger-text">{error}</p>}
      </div>,
    )
  },
}

/** sm, default, lg and xl. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-10 rounded-2xl border border-line bg-canvas p-10">
      {(['sm', 'default', 'lg', 'xl'] as const).map((size) => (
        <Specimen key={size} label={size} className="items-center">
          <VoiceOrb size={size} state="thinking" />
        </Specimen>
      ))}
    </div>
  ),
}

/** Reduced motion: a still sphere whose size alone follows the level. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  render: function Render() {
    const voice = useSimulatedVoice(true)
    return <YoujProvider reducedMotion="always">{stage(<VoiceOrb state="speaking" size="xl" level={voice.level} />)}</YoujProvider>
  },
}

/** The same orb on a light and a dark page: the inks come from each scope's theme. */
export const LightAndDark: Story = {
  name: 'Light and dark',
  render: function Render() {
    const voice = useSimulatedVoice(true)
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {(['light', 'dark'] as const).map((mode) => (
          <ThemeScope key={mode} mode={mode}>
            <div className="grid h-72 w-72 place-items-center rounded-2xl border border-line bg-canvas text-fg">
              <VoiceOrb state="speaking" size="lg" level={voice.level} bands={voice.bands} />
            </div>
          </ThemeScope>
        ))}
      </div>
    )
  },
}
