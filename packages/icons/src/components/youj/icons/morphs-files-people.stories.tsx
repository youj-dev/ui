import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  AlarmClockIcon,
  BellOffIcon,
  CalendarCheckIcon,
  ClipboardIcon,
  CloudDownloadIcon,
  CloudUploadIcon,
  FilePlusIcon,
  FolderIcon,
  MailOpenIcon,
  PhoneCallIcon,
  SaveIcon,
  ThumbsUpIcon,
  UserPlusIcon,
  VideoIcon,
  type YoujIconComponent,
} from './index'
import { autoplayParameters, morphMeta, morphParameters, MorphsView, type MorphArgs } from './story-kit'

const STATE_ICONS: YoujIconComponent[] = [
  FolderIcon,
  FilePlusIcon,
  ClipboardIcon,
  SaveIcon,
  CloudUploadIcon,
  CloudDownloadIcon,
  UserPlusIcon,
  ThumbsUpIcon,
  BellOffIcon,
  VideoIcon,
  PhoneCallIcon,
  MailOpenIcon,
  AlarmClockIcon,
  CalendarCheckIcon,
]

const meta = {
  ...morphMeta,
  title: 'Icons/Morphs/Files, people & time',
  parameters: morphParameters(
    `The ${STATE_ICONS.length} state icons from the files, people, communication and time sets. Each takes a controlled \`active\` and moves between two real states: shared-structure path morphs (plus → check, label → check, folder closed → open, envelope flap), sequenced choreography (hang up, upload → sealed cloud, day dots → check) and masked slashes (bell, camera). Reversing plays the opposite move from wherever the icon is, so toggling mid-morph never jumps. Under reduced motion the state switches instantly.`,
  ),
} satisfies Meta<MorphArgs>

export default meta
type Story = StoryObj<MorphArgs>

const render: Story['render'] = ({ auto }) => (
  <MorphsView
    auto={auto}
    icons={STATE_ICONS}
    heading="Files, people &amp; time"
    intro="Click a card to toggle it. Click again mid-morph to watch it reverse."
  />
)

export const Morphs: Story = { render }

export const Autoplay: Story = {
  args: { auto: true },
  parameters: autoplayParameters,
  render,
}

const SIZES = [16, 20, 24, 32]

export const BothStates: Story = {
  name: 'Both states, small sizes',
  parameters: {
    docs: {
      description: {
        story: 'Each state icon at 16, 20, 24 and 32px, resting state then active state, to check that both ends of every morph read at UI sizes.',
      },
    },
  },
  render: () => (
    <div className="min-h-screen bg-canvas px-5 py-10 md:px-10">
      <div className="mx-auto grid max-w-5xl gap-x-10 gap-y-1 sm:grid-cols-2">
        {STATE_ICONS.map((Icon) => (
          <div key={Icon.meta.name} className="flex items-center gap-4 border-b border-line py-3 text-fg">
            <span className="w-28 shrink-0 font-mono text-[11px] text-fg-muted">{Icon.meta.name}</span>
            <span className="flex items-end gap-3" title={Icon.meta.states![0]}>
              {SIZES.map((size) => (
                <Icon key={size} size={size} active={false} trigger="none" />
              ))}
            </span>
            <span aria-hidden className="mx-1 h-6 w-px bg-line" />
            <span className="flex items-end gap-3" title={Icon.meta.states![1]}>
              {SIZES.map((size) => (
                <Icon key={size} size={size} active trigger="none" />
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
}
