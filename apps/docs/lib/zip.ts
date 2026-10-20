/* A .zip built in the browser, for the showcase's and the Sound builder's
 * downloads: text files, and bytes (audio). Stored, not deflated: the files
 * are small (audio doesn't deflate anyway), and the archive stays a few dozen
 * lines of code with no dependency. Paths are kept as given (forward
 * slashes), dated 1 January 2026. */

export interface ZipEntry {
  path: string
  content: string | Uint8Array
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

// MS-DOS date and time: 2026-01-01 00:00.
const DOS_TIME = 0
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1

export function zip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder()
  const local: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0

  for (const entry of entries) {
    const name = encoder.encode(entry.path)
    const data = typeof entry.content === 'string' ? encoder.encode(entry.content) : entry.content
    const crc = crc32(data)

    const header = new DataView(new ArrayBuffer(30))
    header.setUint32(0, 0x04034b50, true) // local file header
    header.setUint16(4, 20, true) // version needed
    header.setUint16(6, 0x0800, true) // UTF-8 names
    header.setUint16(8, 0, true) // stored
    header.setUint16(10, DOS_TIME, true)
    header.setUint16(12, DOS_DATE, true)
    header.setUint32(14, crc, true)
    header.setUint32(18, data.length, true)
    header.setUint32(22, data.length, true)
    header.setUint16(26, name.length, true)
    local.push(new Uint8Array(header.buffer), name, data)

    const record = new DataView(new ArrayBuffer(46))
    record.setUint32(0, 0x02014b50, true) // central directory header
    record.setUint16(4, 20, true) // made by
    record.setUint16(6, 20, true) // version needed
    record.setUint16(8, 0x0800, true)
    record.setUint16(10, 0, true)
    record.setUint16(12, DOS_TIME, true)
    record.setUint16(14, DOS_DATE, true)
    record.setUint32(16, crc, true)
    record.setUint32(20, data.length, true)
    record.setUint32(24, data.length, true)
    record.setUint16(28, name.length, true)
    record.setUint32(42, offset, true)
    central.push(new Uint8Array(record.buffer), name)

    offset += 30 + name.length + data.length
  }

  const size = central.reduce((n, part) => n + part.length, 0)
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true) // end of central directory
  end.setUint16(8, entries.length, true)
  end.setUint16(10, entries.length, true)
  end.setUint32(12, size, true)
  end.setUint32(16, offset, true)

  const parts = [...local, ...central, new Uint8Array(end.buffer)]
  const out = new Uint8Array(parts.reduce((n, part) => n + part.length, 0))
  let at = 0
  for (const part of parts) {
    out.set(part, at)
    at += part.length
  }
  return out
}
