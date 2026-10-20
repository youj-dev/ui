import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { cn } from '@youj/core'
import {
  AlignLeftIcon,
  ApertureIcon,
  ArchiveIcon,
  ArchiveRestoreIcon,
  AudioLinesIcon,
  BadgeCheckIcon,
  BanknoteIcon,
  BatteryChargingIcon,
  BatteryIcon,
  BellDotIcon,
  BellIcon,
  BotIcon,
  BrightnessIcon,
  CalendarClockIcon,
  CalendarIcon,
  CalendarPlusIcon,
  CameraIcon,
  CaptionsIcon,
  CarIcon,
  ChartSplineIcon,
  CheckCheckIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  CircleArrowUpIcon,
  CircleDashedIcon,
  CircleHelpIcon,
  CircleXIcon,
  ClapperboardIcon,
  CloudIcon,
  CloudOffIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CoffeeIcon,
  ColumnsIcon,
  CookieIcon,
  CropIcon,
  CrownIcon,
  DiscIcon,
  DoorIcon,
  DropletIcon,
  EraserIcon,
  EyeClosedIcon,
  EyeIcon,
  FilterIcon,
  FlameIcon,
  FlaskIcon,
  FlipHorizontalIcon,
  FolderPlusIcon,
  FunnelIcon,
  GemIcon,
  GitBranchIcon,
  GitCompareIcon,
  GitForkIcon,
  GridIcon,
  HammerIcon,
  HardDriveIcon,
  HashIcon,
  HighlighterIcon,
  IndentIcon,
  LayoutGridIcon,
  LayoutListIcon,
  LeafIcon,
  LineChartIcon,
  LinkIcon,
  ListCollapseIcon,
  ListIcon,
  LogInIcon,
  LogsIcon,
  MegaphoneIcon,
  MessageDotsIcon,
  MessageIcon,
  MessageSparkleIcon,
  MinusIcon,
  MonitorIcon,
  MoonIcon,
  MousePointerIcon,
  MoveIcon,
  MusicIcon,
  PaletteIcon,
  PanelBottomIcon,
  PanelRightIcon,
  PartyPopperIcon,
  PencilIcon,
  PictureInPictureIcon,
  PipetteIcon,
  PlaneIcon,
  PlayIcon,
  PlusIcon,
  RadarIcon,
  RecordIcon,
  RowsIcon,
  RssIcon,
  RulerIcon,
  ScanBarcodeIcon,
  ScissorsIcon,
  ScreenShareIcon,
  SearchIcon,
  ShareIcon,
  ShieldIcon,
  SidebarIcon,
  SignalIcon,
  SignatureIcon,
  SirenIcon,
  SmileIcon,
  SmilePlusIcon,
  SnowflakeIcon,
  SortIcon,
  SparkleIcon,
  SparklesIcon,
  SplineIcon,
  SproutIcon,
  SquareCheckIcon,
  SunIcon,
  SunriseIcon,
  TagIcon,
  TargetIcon,
  TerminalIcon,
  TextSparkleIcon,
  ThemeIcon,
  ThermometerIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  TicketIcon,
  ToggleIcon,
  TruckIcon,
  UmbrellaIcon,
  UnlinkIcon,
  VerifiedIcon,
  WalletIcon,
  WandIcon,
  WavesIcon,
  WifiIcon,
  WifiOffIcon,
  WindIcon,
  WorkflowIcon,
  WrapTextIcon,
  WrenchIcon,
  XIcon,
  ZapIcon,
  ZoomInIcon,
  type YoujIconComponent,
} from './index'
import { autoplayParameters, morphMeta, morphParameters, MorphsView, type MorphArgs } from './story-kit'

