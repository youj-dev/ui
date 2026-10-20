import { render } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { installObservers } from '@youj/core/test-utils'
import {
  ApertureIcon,
  ArchiveRestoreIcon,
  AudioLinesIcon,
  BatteryChargingIcon,
  BellDotIcon,
  BotIcon,
  BrightnessIcon,
  CalendarPlusIcon,
  CaptionsIcon,
  ChartSplineIcon,
  CheckCheckIcon,
  CircleAlertIcon,
  CircleArrowUpIcon,
  CircleDashedIcon,
  CloudOffIcon,
  ColumnsIcon,
  DoorIcon,
  EyeClosedIcon,
  FlipHorizontalIcon,
  FolderPlusIcon,
  FunnelIcon,
  GridIcon,
  IndentIcon,
  LayoutListIcon,
  ListCollapseIcon,
  LogsIcon,
  MessageDotsIcon,
  MinusIcon,
  PanelBottomIcon,
  PictureInPictureIcon,
  RecordIcon,
  RowsIcon,
  ScreenShareIcon,
  SignalIcon,
  SignatureIcon,
  SmilePlusIcon,
  SortIcon,
  SparkleIcon,
  SquareCheckIcon,
  SunriseIcon,
  TargetIcon,
  ThumbsDownIcon,
  TicketIcon,
  ToggleIcon,
  UnlinkIcon,
  VerifiedIcon,
  WavesIcon,
  WifiOffIcon,
  WrapTextIcon,
  ZapIcon,
  ZoomInIcon,
  type YoujIconComponent,
} from './index'
import { describeMorphs, describeStateLabels } from '../../../test/icon-contract'

beforeAll(installObservers)

const full = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="never">{children}</YoujProvider>
const reduced = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="always">{children}</YoujProvider>
const svgOf = (c: HTMLElement) => c.querySelector('svg')!
const hidden = (el: Element) => {
  const s = (el as SVGElement).style
  return s.opacity === '0' || /scale\(0\)/.test(s.transform) || el.getAttribute('opacity') === '0'
}

const STATES: [YoujIconComponent, [string, string]][] = [
  [CircleDashedIcon, ['pending', 'done']],
  [CircleAlertIcon, ['alert', 'resolved']],
  [BellDotIcon, ['read', 'unread']],
  [BatteryChargingIcon, ['battery', 'charging']],
  [SignalIcon, ['full', 'weak']],
  [WifiOffIcon, ['offline', 'online']],
  [CloudOffIcon, ['offline', 'online']],
  [ToggleIcon, ['off', 'on']],
  [EyeClosedIcon, ['open', 'closed']],
  [BrightnessIcon, ['dim', 'bright']],
  [ZoomInIcon, ['zoom in', 'zoom out']],
  [SortIcon, ['ascending', 'descending']],
  [FunnelIcon, ['all', 'filtered']],
  [MinusIcon, ['minus', 'plus']],
  [UnlinkIcon, ['linked', 'unlinked']],
  [SquareCheckIcon, ['unchecked', 'checked']],
  [CircleArrowUpIcon, ['send', 'stop']],
  [SparkleIcon, ['off', 'on']],
  [BotIcon, ['asleep', 'awake']],
  [LayoutListIcon, ['list', 'grid']],
  [PanelBottomIcon, ['open', 'closed']],
  [ColumnsIcon, ['2 columns', '3 columns']],
  [RowsIcon, ['comfortable', 'compact']],
  [IndentIcon, ['outdent', 'indent']],
  [WrapTextIcon, ['no wrap', 'wrap']],
  [FlipHorizontalIcon, ['original', 'flipped']],
  [GridIcon, ['hidden', 'shown']],
  [RecordIcon, ['record', 'stop']],
  [CaptionsIcon, ['off', 'on']],
  [PictureInPictureIcon, ['inline', 'pip']],
  [AudioLinesIcon, ['silent', 'speaking']],
  [ApertureIcon, ['wide', 'narrow']],
  [CheckCheckIcon, ['sent', 'read']],
  [ScreenShareIcon, ['share', 'stop']],
  [MessageDotsIcon, ['message', 'typing']],
  [ThumbsDownIcon, ['dislike', 'disliked']],
  [SmilePlusIcon, ['react', 'reacted']],
  [ArchiveRestoreIcon, ['archive', 'restore']],
  [ChartSplineIcon, ['smooth', 'linear']],
  [TargetIcon, ['open', 'hit']],
  [VerifiedIcon, ['unverified', 'verified']],
  [TicketIcon, ['valid', 'used']],
  [DoorIcon, ['closed', 'open']],
  [ListCollapseIcon, ['expanded', 'collapsed']],
  [SunriseIcon, ['sunrise', 'sunset']],
  [WavesIcon, ['waves', 'calm']],
  [CalendarPlusIcon, ['add', 'added']],
  [FolderPlusIcon, ['add', 'added']],
]

