// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

/* What the kit ships keeps growing, so a number in the copy is wrong by the
 * next release. Say "icons", not "511 icons". Counts that are fixed facts
 * (two styles, three personalities) are words, and a count below ten isn't matched. */

const content = join(fileURLToPath(new URL('..', import.meta.url)), 'content/docs')

const growing = /(?<!\bof )\b\d{2,}[\d,]*\+? (?:UI |motion |animated |static |built-in )?(?:icons|components|blocks|loaders|scenes|illustrations|miniatures|backdrops|locales|languages|sounds|screens|sections|widgets)\b/i
const inAll = /\b(?:in|across) all \d+ (?:locales|languages)\b/i

describe('copy', () => {
  it('states no count of what grows', () => {
    const hits = (readdirSync(content, { recursive: true }) as string[])
      .filter((f) => f.endsWith('.mdx'))
      .flatMap((f) =>
        readFileSync(join(content, f), 'utf8')
          .split('\n')
          .flatMap((line, i) => (growing.test(line) || inAll.test(line) ? [`${relative(content, join(content, f))}:${i + 1}: ${line.trim().slice(0, 100)}`] : [])),
      )
    expect(hits).toEqual([])
  })
})