/* Every icon in the batch, by group; `refs` are existing icons drawn beside them on the contact sheet. */
const GROUPS: { id: string; title: string; note: string; icons: YoujIconComponent[]; refs: YoujIconComponent[] }[] = [
  {
    id: 'status',
    title: 'Status & system',
    note: 'Progress, connection, power and display',
    icons: [
      CircleDashedIcon,
      CircleAlertIcon,
      BellDotIcon,
      BatteryChargingIcon,
      SignalIcon,
      WifiOffIcon,
      CloudOffIcon,
      ToggleIcon,
      EyeClosedIcon,
      BrightnessIcon,
      CircleXIcon,
      CircleHelpIcon,
      SirenIcon,
      PartyPopperIcon,
      ZapIcon,
      WrenchIcon,
    ],
    refs: [CheckCircleIcon, BellIcon, BatteryIcon, WifiIcon, CloudIcon, EyeIcon, ThemeIcon],
  },
  {
    id: 'actions',
    title: 'Actions & AI',
    note: 'Controls that flip, and the assistant',
    icons: [
      ZoomInIcon,
      SortIcon,
      FunnelIcon,
      MinusIcon,
      UnlinkIcon,
      SquareCheckIcon,
      CircleArrowUpIcon,
      SparkleIcon,
      BotIcon,
      XIcon,
      WandIcon,
      MessageSparkleIcon,
      TextSparkleIcon,
    ],
    refs: [SearchIcon, FilterIcon, PlusIcon, LinkIcon, SparklesIcon, MessageIcon],
  },
  {
    id: 'layout',
    title: 'Layout & editor',
    note: 'Views, panels, text flow and the tools of a canvas',
    icons: [
      LayoutListIcon,
      PanelBottomIcon,
      ColumnsIcon,
      RowsIcon,
      IndentIcon,
      WrapTextIcon,
      FlipHorizontalIcon,
      GridIcon,
      ScissorsIcon,
      CropIcon,
      MoveIcon,
      PaletteIcon,
      SignatureIcon,
      MousePointerIcon,
      EraserIcon,
      SplineIcon,
      HighlighterIcon,
      PipetteIcon,
      RulerIcon,
    ],
    refs: [LayoutGridIcon, SidebarIcon, PanelRightIcon, ListIcon, AlignLeftIcon, PencilIcon],
  },
  {
    id: 'media',
    title: 'Media, messages & people',
    note: 'Recording, captions, calls, receipts and reactions',
    icons: [
      RecordIcon,
      CaptionsIcon,
      PictureInPictureIcon,
      AudioLinesIcon,
      ApertureIcon,
      CheckCheckIcon,
      ScreenShareIcon,
      MessageDotsIcon,
      ThumbsDownIcon,
      SmilePlusIcon,
      ClapperboardIcon,
      DiscIcon,
      MegaphoneIcon,
      RssIcon,
      HashIcon,
    ],
    refs: [PlayIcon, CameraIcon, CheckIcon, MonitorIcon, ThumbsUpIcon, SmileIcon, MusicIcon, ShareIcon],
  },
  {
    id: 'data',
    title: 'Files, data, dev & security',
    note: 'Storage, charts, goals, branches and trust',
    icons: [
      ArchiveRestoreIcon,
      FolderPlusIcon,
      ChartSplineIcon,
      TargetIcon,
      VerifiedIcon,
      GitForkIcon,
      GitCompareIcon,
      WorkflowIcon,
      FlaskIcon,
      HammerIcon,
      CookieIcon,
      LogsIcon,
    ],
    refs: [ArchiveIcon, LineChartIcon, BadgeCheckIcon, GitBranchIcon, TerminalIcon, ShieldIcon],
  },
  {
    id: 'places',
    title: 'Commerce, places & time',
    note: 'Passes and premium, ways in and out, trips and schedules',
    icons: [
      TicketIcon,
      DoorIcon,
      ListCollapseIcon,
      CalendarPlusIcon,
      BanknoteIcon,
      CrownIcon,
      GemIcon,
      ScanBarcodeIcon,
      CarIcon,
      PlaneIcon,
      RadarIcon,
      CalendarClockIcon,
      CoffeeIcon,
      HardDriveIcon,
    ],
    refs: [TagIcon, LogInIcon, ChevronRightIcon, WalletIcon, TruckIcon, CalendarIcon],
  },
  {
    id: 'weather',
    title: 'Weather & nature',
    note: 'Sky, water and growing things',
    icons: [SunriseIcon, WavesIcon, FlameIcon, LeafIcon, DropletIcon, SunIcon, MoonIcon, SproutIcon, CloudSnowIcon],
    refs: [CloudRainIcon, SnowflakeIcon, UmbrellaIcon, WindIcon, ThermometerIcon],
  },
]
const STATE_GROUPS = GROUPS.map((g) => ({ ...g, icons: g.icons.filter((I) => I.meta.states) })).filter((g) => g.icons.length)
const STATE_ICONS = STATE_GROUPS.flatMap((g) => g.icons)

