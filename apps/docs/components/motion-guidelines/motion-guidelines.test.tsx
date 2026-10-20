import { render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { YoujProvider, ThemeScope } from '@youj/core'
import { durations, easings, motionPersonalities, springs, staggers } from '@youj/core/lib/youj/tokens'
import { mdxToMarkdown, type MarkdownContext } from '@/lib/markdown'
import { bandText, DO_DONT, DURATION_BANDS, durationBandsMarkdown } from '@/lib/motion-guidelines'
import { DoDont } from './do-dont'
import { DurationBands } from './duration-bands'

const ctx: MarkdownContext = {
  site: 'https://k.dev',
  registry: 'https://k.dev/r',
  example: () => undefined,
  props: () => undefined,
  install: () => undefined,
  tokens: { durations, easings, springs, staggers },
}

describe('duration bands', () => {
  it('reads the band of every interaction from the tokens', () => {
    expect(bandText(['instant', 'fast'], motionPersonalities.precise)).toBe('80–140 ms')
    expect(bandText(['snappy', 'smooth'], motionPersonalities.precise)).toBe('200–360 ms')
    expect(bandText(['settle', 'settle'], motionPersonalities.precise)).toBe('450 ms')
    expect(DURATION_BANDS.map((b) => b.interaction)).toEqual(
      expect.arrayContaining(['Press and hover', 'Toggle and select', 'Tooltip', 'Menu and popover', 'Dialog and sheet', 'List insert, remove, reorder', 'Page and hero']),
    )
  })

  it('never names a band past deliberate', () => {
    for (const band of DURATION_BANDS) for (const personality of Object.values(motionPersonalities)) {
      const [, to] = bandText(band.band, personality).match(/(\d+) ms$/)!
      expect(Number(to)).toBeLessThanOrEqual(personality.durations.deliberate)
    }
  })

  it('draws a row per interaction, in the personality in effect', () => {
    render(
      <YoujProvider>
        <ThemeScope theme={{ motionPersonality: 'calm' }}>
          <DurationBands />
        </ThemeScope>
      </YoujProvider>,
    )
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(DURATION_BANDS.length + 1)
    const press = within(table).getByRole('rowheader', { name: /Press and hover/ })
    expect(press).toHaveTextContent('110–190 ms')
  })

  it('writes the same table as Markdown for machines', () => {
    const md = durationBandsMarkdown(motionPersonalities.precise)
    expect(md).toMatch(/^\| Interaction \| Band \| Tokens \| Curve \|/)
    expect(md).toContain('| Menu and popover (menus, selects, popovers: `yj-pop`) | 80–140 ms | in on `fast`, out on `instant` | `enter` in, `exit` out |')
  })

  it('renders the principles page as Markdown with its table, pairs and rules', () => {
    const raw = readFileSync(join(import.meta.dirname, '../../content/docs/motion/principles.mdx'), 'utf8')
    const unknown: string[] = []
    const md = mdxToMarkdown(raw, { ...ctx, unknown: (name) => void unknown.push(name) })
    expect(unknown).toEqual([])
    expect(md).toContain('| Page and hero (route changes, a landing reveal) | 340–560 ms |')
    expect(md).toContain(`- **Do:** ${DO_DONT.origin.do}.`)
    expect(md).toContain('## Reduced motion: keep the meaning, remove the travel')
  })
})

describe('DoDont', () => {
  it('shows the same moment done right and wrong, each labeled', () => {
    render(
      <YoujProvider reducedMotion="always">
        <DoDont example="hover" />
      </YoujProvider>,
    )
    const figures = screen.getAllByRole('figure')
    expect(figures).toHaveLength(2)
    expect(figures[0]).toHaveTextContent('Do')
    expect(figures[0]).toHaveTextContent(/the pointer is, on\s*fast/)
    expect(figures[1]).toHaveTextContent('Don’t')
    expect(figures[1]).toHaveTextContent('a 400 ms fade trails behind the pointer')
  })

  it('holds still under reduced motion: the reduced pair shows its end state on both sides', () => {
    render(
      <YoujProvider reducedMotion="always">
        <DoDont example="reduced" />
      </YoujProvider>,
    )
    // The demos are pictures (aria-hidden); both sides show the toast, in place.
    expect(document.querySelectorAll('figure [aria-hidden] .shadow-md')).toHaveLength(2)
  })
})