/* Paths each morph lands on in its end state, and paths only its rest state draws. */
const MORPHS: [YoujIconComponent, { to: string[]; from: string[] }][] = [
  [CircleDashedIcon, { to: ['M8.56 3.69 C10.76 2.77 13.24 2.77 15.44 3.69'], from: ['M10.24 3.17 C11.4 2.94 12.6 2.94 13.76 3.17'] }],
  [CircleAlertIcon, { to: ['M16 10 L11 15', 'M8 12 L11 15'], from: ['M12 7.5 L12 12.5'] }],
  [BatteryChargingIcon, { to: ['M11.75 7 L8.5 12', 'M8.5 12 L12.5 12', 'M12.5 12 L9.25 17'], from: ['M6.5 10 L6.5 14', 'M10 10 L10 14'] }],
  [SignalIcon, { to: ['M4.5 20 L4.5 17', 'M9.5 20 L9.5 19.99', 'M19.5 20 L19.5 19.99'], from: ['M19.5 20 L19.5 5'] }],
  [
    ToggleIcon,
    {
      to: ['M16 9 C17.66 9 19 10.34 19 12 C19 13.66 17.66 15 16 15 C16 15 16 15 16 15 C14.34 15 13 13.66 13 12 C13 10.34 14.34 9 16 9 C16 9 16 9 16 9 Z'],
      from: ['M8 9 C9.66 9 11 10.34 11 12 C11 13.66 9.66 15 8 15 C8 15 8 15 8 15 C6.34 15 5 13.66 5 12 C5 10.34 6.34 9 8 9 C8 9 8 9 8 9 Z'],
    },
  ],
  [EyeClosedIcon, { to: ['M2.5 10 C4.5 13 8 14.5 12 14.5 C16 14.5 19.5 13 21.5 10'], from: ['M2.5 12 C4.5 7.8 8 5.5 12 5.5 C16 5.5 19.5 7.8 21.5 12'] }],
  [BrightnessIcon, { to: ['M12 5.5 L12 3', 'M7.4 7.4 L5.64 5.64'], from: ['M12 4.25 L12 4.24'] }],
  [ZoomInIcon, { to: ['M10.5 10.49 L10.5 10.51'], from: ['M10.5 7.5 L10.5 13.5'] }],
  [SortIcon, { to: ['M3.5 7.5 L7 4 L10.5 7.5', 'M13.5 5.5 H21', 'M13.5 18.5 H16.5'], from: ['M3.5 16.5 L7 20 L10.5 16.5'] }],
  [MinusIcon, { to: ['M12 5 L12 19'], from: ['M12 11.99 L12 12.01'] }],
  [
    SquareCheckIcon,
    {
      to: ['M21 11 L21 19 C21 20.1 20.1 21 19 21 L5 21 C3.9 21 3 20.1 3 19 L3 5 C3 3.9 3.9 3 5 3 L15.5 3 C15.5 3 15.5 3 15.5 3'],
      from: ['M21 5 L21 19 C21 20.1 20.1 21 19 21 L5 21 C3.9 21 3 20.1 3 19 L3 5 C3 3.9 3.9 3 5 3 L19 3 C20.1 3 21 3.9 21 5'],
    },
  ],
  [CircleArrowUpIcon, { to: ['M8.5 8.5 L12 8.5 L15.5 8.5 L15.5 15.5 L12 15.5 L8.5 15.5 Z'], from: ['M8 11.5 L12 7.5 L16 11.5 L12 7.5 L12 16.5 L12 7.5 Z'] }],
  [BotIcon, { to: ['M9.5 12.5 C9.5 13.17 9.5 13.83 9.5 14.5'], from: ['M8.25 13.5 C8.75 14.25 10.25 14.25 10.75 13.5'] }],
  [
    LayoutListIcon,
    {
      to: ['M13.5 7 L13.5 5.5 C13.5 4.4 14.4 3.5 15.5 3.5 L18.5 3.5 C19.6 3.5 20.5 4.4 20.5 5.5 L20.5 7', 'M13.5 17 L13.5 18.5 C13.5 19.6 14.4 20.5 15.5 20.5 L18.5 20.5 C19.6 20.5 20.5 19.6 20.5 18.5 L20.5 17'],
      from: ['M13.5 4.75 L13.5 4.75 C13.5 4.75 13.5 4.75 13.5 4.75 L20.5 4.75 C20.5 4.75 20.5 4.75 20.5 4.75 L20.5 4.75'],
    },
  ],
  [PanelBottomIcon, { to: ['M8.5 18.25 L12 14.75 L15.5 18.25'], from: ['M3 15 L12 15 L21 15'] }],
  [ColumnsIcon, { to: ['M9 3 L9 21', 'M15 3 L15 21'], from: ['M12 3 L12 21'] }],
  [RowsIcon, { to: ['M3 8 L21 8', 'M3 12 L21 12', 'M3 16 L21 16'], from: ['M3 9.5 L21 9.5', 'M3 14.5 L21 14.5'] }],
  [IndentIcon, { to: ['M4.5 9.5 L7 12 L4.5 14.5', 'M12 10 H21', 'M12 14 H21'], from: ['M7 9.5 L4.5 12 L7 14.5', 'M10.5 10 H21'] }],
  [WrapTextIcon, { to: ['M3 12 L17.5 12 C19.43 12 21 13.57 21 15.5 C21 17.43 19.43 19 17.5 19 L14 19'], from: ['M3 12 L21 12 C21 12 21 12 21 12 C21 12 21 12 21 12 L21 12'] }],
  [FlipHorizontalIcon, { to: ['M20.5 6.5 L14.5 12 L20.5 17.5 Z', 'M3.5 6.5 L9.5 12 L3.5 17.5 Z'], from: [] }],
  [GridIcon, { to: ['M9.5 4 L9.5 20', 'M4 9.5 L20 9.5', 'M14.5 4 L14.5 20', 'M4 14.5 L20 14.5'], from: ['M9.5 9.5 L9.5 9.51'] }],
  [
    RecordIcon,
    {
      to: ['M12 8.5 C12.67 8.5 13.33 8.5 14 8.5 C14.83 8.5 15.5 9.17 15.5 10 C15.5 11.33 15.5 12.67 15.5 14 C15.5 14.83 14.83 15.5 14 15.5 C12.67 15.5 11.33 15.5 10 15.5 C9.17 15.5 8.5 14.83 8.5 14 C8.5 12.67 8.5 11.33 8.5 10 C8.5 9.17 9.17 8.5 10 8.5 C10.67 8.5 11.33 8.5 12 8.5 Z'],
      from: [],
    },
  ],
  [
    PictureInPictureIcon,
    {
      to: ['M13 12 L17.5 12 C18.05 12 18.5 12.45 18.5 13 L18.5 15.5 C18.5 16.05 18.05 16.5 17.5 16.5 L13 16.5 C12.45 16.5 12 16.05 12 15.5 L12 13 C12 12.45 12.45 12 13 12 Z'],
      from: ['M6.5 7.5 L17.5 7.5 C18.05 7.5 18.5 7.95 18.5 8.5 L18.5 15.5 C18.5 16.05 18.05 16.5 17.5 16.5 L6.5 16.5 C5.95 16.5 5.5 16.05 5.5 15.5 L5.5 8.5 C5.5 7.95 5.95 7.5 6.5 7.5 Z'],
    },
  ],
  [AudioLinesIcon, { to: ['M12 3.5 L12 20.5', 'M4 10 L4 14'], from: ['M12 11 L12 13'] }],
  [ApertureIcon, { to: ['M10.45 10.7 L19.7 7.34', 'M10.1 12.69 L11.81 3'], from: ['M9.55 7.75 L19.93 7.75'] }],
  [ScreenShareIcon, { to: ['M9.5 12.5 L12 10 L14.5 7.5', 'M9.5 7.5 L14.5 12.5'], from: ['M9 10 L12 7 L15 10', 'M12 7 L12 13'] }],
  [MessageDotsIcon, { to: ['M8 10.5 L8.01 10.5', 'M16 10.5 L16.01 10.5', 'M12 10.5 L12.01 10.5'], from: ['M8 9 L12 9', 'M8 12.5 L13 12.5'] }],
  [
    SmilePlusIcon,
    {
      to: ['M17.01 6.99 C20.33 10.31 20.33 15.69 17.01 19.01 C13.69 22.33 8.31 22.33 4.99 19.01 C1.67 15.69 1.67 10.31 4.99 6.99 C8.31 3.67 13.69 3.67 17.01 6.99', 'M7.5 15 C8.67 17 9.83 18 11 18 C12.17 18 13.33 17 14.5 15'],
      from: ['M8 15.5 C9 16.83 10 17.5 11 17.5 C12 17.5 13 16.83 14 15.5'],
    },
  ],
  [ArchiveRestoreIcon, { to: ['M9.5 13.5 L12 11 L14.5 13.5'], from: ['M9.5 14.5 L12 17 L14.5 14.5'] }],
  [ChartSplineIcon, { to: ['M6.5 15.5 C7.83 13.67 9.17 11.83 10.5 10 C11.83 11.17 13.17 12.33 14.5 13.5 C16.17 11.33 17.83 9.17 19.5 7'], from: ['M6.5 15.5 C7.17 14.58 9.17 10.33 10.5 10 C11.83 9.67 13 14 14.5 13.5 C16 13 18.67 8.08 19.5 7'] }],
  [
    VerifiedIcon,
    {
      to: ['M14.76 5.35 C15.87 4.91 17.14 5.17 17.98 6.02 C18.83 6.86 19.09 8.13 18.65 9.24 C19.75 9.72 20.46 10.8 20.46 12 C20.46 13.2 19.75 14.28 18.65 14.75 C19.09 15.87 18.83 17.14 17.98 17.98 C17.14 18.83 15.87 19.09 14.76 18.65 C14.28 19.75 13.2 20.46 12 20.46 C10.8 20.46 9.72 19.75 9.25 18.65 C8.13 19.09 6.86 18.83 6.02 17.98 C5.17 17.14 4.91 15.87 5.35 14.76 C4.25 14.28 3.54 13.2 3.54 12 C3.54 10.8 4.25 9.72 5.35 9.25 C4.91 8.13 5.17 6.86 6.02 6.02 C6.86 5.17 8.13 4.91 9.24 5.35 C9.72 4.25 10.8 3.54 12 3.54 C13.2 3.54 14.28 4.25 14.75 5.35 Z'],
      from: [],
    },
  ],
  [DoorIcon, { to: ['M7.5 20.5 L7.5 5 C7.5 4.17 8.17 3.5 9 3.5 L12 3 C12 3 12 3 12 3 L12 21'], from: ['M7.5 20.5 L7.5 5 C7.5 4.17 8.17 3.5 9 3.5 L15 3.5 C15.83 3.5 16.5 4.17 16.5 5 L16.5 20.5'] }],
  [ListCollapseIcon, { to: ['M4.5 4 L6.5 6 L4.5 8', 'M13 6 H21'], from: ['M3.5 5 L5.5 7 L7.5 5', 'M13 12 H21', 'M13 18 H21'] }],
  [SunriseIcon, { to: ['M9.75 4.25 L12 6.5 L14.25 4.25'], from: ['M9.75 4.75 L12 2.5 L14.25 4.75'] }],
  [
    WavesIcon,
    {
      to: ['M2.5 12 C4.08 12 5.67 12 7.25 12 C8.83 12 10.42 12 12 12 C13.58 12 15.17 12 16.75 12 C18.33 12 19.92 12 21.5 12'],
      from: ['M2.5 12 C4.08 13.66 5.67 13.66 7.25 12 C8.83 10.34 10.42 10.34 12 12 C13.58 13.66 15.17 13.66 16.75 12 C18.33 10.34 19.92 10.34 21.5 12'],
    },
  ],
  [CalendarPlusIcon, { to: ['M15 13.5 L11 17.5', 'M9 15.5 L11 17.5'], from: ['M12 12.5 L12 18.5', 'M9 15.5 L15 15.5'] }],
  [FolderPlusIcon, { to: ['M15 11 L11 15', 'M9 13 L11 15'], from: ['M12 10 L12 16', 'M9 13 L15 13'] }],
]

