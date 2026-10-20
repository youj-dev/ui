// @vitest-environment node
import { playgroundSnippet, springExpression, tweenExpression, type Snippet } from './code'
import { DEFAULT_STATE, INTERACTIONS, MOMENTS, PRESETS, TABS, type PlaygroundState } from './state'

const state = (patch: Partial<PlaygroundState>): PlaygroundState => ({ ...DEFAULT_STATE, ...patch })
const lines = (s: Snippet) => s.code.replace(/\n$/, '').split('\n')

describe('the playground’s code', () => {
  it('names a token when the value is one', () => {
    expect(springExpression(state({ spring: 'settle' }))).toBe("k.spring('settle')")
    expect(tweenExpression(state({ duration: 'base', ease: 'enter' }))).toBe("k.tween('base', 'enter')")
    const code = playgroundSnippet(state({ spring: 'settle' }), 'precise').code
    expect(code).toContain("k.reduced ? { duration: 0 } : k.spring('settle')")
    expect(code).not.toMatch(/visualDuration|0\.45/)
  })

  it('spells custom values as numbers on the time scale, and names the closest token', () => {
    expect(springExpression(state({ spring: 'custom', springCustom: { visualDuration: 0.5, bounce: 0.2 } }))).toBe(
      "{ type: 'spring', visualDuration: 0.5 * k.timeScale, bounce: 0.2 }",
    )
    expect(tweenExpression(state({ duration: 'custom', durationCustom: 300, ease: 'enter' }))).toBe("{ duration: 0.3 * k.timeScale, ease: k.ease('enter') }")
    expect(tweenExpression(state({ duration: 'slow', ease: 'custom', easeCustom: [0.3, 0, 0.2, 1] }))).toBe("{ duration: k.duration('slow'), ease: [0.3, 0, 0.2, 1] }")
    const snippet = playgroundSnippet(state({ spring: 'custom', springCustom: { visualDuration: 0.5, bounce: 0.2 } }), 'precise')
    expect(snippet.notes.some((n) => /Closest token: `settle`/.test(n.text))).toBe(true)
  })

  it('writes the personality’s values into the notes, never into the code', () => {
    const precise = playgroundSnippet(state({ spring: 'settle' }), 'precise')
    const calm = playgroundSnippet(state({ spring: 'settle' }), 'calm')
    expect(calm.code).toBe(precise.code)
    expect(precise.notes.map((n) => n.text).join()).toMatch(/0\.45 s, bounce 0\.3/)
    expect(calm.notes.map((n) => n.text).join()).toMatch(/0\.6 s, no bounce/)
  })

  it('puts every note on real lines of its own snippet, in order', () => {
    const views = [
      ...TABS.map((tab) => state({ tab })),
      ...MOMENTS.map((moment) => state({ tab: 'personalities', moment })),
      ...PRESETS.map((preset) => state({ tab: 'presence', preset })),
      ...INTERACTIONS.map((interaction) => state({ tab: 'reduced', interaction })),
    ]
    for (const view of views) {
      const snippet = playgroundSnippet(view, 'precise')
      const code = lines(snippet)
      expect(snippet.notes.length, `${view.tab}`).toBeGreaterThan(0)
      let last = 0
      for (const note of snippet.notes) {
        expect(note.from).toBeGreaterThan(last)
        expect(note.to).toBeGreaterThanOrEqual(note.from)
        expect(note.to).toBeLessThanOrEqual(code.length)
        // A note starts on code, not on a blank line.
        expect(code[note.from - 1]!.trim()).not.toBe('')
        last = note.to
      }
    }
  })

  it('shows each overlay preset on its Base UI part, through the provider’s scope', () => {
    for (const preset of PRESETS) {
      const { code } = playgroundSnippet(state({ tab: 'presence', preset }), 'precise')
      expect(code).toContain(`className="${preset}`)
      expect(code).toContain('{...scope}')
      expect(code).toContain('useYoujScope()')
    }
  })

  it('asks for the same token in every personality', () => {
    for (const moment of MOMENTS) {
      const { code } = playgroundSnippet(state({ tab: 'personalities', moment }), 'precise')
      expect(code).toContain("defineTheme({ motionPersonality: 'calm' })")
      expect(code).toMatch(/k\.(spring|tween)\(/)
    }
  })

  it('shows the reduced-motion guard wherever the code times its own motion', () => {
    for (const tab of ['springs', 'tweens'] as const) expect(playgroundSnippet(state({ tab }), 'precise').code).toContain('k.reduced ? { duration: 0 }')
    expect(playgroundSnippet(state({ tab: 'reduced', interaction: 'save' }), 'precise').code).toContain('initial={k.reduced ? false')
  })
})
