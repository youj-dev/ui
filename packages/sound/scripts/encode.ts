/* Encoding through ffmpeg's LAME: MP3, because every browser's
 * decodeAudioData reads it (Opus and AAC each miss one engine). Mono, 48 kHz,
 * no ID3 tag, no Xing frame and bit-exact flags, so the bytes depend only on
 * the samples and the encoder.
 *
 * Decoders disagree about the encoder's lead-in: Chromium and Firefox keep
 * all 1105 samples of it (and would trim it from a Xing/LAME tag), WebKit
 * keeps 576 whatever the tag says. So the files carry no tag (288 bytes
 * saved each) and the player finds each sound's first sample itself. */

import { spawnSync } from 'node:child_process'
import { SR, type Signal } from './dsp.ts'

function ffmpeg(args: string[], input: Buffer): Buffer {
  const run = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], { input, maxBuffer: 64 * 1024 * 1024 })
  if (run.error) throw new Error(`ffmpeg isn't available (${run.error.message}). Install it to render the sounds: brew install ffmpeg`)
  if (run.status !== 0) throw new Error(`ffmpeg failed: ${run.stderr.toString()}`)
  return run.stdout
}

const f32 = (sig: Signal) => {
  const out = Buffer.alloc(sig.length * 4)
  sig.forEach((x, i) => out.writeFloatLE(x, i * 4))
  return out
}

export interface Mp3Options {
  /** Constant bitrate, kbps. */
  kbps: number
}

export function toMp3(sig: Signal, { kbps }: Mp3Options): Buffer {
  return ffmpeg(
    ['-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', 'pipe:0', '-c:a', 'libmp3lame', '-b:a', `${kbps}k`, '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact', '-id3v2_version', '0', '-write_xing', '0', '-f', 'mp3', 'pipe:1'],
    f32(sig),
  )
}

/** Any audio file ffmpeg reads (MP3, FLAC, WAV), decoded to 48 kHz mono samples. */
export function decode(file: Buffer, format?: 'mp3'): Signal {
  // A tiny untagged MP3 can be too short for ffmpeg's format probe, even
  // though its frames are valid. The render already knows what it encoded;
  // legacy FLAC and other inputs still use automatic detection.
  const raw = ffmpeg([...(format ? ['-f', format] : []), '-i', 'pipe:0', '-f', 'f32le', '-ar', String(SR), '-ac', '1', 'pipe:1'], file)
  const out = new Float64Array(raw.length / 4)
  for (let i = 0; i < out.length; i++) out[i] = raw.readFloatLE(i * 4)
  return out
}

/** Lossless 16-bit, for the masters kept in the repository, without the 8 KB of padding ffmpeg reserves for tags. */
export function toFlac(sig: Signal): Buffer {
  const file = ffmpeg(['-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', 'pipe:0', '-c:a', 'flac', '-sample_fmt', 's16', '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact', '-f', 'flac', 'pipe:1'], f32(sig))
  // "fLaC", then metadata blocks (1 byte: last flag + type, 3 bytes: length), then the frames.
  const blocks: Buffer[] = []
  let at = 4
  for (let last = false; !last; ) {
    last = (file[at]! & 0x80) !== 0
    const length = file.readUIntBE(at + 1, 3)
    if ((file[at]! & 0x7f) !== 1) blocks.push(Buffer.from(file.subarray(at, at + 4 + length)))
    at += 4 + length
  }
  blocks.forEach((block, i) => (block[0] = (block[0]! & 0x7f) | (i === blocks.length - 1 ? 0x80 : 0)))
  return Buffer.concat([file.subarray(0, 4), ...blocks, file.subarray(at)])
}
