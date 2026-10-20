import type { Meta, StoryObj } from '@storybook/react-vite'
import { VoiceCall } from './voice-call'

const meta: Meta<typeof VoiceCall> = {
  title: 'Blocks/App/Voice Call',
  component: VoiceCall,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'A call with a voice agent: its name and what it is doing, the call clock, a VoiceOrb, the caption line, mute, the speaker volume beside a meter of the voice, and End call, which leaves the call ended with how long it lasted and Call again.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof VoiceCall>

/** A support call about a double charge, playing on a loop. */
export const SupportCall: Story = { name: 'Support call', args: { demoMarker: false } }

/** Your microphone is off: the orb grays and stops hearing you, and the agent still speaks. */
export const Muted: Story = { args: { demoMarker: false, defaultMuted: true } }

/** After End call: the orb holds still, the clock says how long the call lasted, and Call again takes the controls' place. */
export const Ended: Story = {
  args: { demoMarker: false, ended: true },
  render: function Render(args) {
    // A call that lasted 4:12.
    return <VoiceCall {...args} startedAt={Date.now() - 252_000} />
  },
}

/** Fed by an app: a booking agent, mid-answer, at a fixed level. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    agent: { name: 'Juno', role: 'Harbor Hotel bookings' },
    agentState: 'speaking',
    level: 0.55,
    caption: 'I have a sea-view room on the 14th for two nights. Shall I hold it?',
    copy: { speaking: 'Answering' },
  },
}

/** The card on a page of its own. */
export const Standalone: Story = { args: { embedded: false, demoMarker: false } }

/** A clinic's voice agent booking a visit: its own agent, script and words, looping like the demo. */
export const AppointmentLine: Story = {
  name: 'Appointment line',
  args: {
    demoMarker: false,
    agent: { name: 'Nova', role: 'Cedar Park Family Clinic' },
    script: [
      { state: 'speaking', ms: 3600, caption: 'Cedar Park Family Clinic, this is Nova. Would you like to book a visit?' },
      { state: 'listening', ms: 3200, caption: 'Yes, a flu shot for me and my daughter.' },
      { state: 'thinking', ms: 1800 },
      { state: 'speaking', ms: 4400, caption: 'Dr. Patel has two openings on Thursday, Oct 23: 9:30 a.m. or 2:15 p.m. Which works?' },
      { state: 'listening', ms: 2600, caption: 'The 9:30, please.' },
      { state: 'speaking', ms: 3200, caption: 'Booked. You’ll get a text reminder the day before.' },
    ],
    copy: { idle: 'On the line', speaking: 'Speaking', hangUp: 'Hang up', callAgain: 'Call the clinic again' },
  },
}
