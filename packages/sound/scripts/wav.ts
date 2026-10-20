/* WAV in and out: 32-bit float, mono, for the render's masters and for
 * reading back what ffmpeg decodes. */

import { SR, type Signal } from './dsp.ts'

export function encodeWav(sig: Signal, sampleRate = SR): Buffer {
  const data = Buffer.alloc(sig.length * 4)
  sig.forEach((x, i) => data.writeFloatLE(x, i * 4))
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(3, 20) // IEEE float
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(sampleRate * 4, 28)
  header.writeUInt16LE(4, 32)
  header.writeUInt16LE(32, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

/** Reads a mono or stereo (first channel) WAV of 16-bit PCM or 32-bit float. */
export function decodeWav(file: Buffer): { sig: Signal; sampleRate: number } {
  let offset = 12
  let format = 1
  let channels = 1
  let sampleRate = SR
  let bits = 16
  while (offset + 8 <= file.length) {
    const id = file.toString('ascii', offset, offset + 4)
    const size = file.readUInt32LE(offset + 4)
    const body = offset + 8
    if (id === 'fmt ') {
      format = file.readUInt16LE(body)
      channels = file.readUInt16LE(body + 2)
      sampleRate = file.readUInt32LE(body + 4)
      bits = file.readUInt16LE(body + 14)
      if (format === 0xfffe) format = file.readUInt16LE(body + 24)
    } else if (id === 'data') {
      const frame = (bits / 8) * channels
      const count = Math.floor(Math.min(size, file.length - body) / frame)
      const sig = new Float64Array(count)
      for (let i = 0; i < count; i++) {
        const at = body + i * frame
        sig[i] = format === 3 ? file.readFloatLE(at) : file.readInt16LE(at) / 32768
      }
      return { sig, sampleRate }
    }
    offset = body + size + (size % 2)
  }
  throw new Error('no data chunk')
}
