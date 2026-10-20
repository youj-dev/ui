import { readFileSync } from 'node:fs'
import { deriveRoles, ROLES, shippedThemes as themes } from '@youj/core/lib/youj/theme'
import { motionPersonalities } from '@youj/core/lib/youj/tokens'
import { icons as codeIcons } from '@youj/icons/components/youj/icons'
import { buildKit } from '../src/data/build-kit'
import { linearToRgba, YOUJ_CSS } from '../src/data/colors'
import { oklchToLinear, parseColor } from '@youj/core/lib/youj/theme/color'
import { parsePath } from '../src/data/geometry'
import type { IconPart, Kit, Mode } from '../src/kit'
import { motionEntries, themeEntries } from '../src/plugin/variables'

const kit: Kit = buildKit()
const MODES: Mode[] = ['light', 'dark']
/** A colour's value for one theme and mode, following aliases the way the plugin does. */
function resolveValue(name: string, mode: Mode, theme: string) {
  const byName = new Map(kit.colors.map((c) => [c.name, c]))
  let v = byName.get(name)![mode]
  while ('alias' in v) v = byName.get(v.alias)![mode]
  return v.values[theme]
}
const ids = themes.map((t) => t.id)

describe('themes', () => {
  test('exactly the shipped presets are in the kit, the default (Basalt) first', () => {
    expect([...kit.themes.map((t) => t.id)].sort()).toEqual([...ids].sort())
    expect(kit.themes.map((t) => t.id)).toEqual(['basalt', 'graphite', 'terminal', 'brutal', 'meadow', 'sandstone', 'cinnabar', 'umber', 'seaglass', 'heather'])
  })

  test('each theme keeps its motion personality, radius and density', () => {
    const graphite = kit.themes.find((t) => t.id === 'graphite')!
    expect(graphite).toMatchObject({ motion: 'precise', radius: 'xl', density: 'default' })
    expect(kit.motion.themes).toEqual(Object.fromEntries(themes.map((t) => [t.id, t.motionPersonality])))
  })
})

