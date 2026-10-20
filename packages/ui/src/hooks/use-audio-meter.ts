/* The ears VoiceOrb and AudioRecorder share: a Web Audio AnalyserNode on a
 * source, created only when asked for and removed with dispose(). It never plays
 * anything of its own. A stream's context is ours and silent (nothing reaches
 * the speakers), so it resumes at once; an app node's context is the app's and
 * is left as it is; a media element's sound runs through the context once it
 * is analyzed, so that context resumes when the element plays. */

/** A microphone or call stream, an <audio>/<video> element, or a node in the app's own audio graph. */
export type AudioSource = MediaStream | HTMLMediaElement | AudioNode

export interface AudioReading {
  level: number
  low: number
  mid: number
  high: number
}

export interface AudioMeter {
  /** Fills `out` from the analyzer; false while the context isn't running. */
  read(out: AudioReading): boolean
  dispose(): void
}

type AudioContextClass = typeof AudioContext

function contextClass(): AudioContextClass | undefined {
  const w = window as { AudioContext?: AudioContextClass; webkitAudioContext?: AudioContextClass }
  return w.AudioContext ?? w.webkitAudioContext
}

/* An element can be wired into Web Audio once in its life, and from then on its
 * sound only reaches the speakers through that context, so the source and its
 * context are kept per element and stay connected after the component unmounts. */
const elements = new WeakMap<HTMLMediaElement, { context: AudioContext; source: MediaElementAudioSourceNode }>()

function elementSource(element: HTMLMediaElement, Ctx: AudioContextClass) {
  let entry = elements.get(element)
  if (!entry) {
    const context = new Ctx()
    const source = context.createMediaElementSource(element)
    source.connect(context.destination)
    element.addEventListener('play', () => void context.resume())
    if (!element.paused) void context.resume()
    entry = { context, source }
    elements.set(element, entry)
  }
  return entry
}

const isStream = (a: AudioSource): a is MediaStream => typeof MediaStream !== 'undefined' && a instanceof MediaStream
const isElement = (a: AudioSource): a is HTMLMediaElement => typeof HTMLMediaElement !== 'undefined' && a instanceof HTMLMediaElement

/** Null where Web Audio is missing. */
export function createAudioMeter(audio: AudioSource): AudioMeter | null {
  const Ctx = contextClass()
  let context: AudioContext | BaseAudioContext
  let input: AudioNode
  let release: () => void
  if (isElement(audio)) {
    if (!Ctx) return null
    const entry = elementSource(audio, Ctx)
    context = entry.context
    input = entry.source
    release = () => input.disconnect(analyzer)
  } else if (isStream(audio)) {
    if (!Ctx) return null
    const own = new Ctx()
    context = own
    input = own.createMediaStreamSource(audio)
    // Nothing reaches the speakers from this context, so resuming it is silent.
    void own.resume()
    // The stream's tracks are the app's: closing our context leaves them running.
    release = () => {
      input.disconnect()
      void own.close()
    }
  } else {
    context = audio.context
    input = audio
    release = () => input.disconnect(analyzer)
  }

  const analyzer = context.createAnalyser()
  analyzer.fftSize = 1024
  analyzer.smoothingTimeConstant = 0.55
  analyzer.minDecibels = -85
  analyzer.maxDecibels = -20
  input.connect(analyzer)

  const wave = new Float32Array(analyzer.fftSize)
  const spectrum = new Uint8Array(analyzer.frequencyBinCount)
  const hz = context.sampleRate / analyzer.fftSize
  const bin = (f: number) => Math.min(spectrum.length, Math.max(1, Math.round(f / hz)))
  const bands = [
    [bin(60), bin(250)],
    [bin(250), bin(2000)],
    [bin(2000), bin(6000)],
  ] as const
  const average = ([from, to]: readonly [number, number]) => {
    let sum = 0
    for (let i = from; i < to; i++) sum += spectrum[i] ?? 0
    return to > from ? sum / (to - from) / 255 : 0
  }

  return {
    read(out) {
      if (context.state !== 'running') return false
      analyzer.getFloatTimeDomainData(wave)
      let power = 0
      for (const v of wave) power += v * v
      const rms = Math.sqrt(power / wave.length)
      // −50 dBFS (a quiet room) to −10 dBFS (close, loud speech) maps to 0–1.
      out.level = Math.min(1, Math.max(0, (20 * Math.log10(rms + 1e-9) + 50) / 40))
      analyzer.getByteFrequencyData(spectrum)
      out.low = average(bands[0])
      out.mid = average(bands[1])
      out.high = average(bands[2])
      return true
    },
    dispose() {
      release()
      analyzer.disconnect()
    },
  }
}
