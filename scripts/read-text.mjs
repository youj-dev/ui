// Reads a file that may not exist yet (a snapshot, a baseline, a generated file) without checking first:
// a check followed by a read can see the file vanish in between, a read that handles ENOENT cannot.
import { readFileSync } from 'node:fs'

/** The file's text, or null when it doesn't exist. Any other error (permissions, a directory) still throws. */
export function readTextIfExists(path) {
  try {
    return readFileSync(path, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}
