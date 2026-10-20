import type { Meta, StoryObj } from '@storybook/react-vite'
import { Specimen } from '../../stories/kit'
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from './avatar'

const meta: Meta<typeof Avatar> = {
  title: 'UI/Primitives/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI avatar: the fallback shows until the image has actually loaded, and stays if it fails, so there is never a broken-image frame. The image then fades in over the muted disc on the base token (instantly under reduced motion). A hairline inner edge keeps light photos off the page. Give the image real alt text; the fallback is for sighted users.',
      },
    },
  },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] } },
  args: { size: 'default' },
}
export default meta
type Story = StoryObj<typeof Avatar>

/* Portraits are generated in place (no network): two-tone gradients in the
 * accent's family, as SVG data URIs. */
function portrait(hueA: number, hueB: number) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${hueA} 70% 62%)'/><stop offset='1' stop-color='hsl(${hueB} 70% 42%)'/></linearGradient></defs><rect width='64' height='64' fill='url(#g)'/><circle cx='32' cy='26' r='11' fill='white' fill-opacity='.85'/><path d='M12 60c3-12 12-18 20-18s17 6 20 18z' fill='white' fill-opacity='.85'/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const team = [
  { name: 'Ada Lovelace', initials: 'AL', src: portrait(230, 262) },
  { name: 'Grace Hopper', initials: 'GH', src: portrait(160, 200) },
  { name: 'Alan Turing', initials: 'AT' },
  { name: 'Katherine Johnson', initials: 'KJ', src: portrait(20, 350) },
  { name: 'Edsger Dijkstra', initials: 'ED', src: 'https://invalid.example/avatar.png' },
]

export const Hero: Story = {
  render: () => (
    <div className="flex w-full max-w-[420px] items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarImage src={team[0]!.src} alt="Ada Lovelace" />
          <AvatarFallback>AL</AvatarFallback>
          <AvatarBadge aria-hidden />
        </Avatar>
        <div>
          <p className="text-ui font-medium text-fg">Ada Lovelace</p>
          <p className="text-ui-sm text-fg-muted">Online · Owner</p>
        </div>
      </div>
      <AvatarGroup>
        {team.slice(1, 4).map((m) => (
          <Avatar key={m.name} size="sm">
            {m.src && <AvatarImage src={m.src} alt={m.name} />}
            <AvatarFallback>{m.initials}</AvatarFallback>
          </Avatar>
        ))}
        <AvatarGroupCount className="size-6 text-ui-xs">+8</AvatarGroupCount>
      </AvatarGroup>
    </div>
  ),
}

/** Image, no image, and a failed image: the last two show initials. */
export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-8">
      {(['sm', 'default', 'lg'] as const).map((size) => (
        <Specimen key={size} label={size}>
          <div className="flex items-center gap-2">
            {team.slice(2, 5).map((m) => (
              <Avatar key={m.name} size={size}>
                {m.src && <AvatarImage src={m.src} alt={m.name} />}
                <AvatarFallback>{m.initials}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </Specimen>
      ))}
    </div>
  ),
}

/** `colorSeed` tints the initials with one of the theme's chart colours, picked from the seed (an id or an email), so a person keeps their colour in every list. */
export const SeededColors: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {['Mira Kovac', 'Jonas Ortiz', 'Sana Noor', 'Theo Brandt', 'Lena Hart', 'Ari Reyes', 'Noor Haddad', 'Mei Tanaka'].map((name) => (
        <Avatar key={name}>
          <AvatarFallback colorSeed={name}>
            {name
              .split(' ')
              .map((part) => part[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  ),
}
