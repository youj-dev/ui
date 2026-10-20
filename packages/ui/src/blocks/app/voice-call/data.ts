import type { VoiceOrbState } from '../../../components/ui/voice-orb'

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behavior`)
  }
  return wait(ms)
}

/** Who the person is talking to. */
export interface VoiceCallAgent {
  name: string
  /** A line under the name: the team, the product. */
  role?: string
}

/** One turn of the demo conversation: what the agent is doing, for how long, and the caption. */
export interface VoiceCallTurn {
  state: VoiceOrbState
  ms: number
  caption?: string
}

export const AGENT: VoiceCallAgent = { name: 'Ada', role: 'Northwind support' }

/** A support call about a double charge, on a loop. */
export const SCRIPT: VoiceCallTurn[] = [
  { state: 'speaking', ms: 3600, caption: 'Hi, this is Ada from Northwind. How can I help?' },
  { state: 'listening', ms: 3400, caption: 'I was charged twice for my October invoice.' },
  { state: 'thinking', ms: 1800 },
  { state: 'speaking', ms: 4200, caption: 'I can see both charges. I’ve refunded the second one; it’ll show in three to five days.' },
  { state: 'listening', ms: 2600, caption: 'Great, thank you. That’s all.' },
  { state: 'speaking', ms: 3000, caption: 'Happy to help. Anything else before you go?' },
]

export const DEFAULT_COPY = {
  idle: 'Connected',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
  muted: 'You’re muted',
  ended: 'Call ended',
  callTime: 'Call time',
  lasted: (time: string) => `Lasted ${time}`,
  mute: 'Mute',
  unmute: 'Unmute',
  hangUp: 'End call',
  ending: 'Ending…',
  callAgain: 'Call again',
  calling: 'Calling…',
  volume: 'Speaker volume',
  volumeValue: (percent: number) => `${percent}%`,
  outputLevel: 'Voice level',
  captions: 'Captions',
  demoData: 'Demo data',
}

export type VoiceCallCopy = typeof DEFAULT_COPY
