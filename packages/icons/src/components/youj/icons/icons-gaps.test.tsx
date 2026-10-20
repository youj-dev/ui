import { installObservers } from '@youj/core/test-utils'
import { BookmarkPlusIcon, CirclePlayIcon, FlipVerticalIcon, ImagePlusIcon, MailPlusIcon, MapPinPlusIcon, ShieldOffIcon, SquarePlusIcon, type YoujIconComponent } from './index'
import { describeMorphs, describeStateLabels } from '../../../test/icon-contract'

beforeAll(installObservers)

/* The icons added from the 2026-10 gap scan. */
const STATES: [YoujIconComponent, [string, string]][] = [
  [SquarePlusIcon, ['add', 'added']],
  [CirclePlayIcon, ['play', 'pause']],
  [BookmarkPlusIcon, ['add', 'added']],
  [MailPlusIcon, ['add', 'added']],
  [ShieldOffIcon, ['off', 'on']],
  [FlipVerticalIcon, ['original', 'flipped']],
  [ImagePlusIcon, ['add', 'added']],
  [MapPinPlusIcon, ['add', 'added']],
]

/* Paths each morph lands on in its end state, and paths only its rest state draws. */
const MORPHS: [YoujIconComponent, { to: string[]; from: string[] }][] = [
  [SquarePlusIcon, { to: ['M15.5 9.5 L10.75 14.5', 'M8.5 12 L10.75 14.5'], from: ['M12 8.5 L12 15.5'] }],
  [CirclePlayIcon, { to: ['M10 8.5 L10 12 L10 15.5 Z'], from: ['M10 8.5 L15.5 12 L10 15.5 Z'] }],
  [BookmarkPlusIcon, { to: ['M15 8 L11 12', 'M9 10 L11 12'], from: ['M12 7 L12 13'] }],
  [MailPlusIcon, { to: ['M21 15.5 L17 19.5', 'M15 17.5 L17 19.5'], from: ['M18 14.5 L18 20.5'] }],
  [ImagePlusIcon, { to: ['M21 16 L17 20', 'M15 18 L17 20'], from: ['M18 15 L18 21'] }],
  [MapPinPlusIcon, { to: ['M15 7.5 L11 11.5', 'M9 9.5 L11 11.5'], from: ['M12 6.5 L12 12.5'] }],
]

describe('gap-scan state icons', () => {
  describeStateLabels(STATES)

  describeMorphs(MORPHS)
})