describe('batch E state icons', () => {
  describeStateLabels(STATES)

  describeMorphs(MORPHS)

  test('the flip moves the solid shape across the axis and its ghost the other way', () => {
    const solidOf = (c: HTMLElement) => svgOf(c).querySelector('path[fill="currentColor"]')!.getAttribute('d')
    expect(solidOf(render(<FlipHorizontalIcon active={false} />, { wrapper: full }).container)).toBe('M3.5 6.5 L9.5 12 L3.5 17.5 Z')
    expect(solidOf(render(<FlipHorizontalIcon active />, { wrapper: full }).container)).toBe('M20.5 6.5 L14.5 12 L20.5 17.5 Z')
  })

  test('parts that belong to one state are fully hidden in the other, so no stray round caps show', () => {
    const dashed = render(<CircleDashedIcon active={false} />, { wrapper: full })
    expect(hidden(svgOf(dashed.container).querySelector(':scope > path')!)).toBe(true)

    const bell = render(<BellDotIcon active={false} />, { wrapper: full })
    expect(hidden(svgOf(bell.container).querySelector(':scope > circle[fill="currentColor"]')!)).toBe(true)

    const eye = render(<EyeClosedIcon active={false} />, { wrapper: full })
    expect([...svgOf(eye.container).querySelectorAll(':scope > path')].slice(2).every(hidden)).toBe(true)

    const toggle = render(<ToggleIcon active={false} />, { wrapper: full })
    expect(hidden(svgOf(toggle.container).querySelector('path[fill="currentColor"]')!)).toBe(true)

    const wifi = render(<WifiOffIcon active />, { wrapper: full })
    expect(hidden(svgOf(wifi.container).querySelector(':scope > path')!)).toBe(true)

    const check = render(<SquareCheckIcon active={false} />, { wrapper: full })
    expect(hidden(svgOf(check.container).querySelectorAll(':scope > path')[1]!)).toBe(true)

    const stop = render(<CircleArrowUpIcon active={false} />, { wrapper: full })
    expect(hidden(svgOf(stop.container).querySelector('path[fill="currentColor"]')!)).toBe(true)

    const sparkle = render(<SparkleIcon active={false} />, { wrapper: full })
    const [fill, , mini] = svgOf(sparkle.container).querySelectorAll(':scope > path')
    expect(hidden(fill!) && hidden(mini!)).toBe(true)
  })

  test('the second tick slides out from under the first, and the thumb and the captions fill', () => {
    const second = (c: HTMLElement) => svgOf(c).querySelector('g[mask] > path') as SVGElement
    expect(second(render(<CheckCheckIcon active={false} />, { wrapper: full }).container).style.transform).toBe('none')
    expect(second(render(<CheckCheckIcon active />, { wrapper: full }).container).style.transform).toContain('translateX(5.25px)')

    expect(hidden(svgOf(render(<ThumbsDownIcon active={false} />, { wrapper: full }).container).querySelector('path[fill="currentColor"]')!)).toBe(true)
    expect(hidden(svgOf(render(<ThumbsDownIcon active />, { wrapper: full }).container).querySelector('path[fill="currentColor"]')!)).toBe(false)

    /* The fill's clip and the lines' clip always add up to the frame. */
    const clips = (c: HTMLElement) => [...svgOf(c).querySelectorAll('clipPath > rect')].map((r) => (r as SVGElement).style.transform)
    expect(clips(render(<CaptionsIcon active={false} />, { wrapper: full }).container)).toEqual(['scaleX(0)', 'none'])
    expect(clips(render(<CaptionsIcon active />, { wrapper: full }).container)).toEqual(['none', 'scaleX(0)'])
  })

  test('a used ticket has lost its perforation and its stub has come away', () => {
    const used = render(<TicketIcon active />, { wrapper: full })
    expect(hidden(svgOf(used.container).querySelector('g')!)).toBe(true)
    const [main, stub] = [...svgOf(used.container).querySelectorAll(':scope > path')] as SVGElement[]
    expect(main!.style.transform).toContain('translateX(-0.5px)')
    expect(stub!.style.transform).toContain('translateX(1px)')
  })

  test('the arrow only exists once it has hit, and rests out of sight', () => {
    const arrow = (c: HTMLElement) => svgOf(c).querySelector(':scope > path')!
    expect(hidden(arrow(render(<TargetIcon active={false} />, { wrapper: full }).container))).toBe(true)
    expect(hidden(arrow(render(<TargetIcon active />, { wrapper: full }).container))).toBe(false)
  })

  test('filled states cover the whole shape once active and are clipped away at rest', () => {
    const fillOf = (c: HTMLElement) => svgOf(c).querySelector('[fill="currentColor"]')!
    expect(fillOf(render(<FunnelIcon active={false} />, { wrapper: full }).container)).toHaveAttribute('clip-path', 'inset(0% 0% 100% 0%)')
    expect(fillOf(render(<FunnelIcon active />, { wrapper: full }).container)).toHaveAttribute('clip-path', 'inset(0% 0% 0% 0%)')
  })
})

describe('batch E hover icons', () => {

  test('draw icons show their finished drawing when mounted under reduced motion', () => {
    for (const Icon of [ZapIcon, SignatureIcon]) {
      const { container } = render(<Icon trigger="mount" />, { wrapper: reduced })
      const path = container.querySelector('path')!
      expect(svgOf(container)).toHaveAttribute('data-state', 'rest')
      expect(path.getAttribute('opacity') ?? '1').toBe('1')
      expect(path.getAttribute('stroke-dashoffset') ?? '0').toBe('0')
    }
  })
})

describe('batch E hover icons that restart', () => {
  test('logs rest one row scrolled, which is the same picture as none, so a hover restarts without a jump', () => {
    const { container } = render(<LogsIcon />, { wrapper: full })
    const scroll = svgOf(container).querySelector('g[clip-path] > g') as SVGElement
    expect(scroll.style.transform).toContain('translateY(-5px)')
    expect(scroll.querySelectorAll('path')).toHaveLength(5)
  })
})
