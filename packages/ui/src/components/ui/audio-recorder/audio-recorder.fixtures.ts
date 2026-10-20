/* A microphone for stories, with no microphone and no audio file: a soft
 * hummed voice synthesized in Web Audio. Two sine partials through a gentle
 * low-pass, a slow vibrato, syllables that glide between the notes of a
 * pentatonic scale, phrases with pauses between them. Every change of pitch
 * and loudness eases (setTargetAtTime), so nothing clicks. Live, it is a real
 * MediaStream that MediaRecorder records and the analyzer hears, so the
 * recorded take plays back the same hum; offline, it renders a WAV for "an
 * existing recording". */

/** A major pentatonic, E3 to F♯4: no note clashes with another. */
const NOTES = [164.81, 220, 246.94, 277.18, 329.63, 369.99]

/** Deterministic, so a story looks the same every time. */
function random(seed: number) {
  let x = seed
  return () => {
    x = (x * 16807) % 2147483647
    return (x - 1) / 2147483646
  }
}

function hum(context: BaseAudioContext, out: AudioNode, seed = 7) {
  const now = context.currentTime
  const tone = context.createOscillator()
  const overtone = context.createOscillator()
  tone.type = 'sine'
  overtone.type = 'sine'
  const overtoneLevel = context.createGain()
  overtoneLevel.gain.value = 0.16
  const vibrato = context.createOscillator()
  vibrato.frequency.value = 4.8
  const depth = context.createGain()
  depth.gain.value = 2.5
  const depth2 = context.createGain()
  depth2.gain.value = 5
  vibrato.connect(depth).connect(tone.frequency)
  vibrato.connect(depth2).connect(overtone.frequency)
  const soft = context.createBiquadFilter()
  soft.type = 'lowpass'
  soft.frequency.value = 1400
  soft.Q.value = 0.4
  const amp = context.createGain()
  amp.gain.value = 0
  tone.connect(soft)
  overtone.connect(overtoneLevel).connect(soft)
  soft.connect(amp).connect(out)
  tone.frequency.value = NOTES[0]!
  overtone.frequency.value = NOTES[0]! * 2
  for (const osc of [tone, overtone, vibrato]) osc.start(now)

  const rand = random(seed)
  let t = now + 0.1
  return {
    /** Schedules phrases until `until` (context seconds). */
    schedule(until: number) {
      while (t < until) {
        const syllables = 2 + Math.floor(rand() * 4)
        for (let i = 0; i < syllables; i++) {
          const note = NOTES[Math.floor(rand() * NOTES.length)]!
          const length = 0.2 + rand() * 0.22
          const level = 0.1 + rand() * 0.14
          tone.frequency.setTargetAtTime(note, t, 0.05)
          overtone.frequency.setTargetAtTime(note * 2, t, 0.05)
          amp.gain.setTargetAtTime(level, t, 0.035)
          amp.gain.setTargetAtTime(level * 0.35, t + length * 0.65, 0.05)
          t += length
        }
        amp.gain.setTargetAtTime(0, t, 0.07)
        t += 0.35 + rand() * 0.6
      }
    },
    stop() {
      const at = context.currentTime
      amp.gain.cancelScheduledValues(at)
      amp.gain.setTargetAtTime(0, at, 0.03)
      for (const osc of [tone, overtone, vibrato]) osc.stop(at + 0.3)
    },
  }
}

/** A `getStream` that hums instead of opening the microphone. */
export function simulatedMicrophone(): () => Promise<MediaStream> {
  return async () => {
    const context = new AudioContext()
    const out = context.createMediaStreamDestination()
    const voice = hum(context, out)
    voice.schedule(context.currentTime + 1)
    const ahead = setInterval(() => voice.schedule(context.currentTime + 1), 250)
    for (const track of out.stream.getTracks()) {
      const stop = track.stop.bind(track)
      track.stop = () => {
        stop()
        clearInterval(ahead)
        voice.stop()
        setTimeout(() => void context.close(), 400)
      }
    }
    return out.stream
  }
}

/** A refused microphone, as the browser reports it. */
export const deniedMicrophone = () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError'))

/** The same hum, `seconds` long, rendered offline as a 16-bit mono WAV. */
export async function sampleRecording(seconds = 9, rate = 22050): Promise<Blob> {
  const context = new OfflineAudioContext(1, seconds * rate, rate)
  const voice = hum(context, context.destination, 11)
  voice.schedule(seconds - 0.6)
  const samples = (await context.startRendering()).getChannelData(0)
  const data = new DataView(new ArrayBuffer(44 + samples.length * 2))
  const text = (at: number, s: string) => [...s].forEach((c, i) => data.setUint8(at + i, c.charCodeAt(0)))
  text(0, 'RIFF')
  data.setUint32(4, 36 + samples.length * 2, true)
  text(8, 'WAVEfmt ')
  data.setUint32(16, 16, true)
  data.setUint16(20, 1, true)
  data.setUint16(22, 1, true)
  data.setUint32(24, rate, true)
  data.setUint32(28, rate * 2, true)
  data.setUint16(32, 2, true)
  data.setUint16(34, 16, true)
  text(36, 'data')
  data.setUint32(40, samples.length * 2, true)
  samples.forEach((v, i) => data.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 32767, true))
  return new Blob([data.buffer], { type: 'audio/wav' })
}
