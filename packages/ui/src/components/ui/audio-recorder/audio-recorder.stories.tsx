import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useMemo, useState } from 'react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AudioRecorder, type AudioRecorderProps } from './audio-recorder'
import { deniedMicrophone, sampleRecording, simulatedMicrophone } from './audio-recorder.fixtures'

const meta: Meta<AudioRecorderProps> = {
  title: 'UI/Media/Audio Recorder',
  component: AudioRecorder,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Record a voice note or an audio clip, listen back, then keep it or not. Idle shows the record button; the first press asks for the microphone, and a refusal, a missing device or a browser that can’t record is explained in place. While recording, the sound scrolls past as bars from the microphone’s level, a timer counts up, and pause and stop sit beside it; `maxDuration` adds a ring that runs down and stops the take at the limit. A stopped take plays back on a waveform scrubber, with its length, discard (with Undo) and Save, which awaits `onRecordingComplete` with the Blob (spinner, then a check and “Saved”) and leaves the take read-only: playback only, with a quiet Saved mark. One size in every state. It records with MediaRecorder in `mimeType` or the first container the browser supports, releases the microphone on stop and unmount, and never plays by itself. These stories use a simulated microphone (`getStream`, a soft synthesized hum); “Real microphone” uses yours. Reduced motion: a still level meter instead of the scrolling bars.',
      },
    },
  },
  args: { size: 'default', disabled: false, sound: true },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default'] },
    maxDuration: { control: { type: 'number', min: 5, step: 5 } },
    value: { control: false },
    getStream: { control: false },
  },
}
export default meta
type Story = StoryObj<AudioRecorderProps>

const stage = (children: React.ReactNode) => <div className="flex w-[28rem] max-w-[calc(100vw-2rem)] flex-col gap-3">{children}</div>

/** Every prop on the controls, on a simulated microphone. */
export const Playground: Story = {
  render: function Render(args) {
    const mic = useMemo(() => simulatedMicrophone(), [])
    return stage(<AudioRecorder {...args} getStream={mic} />)
  },
}

/** A message composer's voice note: record, listen, then Save. The upload takes a moment; then the note is kept, read-only. */
export const VoiceNote: Story = {
  name: 'Voice note',
  render: function Render(args) {
    const mic = useMemo(() => simulatedMicrophone(), [])
    return stage(<AudioRecorder {...args} getStream={mic} label="Voice note" onRecordingComplete={() => new Promise((done) => setTimeout(done, 900))} />)
  },
}

/** `maxDuration={15}`: the ring around stop runs down and turns red for the last ten seconds; the take stops at the limit. */
export const WithTimeLimit: Story = {
  name: 'With time limit',
  args: { maxDuration: 15 },
  render: function Render(args) {
    const mic = useMemo(() => simulatedMicrophone(), [])
    return stage(<AudioRecorder {...args} getStream={mic} />)
  },
}

/** The browser refused the microphone: the caption says how to allow it, and the button tries again. */
export const PermissionDenied: Story = {
  name: 'Permission denied',
  render: (args) => stage(<AudioRecorder {...args} getStream={deniedMicrophone} />),
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLButtonElement>('[data-slot=audio-recorder-primary]')?.click()
  },
}

/** `value`: a recording the app already has opens saved, for playback only. */
export const ExistingRecording: Story = {
  name: 'Existing recording',
  render: function Render(args) {
    const [value, setValue] = useState<Blob | null>(null)
    useEffect(() => {
      void sampleRecording().then(setValue)
    }, [])
    return stage(<AudioRecorder {...args} value={value} />)
  },
}

/** Reduced motion: a still level meter lights up with the sound instead of the scrolling bars; the dot holds still. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  render: function Render(args) {
    const mic = useMemo(() => simulatedMicrophone(), [])
    return <YoujProvider reducedMotion="always">{stage(<AudioRecorder {...args} getStream={mic} />)}</YoujProvider>
  },
}

/** Your own microphone, through getUserMedia: the browser asks first. */
export const RealMicrophone: Story = {
  name: 'Real microphone',
  render: (args) => stage(<AudioRecorder {...args} />),
}
