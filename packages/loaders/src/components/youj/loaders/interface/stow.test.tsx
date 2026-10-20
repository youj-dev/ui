import { motionPersonalities } from '@youj/core/lib/youj/tokens'
import { bezier } from '../field'
import { describeLoader, marksAt, testView } from '../testing'
import { LoaderStow, meta, scene } from './stow'

describeLoader(LoaderStow, meta, scene)

it('keeps the final fit within its opacity range when arrival tokens overshoot', () => {
  for (const tokens of Object.values(motionPersonalities)) {
    const view = testView()
    for (const key of ['standard', 'enter', 'exit', 'emphasized'] as const) view.ease[key] = bezier(tokens.easings[key])
    for (let i = 0; i <= 96; i++) for (const mark of marksAt(scene, i / 96, view)) {
      const opacity = mark.kind === 'path' ? mark.stroke.alpha : mark.kind === 'face' ? mark.light : mark.alpha
      expect(opacity).toBeGreaterThanOrEqual(0)
      expect(opacity).toBeLessThanOrEqual(1)
    }
  }
})
