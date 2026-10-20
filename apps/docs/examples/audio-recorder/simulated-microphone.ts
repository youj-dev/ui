/* A stand-in microphone for the docs: a soft hummed voice synthesized in
 * Web Audio (two sine partials, a gentle low-pass, syllables gliding between
 * pentatonic notes, eased so nothing clicks), handed over as a real
 * MediaStream so the recorder records and measures it, and the take plays the
 * same hum back. In an app, leave `getStream` out: the recorder asks for the
 * microphone itself. */

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