const meta = {
  ...morphMeta,
  title: 'Icons/Morphs/Status, layout, media & AI',
  parameters: morphParameters(
    `The ${STATE_ICONS.length} state icons from the fifth batch. Each takes a controlled \`active\` and moves between two real states with a shared-structure path morph: dashes close into a ring and a check, battery cells fuse into a bolt, a knob stretches across its track, a lid blinks shut and grows lashes. Every morph reverses from wherever it is, so toggling mid-way never jumps. Under reduced motion the state switches instantly. Use the toolbar's ¼× speed to study them.`,
  ),
} satisfies Meta<MorphArgs>

export default meta
type Story = StoryObj<MorphArgs>

const render: Story['render'] = ({ auto }) => (
  <MorphsView
    auto={auto}
    groups={STATE_GROUPS}
    heading="Status, layout, media and AI, in two states"
    intro="Click a card to toggle it. Click again mid-morph and it reverses from where it is."
  />
)

export const Morphs: Story = { render }

export const Autoplay: Story = {
  args: { auto: true },
  parameters: autoplayParameters,
  render,
}

/* ── Contact sheet ───────────────────────────────────────────────────────── */

/** The 24-unit keylines: 2px live area and the r9 and r3 circles. */
function Keylines() {
  return (
    <svg viewBox="0 0 24 24" className="absolute inset-0 size-full text-line" fill="none" stroke="currentColor" aria-hidden>
      <g strokeWidth={0.06}>
        <rect x="2" y="2" width="20" height="20" />
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3" />
        <path d="M2 2 L22 22 M22 2 L2 22" />
      </g>
    </svg>
  )
}

function SheetCell({ icon: Icon, active, reference }: { icon: YoujIconComponent; active: boolean; reference?: boolean }) {
  return (
    <figure className="flex flex-col items-center gap-2">
      <div className={cn('relative size-32 rounded-lg', reference ? 'bg-well' : 'bg-surface')}>
        <Keylines />
        <Icon size={128} active={active} className="relative text-fg" />
      </div>
      <div className="flex h-8 items-center gap-3 text-fg">
        <Icon size={24} active={active} />
        <Icon size={16} active={active} />
      </div>
      <figcaption className="font-mono text-[10.5px] text-fg-muted">
        {Icon.meta.name}
        {reference && ' · ref'}
      </figcaption>
    </figure>
  )
}

interface SheetArgs {
  group: string
}

export const ContactSheet: StoryObj<SheetArgs> = {
  name: 'Contact sheet',
  args: { group: GROUPS[0]!.id },
  argTypes: {
    group: { options: GROUPS.map((g) => g.id), control: { type: 'select', labels: Object.fromEntries(GROUPS.map((g) => [g.id, g.title])) } },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Each group at 128, 24 and 16px on the keyline grid, beside existing icons from the set (tinted tiles) for stroke weight and scale. Press Play to run every icon into its active pose; toggle again mid-way to watch it reverse.',
      },
    },
  },
  render: function Render({ group }) {
    const g = GROUPS.find((x) => x.id === group) ?? GROUPS[0]!
    const [active, setActive] = useState(false)
    return (
      <div className="min-h-screen bg-canvas p-6">
        <div className="mb-5 flex items-center gap-3">
          <h1 className="text-sm font-semibold text-fg">{g.title}</h1>
          <span className="text-xs text-fg-muted">{g.note}</span>
          <button
            type="button"
            data-testid="sheet-toggle"
            aria-pressed={active}
            onClick={() => setActive((a) => !a)}
            className="ms-auto rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {active ? 'Reset' : 'Play'}
          </button>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(136px,1fr))] gap-x-3 gap-y-5">
          {g.icons.map((I) => (
            <SheetCell key={I.meta.name} icon={I} active={active} />
          ))}
          {g.refs.map((I) => (
            <SheetCell key={I.meta.name} icon={I} active={active} reference />
          ))}
        </div>
      </div>
    )
  },
}
