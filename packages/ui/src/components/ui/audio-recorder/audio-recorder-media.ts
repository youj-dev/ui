/* AudioRecorder's plumbing: which container to record in, what a failed
 * microphone request means, and the loudness of an existing recording. The
 * level while recording comes from VoiceOrb's analyzer (createAudioMeter). */

/** Why the recorder can't record: shown with what to do about it. */
export type AudioRecorderError = 'denied' | 'no-device' | 'unsupported' | 'failed'

/* Opus in WebM is what Chrome, Edge and Firefox record; Safari records AAC in
 * MP4; Ogg is Firefox's older choice. */
const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg']

/** The app's choice when the browser can record it, else the first that it can; undefined lets the browser pick. */
export function pickMimeType(preferred?: string): string | undefined {
  const supported = (type: string) => typeof MediaRecorder.isTypeSupported !== 'function' || MediaRecorder.isTypeSupported(type)
  return [preferred, ...MIME_TYPES].find((type): type is string => !!type && supported(type))
}

export function canRecord() {
  return typeof window !== 'undefined' && typeof window.MediaRecorder === 'function'
}

export function microphone(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) return Promise.reject(new DOMException('No getUserMedia', 'NotSupportedError'))
  return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
}

/** A getUserMedia rejection as the recorder explains it. */
export function errorOf(error: unknown): AudioRecorderError {
  const name = error instanceof Error || error instanceof DOMException ? error.name : ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') return 'denied'
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') return 'no-device'
  if (name === 'NotSupportedError' || name === 'TypeError') return 'unsupported'
  return 'failed'
}

/** Watches the microphone permission where the browser reports it; calls back with true while it is denied. */
export function watchPermission(onDenied: (denied: boolean) => void): () => void {
  let status: PermissionStatus | null = null
  let alive = true
  const update = () => status && onDenied(status.state === 'denied')
  navigator.permissions
    ?.query({ name: 'microphone' as PermissionName })
    .then((s) => {
      if (!alive) return
      status = s
      update()
      s.addEventListener('change', update)
    })
    // Firefox and older Safari don't know the name: the request will tell.
    .catch(() => {})
  return () => {
    alive = false
    status?.removeEventListener('change', update)
  }
}

export interface DecodedAudio {
  blob: Blob | null
  duration: number
  peaks: number[]
}

const PEAKS = 240

/** Loads a recording the app passed and measures it: its length and `PEAKS` loudness samples. Null where it can't be read. */
export async function decodeRecording(source: Blob | string, signal: AbortSignal): Promise<DecodedAudio | null> {
  let blob: Blob
  try {
    blob = typeof source === 'string' ? await (await fetch(source, { signal })).blob() : source
  } catch {
    return null
  }
  const w = window as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
  const Ctx = w.AudioContext ?? w.webkitAudioContext
  if (!Ctx || signal.aborted) return { blob, duration: 0, peaks: [] } // youj-allow: seconds of audio, not a motion duration
  const context = new Ctx()
  try {
    const buffer = await context.decodeAudioData(await blob.arrayBuffer())
    const data = buffer.getChannelData(0)
    const size = Math.max(1, Math.floor(data.length / PEAKS))
    const raw = Array.from({ length: Math.min(PEAKS, data.length) }, (_, i) => {
      let peak = 0
      for (let j = i * size; j < (i + 1) * size && j < data.length; j++) peak = Math.max(peak, Math.abs(data[j] ?? 0))
      return peak
    })
    const loudest = Math.max(0.01, ...raw)
    return { blob, duration: buffer.duration, peaks: raw.map((p) => p / loudest) }
  } catch {
    return { blob, duration: 0, peaks: [] } // youj-allow: seconds of audio, not a motion duration
  } finally {
    void context.close()
  }
}
