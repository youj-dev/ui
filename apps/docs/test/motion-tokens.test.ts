// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { motionPersonalities, type MotionPersonality } from '@youj/core/lib/youj/tokens'

/* The Motion tokens page writes its tables as Markdown, so search, llms.txt
 * and the MCP index read them as text. This holds every row to the token
 * source: a token re-valued in tokens.ts fails here until the page says so. */

const page = readFileSync(fileURLToPath(new URL('../content/docs/motion/tokens.mdx', import.meta.url)), 'utf8')
const order: MotionPersonality[] = ['precise', 'calm', 'lively']
const row = (token: string, cell: (p: MotionPersonality) => string) => `| \`${token}\` | ${order.map(cell).join(' | ')} |`
const { durations, easings, springs, staggers } = motionPersonalities.precise

describe('the Motion tokens page', () => {
  it('lists every duration, per personality', () => {
    for (const token of Object.keys(durations) as (keyof typeof durations)[])
      expect(page).toContain(row(token, (p) => `${motionPersonalities[p].durations[token]}ms`))
  })

  it('lists every easing curve, per personality', () => {
    for (const token of Object.keys(easings) as (keyof typeof easings)[])
      expect(page).toContain(row(token, (p) => `\`cubic-bezier(${motionPersonalities[p].easings[token].join(', ')})\``))
  })

  it('lists every spring, per personality', () => {
    for (const token of Object.keys(springs) as (keyof typeof springs)[])
      expect(page).toContain(
        row(token, (p) => {
          const { visualDuration, bounce } = motionPersonalities[p].springs[token]
          return `${visualDuration}s, bounce ${bounce}`
        }),
      )
  })

  it('lists every stagger step, per personality', () => {
    for (const token of Object.keys(staggers) as (keyof typeof staggers)[])
      expect(page).toContain(row(token, (p) => `${motionPersonalities[p].staggers[token]}ms`))
  })
})
