// Builds the youj sample animations into public/samples/.
//   node scripts/lottie/generate.mjs
// success-check and upload-progress ship as Lottie JSON; logo-sting ships as
// a .lottie (dotLottie v2 zip) to exercise both source formats.
import { writeFileSync } from 'node:fs'
import { deflateRawSync } from 'node:zlib'
import { logoSting, successCheck, uploadProgress } from './animations.mjs'

const OUT = new URL('../../public/samples/', import.meta.url)

export const builds = {
  'success-check.json': () => JSON.stringify(successCheck()),
  'upload-progress.json': () => JSON.stringify(uploadProgress()),
  'logo-sting.lottie': () =>
    zip({
      'manifest.json': JSON.stringify({ version: '2', generator: 'youj/scripts/lottie', animations: [{ id: 'logo-sting' }] }),
      'a/logo-sting.json': JSON.stringify(logoSting()),
    }),
}

// ---------------------------------------------------------------- zip
// Minimal deflate zip writer; enough for a dotLottie container.

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

export function zip(files) {
  const locals = []
  const centrals = []
  let offset = 0
  for (const [name, text] of Object.entries(files)) {
    const nameBuf = Buffer.from(name)
    const raw = Buffer.from(text)
    const data = deflateRawSync(raw)
    const crc = crc32(raw)
    const header = (sig, central) => {
      const b = Buffer.alloc(central ? 46 : 30)
      b.writeUInt32LE(sig, 0)
      let o = 4
      if (central) b.writeUInt16LE(20, o), (o += 2) // version made by
      b.writeUInt16LE(20, o) // version needed
      b.writeUInt16LE(0, o + 2) // flags
      b.writeUInt16LE(8, o + 4) // deflate
      b.writeUInt16LE(0, o + 6) // time
      b.writeUInt16LE(0x21, o + 8) // date: 1980-01-01, fixed for reproducible output
      b.writeUInt32LE(crc, o + 10)
      b.writeUInt32LE(data.length, o + 14)
      b.writeUInt32LE(raw.length, o + 18)
      b.writeUInt16LE(nameBuf.length, o + 22)
      if (central) b.writeUInt32LE(offset, 42)
      return b
    }
    const local = Buffer.concat([header(0x04034b50, false), nameBuf, data])
    centrals.push(Buffer.concat([header(0x02014b50, true), nameBuf]))
    locals.push(local)
    offset += local.length
  }
  const central = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(centrals.length, 8)
  end.writeUInt16LE(centrals.length, 10)
  end.writeUInt32LE(central.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, central, end])
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [name, build] of Object.entries(builds)) {
    const out = build()
    writeFileSync(new URL(name, OUT), out)
    console.log(`public/samples/${name}  ${(out.length / 1024).toFixed(1)} KB`)
  }
}