describe('colours', () => {
  const byName = new Map(kit.colors.map((c) => [c.name, c]))

  test('every role is a colour', () => {
    for (const role of ROLES) expect(byName.has(`role/${role}`), role).toBe(true)
  })

  test('every colour youj.css gives Tailwind is a colour, so a new one reaches Figma', () => {
    const css = readFileSync(YOUJ_CSS, 'utf8')
    const block = css.slice(css.indexOf('--yj-paper:'))
    const names = [...block.slice(0, block.indexOf('\n  }')).matchAll(/^\s+--color-([\w-]+):/gm)].map((m) => m[1]!)
    expect(names.length).toBeGreaterThan(30)
    for (const name of names) expect(byName.has(`role/${name}`), name).toBe(true)
  })

  test('a role youj.css writes as another role is an alias to it', () => {
    expect(byName.get('role/focus')!.light).toEqual({ alias: 'role/accent' })
    expect(byName.get('role/chrome')!.dark).toEqual({ alias: 'role/canvas' })
    expect(byName.get('role/chrome-float')!.light).toEqual({ alias: 'role/overlay' })
    // Neutral fills are ink at low alpha, so they carry their own value per theme.
    expect(byName.get('role/hover')!.light).toHaveProperty('values.graphite.a', 0.06)
  })

  test('every colour has a value for every theme in both modes, or an alias to one that does', () => {
    for (const c of kit.colors) {
      for (const mode of MODES) {
        const v = c[mode]
        if ('alias' in v) expect(byName.has(v.alias), `${c.name} → ${v.alias}`).toBe(true)
        else {
          expect(Object.keys(v.values).sort(), c.name).toEqual([...ids].sort())
          for (const rgba of Object.values(v.values)) for (const ch of [rgba.r, rgba.g, rgba.b, rgba.a]) expect(ch).toBeGreaterThanOrEqual(0), expect(ch).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  test('the control boundary is line-control, derived per theme and mode', () => {
    const edge = byName.get('role/line-control')!
    expect(edge).toMatchObject({ css: '--color-line-control', role: 'line' })
    for (const mode of MODES) {
      const value = edge[mode]
      if (!('values' in value)) throw new Error('control edges must resolve per theme')
      for (const theme of themes) {
        const { color } = deriveRoles(theme, mode)['line-control']
        expect(value.values[theme.id!], `${theme.id} ${mode}`).toEqual(linearToRgba(oklchToLinear(color)))
      }
    }
  })

  test('aliases never loop', () => {
    for (const c of kit.colors)
      for (const mode of MODES) {
        const seen = new Set<string>()
        let v = c[mode]
        while ('alias' in v) {
          expect(seen.has(v.alias), `${c.name} loops`).toBe(false)
          seen.add(v.alias)
          v = byName.get(v.alias)![mode]
        }
      }
  })

  test('per-mode contract values reach the variables: each preset’s chart palette as given, and an accent that differs by mode', () => {
    for (const theme of themes) {
      const chart = theme.chart as unknown
      for (const mode of MODES) {
        const given = (chart as Record<Mode, string[]>)[mode]
        for (let i = 0; i < 5; i++) {
          const v = resolveValue(`role/chart-${i + 1}`, mode, theme.id)
          expect(v, `${theme.id} chart-${i + 1} ${mode}`).toEqual(linearToRgba(parseColor(given[i]!)!))
        }
      }
      if (typeof theme.accent === 'object') {
        expect(resolveValue('role/accent', 'light', theme.id)).not.toEqual(resolveValue('role/accent', 'dark', theme.id))
      }
    }
  })

  test('the values match the theme derivation (Graphite’s light canvas and accents: the Youj palette’s)', () => {
    // Light canvas at OKLCH L .965: about 0.9525 in sRGB.
    const canvas = byName.get('role/canvas')!.light
    expect('values' in canvas && canvas.values.graphite).toMatchObject({ r: expect.closeTo(0.9525, 2), a: 1 })
    // An ultramarine in light, an amber in dark.
    const accent = byName.get('role/accent')!
    expect('values' in accent.light && accent.light.values.graphite!.b).toBeGreaterThan(0.9)
    expect('values' in accent.dark && accent.dark.values.graphite!.r).toBeGreaterThan(0.9)
  })
})

describe('sizes', () => {
  const value = (name: string, theme: string) => kit.theme.find((n) => n.name === name)!.values[theme]

  test('radius and control heights come from ui.css’s derivation over each theme', () => {
    expect(value('radius/md', 'graphite')).toBe(10) // xl: 0.625rem, the Clean style's
    expect(value('radius/md', 'terminal')).toBe(0)
    expect(value('radius/md', 'basalt')).toBe(10) // xl too: Basalt is the Clean style
    expect(value('radius/xl', 'basalt')).toBe(20)
    expect(value('radius/2xl', 'basalt')).toBeCloseTo(26.667, 2) // under the 1.75rem cap
    expect(value('control/default', 'graphite')).toBe(32)
    expect(value('control/default', 'terminal')).toBe(28) // compact
    expect(value('control/xs', 'terminal')).toBe(24) // never below the 24px target
    expect(value('control/lg', 'basalt')).toBe(40) // default
  })

  test('The control corners (both looks): the control radius in proportion in Basalt and Graphite, fields included, square in Terminal and Brutal', () => {
    // Basalt and Graphite (the Clean style) round their controls: 10px on the 32px one.
    for (const theme of ['basalt', 'graphite']) {
      expect([theme, value('bezel/pill', theme)]).toEqual([theme, 10])
      expect([theme, value('bezel/badge-radius', theme)]).toEqual([theme, 6.875])
      expect([theme, value('bezel/key-radius', theme)]).toEqual([theme, 7])
      expect([theme, value('bezel/field-radius', theme)]).toEqual([theme, 10])
      expect([theme, value('bezel/field-area-radius', theme)]).toEqual([theme, 10])
    }
    for (const theme of ['terminal', 'brutal'])
      for (const name of ['bezel/pill', 'bezel/badge-radius', 'bezel/key-radius', 'bezel/field-radius', 'bezel/field-area-radius']) expect([theme, name, value(name, theme)]).toEqual([theme, name, 0])
  })

  test('spacing, the type scale and the focus ring are Scale numbers', () => {
    const scale = new Map(kit.scale.map((n) => [n.name, n.value]))
    expect(scale.get('space/4')).toBe(16)
    expect(scale.get('space/0-5')).toBe(2)
    expect(scale.get('text/ui')).toBe(13)
    expect(scale.get('leading/ui')).toBe(20)
    expect(scale.get('leading/lg')).toBe(28)
    expect(scale.get('focus/width')).toBe(2)
  })

  test('every text style has Scale variables for its size and line height', () => {
    const scale = new Set(kit.scale.map((n) => n.name))
    for (const t of kit.text) {
      expect(scale.has(`text/${t.token}`), t.name).toBe(true)
      expect(scale.has(`leading/${t.token}`), t.name).toBe(true)
    }
    expect(kit.text.find((t) => t.name === 'UI/base/Medium')).toMatchObject({ size: 13, lineHeight: 20, weight: 500 })
  })

  test('effect styles bind every layer to a colour in the kit', () => {
    const names = new Set(kit.colors.map((c) => c.name))
    for (const e of kit.effects) for (const layer of e.layers) expect(names.has(layer.color), `${e.name}: ${layer.color}`).toBe(true)
    expect(kit.effects.map((e) => e.name)).toEqual(['Shadow/xs', 'Shadow/sm', 'Shadow/md', 'Shadow/lg', 'Focus/ring', 'Focus/field', 'Focus/field invalid', 'Bezel/lift', 'Bezel/key'])
  })
})

describe('motion', () => {
  test('every personality carries every token with the code’s values', () => {
    for (const [p, tokens] of Object.entries(motionPersonalities)) {
      const kitP = kit.motion.personalities[p as keyof typeof motionPersonalities]
      expect(kitP.durations).toEqual(tokens.durations)
      expect(kitP.staggers).toEqual(tokens.staggers)
      expect(Object.keys(kitP.easings)).toEqual(Object.keys(tokens.easings))
      expect(Object.keys(kit.motion.springCurves[p as keyof typeof motionPersonalities])).toEqual(Object.keys(tokens.springs))
    }
  })

  test('springs settle at their target, and only bouncy ones overshoot', () => {
    const settle = kit.motion.springCurves.precise.settle!
    expect(settle.at(-1)).toBeCloseTo(1, 1)
    expect(Math.max(...settle)).toBeGreaterThan(1)
    expect(Math.max(...kit.motion.springCurves.precise.snappy!)).toBeLessThanOrEqual(1)
  })
})

describe('icons', () => {
  const walk = (parts: IconPart[], fn: (p: Extract<IconPart, { kind: 'path' }>) => void) => {
    for (const p of parts) {
      if (p.kind === 'path') fn(p)
      else {
        expect(p.mask.length, 'a mask has something in it').toBeGreaterThan(0)
        expect(p.content.length, 'a mask masks something').toBeGreaterThan(0)
        walk(p.mask, fn)
        walk(p.content, fn)
      }
    }
  }

  test('all of them, uniquely named, in known categories', () => {
    expect(kit.icons).toHaveLength(codeIcons.length)
    expect(kit.icons.length).toBe(511)
    expect(new Set(kit.icons.map((i) => i.name)).size).toBe(kit.icons.length)
    for (const i of kit.icons) expect(kit.categories, i.name).toContain(i.category)
  })

  test('every icon SVG path parses to plain absolute commands inside the 24-unit box', () => {
    for (const icon of kit.icons) {
      for (const parts of icon.active ? [icon.rest, icon.active] : [icon.rest]) {
        walk(parts, (p) => {
          expect(p.d, icon.name).toMatch(/^M [-\d. MLCZ]+$/)
          const segs = parsePath(p.d)
          expect(segs.length, icon.name).toBeGreaterThan(1)
          for (const s of segs) if (s.type !== 'Z') expect(Math.abs(s.x - 12), `${icon.name} x`).toBeLessThanOrEqual(21)
          if (p.stroke) expect(p.strokeWidth, icon.name).toBeGreaterThan(0)
        })
        expect(parts.length, `${icon.name} draws something`).toBeGreaterThan(0)
      }
    }
  })

  test('state icons have both states, labelled like the code', () => {
    const states = kit.icons.filter((i) => i.states)
    expect(states.length).toBeGreaterThan(100)
    for (const i of states) expect(i.active, i.name).toBeDefined()
    expect(kit.icons.find((i) => i.name === 'menu')!.states).toEqual(['menu', 'close'])
  })

  test('knock-outs become luminance masks and clip paths alpha masks', () => {
    const bellOff = kit.icons.find((i) => i.name === 'bell-off')!
    expect(bellOff.rest[0]).toMatchObject({ kind: 'mask', type: 'LUMINANCE' })
    const film = kit.icons.find((i) => i.name === 'film')!
    expect(film.rest.some((p) => p.kind === 'mask' && p.type === 'ALPHA')).toBe(true)
  })

  test('zero-length round-capped strokes become discs, so dots survive the import', () => {
    const snow = kit.icons.find((i) => i.name === 'cloud-snow')!
    const dots: string[] = []
    walk(snow.rest, (p) => p.fill === 'ink' && !p.stroke && dots.push(p.d))
    expect(dots.length).toBe(3)
  })
})

describe('variable names', () => {
  test('are valid in Figma and unique within their collection', () => {
    const valid = (n: string) => !/[.${}]/.test(n) && !n.startsWith('/') && !n.endsWith('/') && !n.includes('//')
    const collections = {
      Theme: themeEntries(kit).map((e) => e.name),
      Color: kit.colors.map((c) => c.name),
      Scale: kit.scale.map((n) => n.name),
      Motion: motionEntries(kit).map((e) => e.name),
    }
    for (const [collection, names] of Object.entries(collections)) {
      for (const n of names) expect(valid(n), `${collection}/${n}`).toBe(true)
      expect(new Set(names).size, collection).toBe(names.length)
    }
  })
})

test('the kit is deterministic: the same code gives the same hash', () => {
  expect(buildKit().hash).toBe(kit.hash)
})
