import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AlertTriangleIcon, ArchiveIcon, BellIcon, CircleAlertIcon, LinkIcon, RocketIcon } from '@youj/icons'
import { IllustrationBackups, IllustrationDeploy, IllustrationLightning } from '@youj/illustrations'
// @youj/react doesn't depend on the loaders, so the story reaches their source directly; an app imports '@youj/loaders/<id>'.
import { LoaderBuild } from '../../../../loaders/src/components/youj/loaders/interface/build'
import { LoaderWinnow } from '../../../../loaders/src/components/youj/loaders/software/winnow'
import { Button } from './button'
import { Label } from './label'
import { Switch } from './switch'
import { toast, Toaster, type ToasterPosition } from './toast'

const meta: Meta<typeof Toaster> = {
  title: 'UI/Overlays/Toast',
  component: Toaster,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI toasts with motion’s yj-toast stack. A new toast rises in from the edge; the ones behind step back (a 12px peek, 5% smaller each, text hidden). Hover or focus the stack to spread it and pause the timers; swipe a toast towards the edge to throw it away. Status icons play once as a toast lands, and `toast.promise` morphs its first line through AsyncFeedback: a spinner, then the drawn check or the shaken cross. `toast()` works from anywhere; render one `<Toaster />`. The viewport is a polite live region (F6 jumps to it); `priority: "high"` makes one interrupt. Reduced motion: toasts appear and leave in place.',
      },
    },
  },
  argTypes: {
    position: {
      control: 'select',
      options: ['top-start', 'top-center', 'top-end', 'bottom-start', 'bottom-center', 'bottom-end'],
    },
  },
  args: { position: 'bottom-end' },
}
export default meta
type Story = StoryObj<typeof Toaster>

/** Leave no toasts behind when switching stories: the manager is global. */
function useDismissOnUnmount() {
  useEffect(() => () => toast.dismiss(), [])
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function deploy(fail: boolean) {
  return toast.promise(
    wait(1800).then(() => {
      if (fail) throw new Error('Build failed: 2 type errors in app/search-results/page.tsx')
      return { url: 'orion.acme.dev', seconds: 41 }
    }),
    {
      loading: { title: 'Deploying orion to production…', description: 'Building from main at 3f9c2a1' },
      success: (result) => ({
        title: 'Deployed to production',
        description: `${result.url} is live · built in ${result.seconds}s`,
        action: { label: 'Visit', onClick: () => {} },
      }),
      error: (error) => ({
        title: 'Deployment failed',
        description: error instanceof Error ? error.message : 'Something went wrong.',
        action: { label: 'View logs', onClick: () => {} },
      }),
    },
  ).catch(() => {})
}

function NotificationCenter({ position }: { position?: ToasterPosition }) {
  useDismissOnUnmount()
  const [failNext, setFailNext] = useState(false)
  return (
    <div className="flex w-[26rem] flex-col gap-4 rounded-xl border border-line bg-surface p-5 shadow-xs">
      <div className="flex flex-col gap-1">
        <span className="text-ui-lg font-semibold">orion</span>
        <span className="text-ui-sm text-fg-muted">Trigger the notifications this project sends.</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => deploy(failNext)}>
          <RocketIcon />
          Deploy
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast('Archived 3 issues', {
              description: 'ORI-812, ORI-815 and ORI-821 moved to the archive.',
              action: { label: 'Undo', onClick: () => toast.success('Restored 3 issues') },
            })
          }
        >
          <ArchiveIcon />
          Archive 3 issues
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.success('Invite link copied', { description: 'Anyone at Acme with the link can join orion.' })
          }
        >
          <LinkIcon />
          Copy invite link
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.warning('Build minutes at 90%', { description: 'Upgrade to keep deploying this month.' })}
        >
          <AlertTriangleIcon />
          Usage warning
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.error('Couldn’t reach the build server', {
              description: 'We’ll retry in 30 seconds.',
              action: { label: 'Retry now', onClick: () => deploy(false) },
            })
          }
        >
          <CircleAlertIcon />
          Network error
        </Button>
        <Button variant="outline" onClick={() => toast.info('Maintenance tonight', { description: '02:00–02:30 UTC, deploys queue.' })}>
          <BellIcon />
          Announcement
        </Button>
      </div>
      <div className="flex items-center gap-2 border-t border-line pt-4">
        <Switch id="fail-next" checked={failNext} onCheckedChange={setFailNext} />
        <Label htmlFor="fail-next">Make the next deploy fail</Label>
      </div>
      <Toaster position={position} />
    </div>
  )
}

/** A project’s notifications: a deploy that reports its progress, an undoable archive, and every status. */
export const Hero: Story = {
  render: (args) => <NotificationCenter position={args.position} />,
}

function PromiseDemo({ position }: { position?: ToasterPosition }) {
  useDismissOnUnmount()
  return (
    <div className="flex gap-2">
      <Button onClick={() => deploy(false)}>
        <RocketIcon />
        Deploy
      </Button>
      <Button variant="outline" onClick={() => deploy(true)}>
        Deploy with a failing build
      </Button>
      <Toaster position={position} />
    </div>
  )
}

/** toast.promise: the first line morphs from a spinner to the drawn check, or to a cross that shakes. */
export const PromiseToast: Story = {
  tags: ['!autodocs'],
  render: (args) => <PromiseDemo position={args.position} />,
}

const burst = [
  () => toast.success('orion deployed', { description: 'orion.acme.dev · 38s' }),
  () => toast('Grace commented on ORI-812', { description: '“Ship it once the flag is on.”' }),
  () => toast.warning('Build minutes at 90%'),
  () => toast('Ada assigned you ORI-830', { description: 'Stream search results from the edge' }),
  () => toast.info('New region: Tokyo (hnd1)'),
]

function StackDemo({ position }: { position?: ToasterPosition }) {
  useDismissOnUnmount()
  return (
    <div className="flex gap-2">
      <Button onClick={() => burst.forEach((send, i) => setTimeout(send, i * 180))}>Send 5 notifications</Button>
      <Button variant="outline" onClick={() => toast.dismiss()}>
        Dismiss all
      </Button>
      <Toaster position={position} />
    </div>
  )
}

/** Five at once: three show, stacked; hover or focus the stack to spread it, swipe one away, and the next steps up. */
export const Stack: Story = {
  tags: ['!autodocs'],
  render: (args) => <StackDemo position={args.position} />,
}

/** Top positions stack downward from the top edge (yj-toast-top) and swipe up. */
export const TopCenter: Story = {
  tags: ['!autodocs'],
  args: { position: 'top-center' },
  render: (args) => <StackDemo position={args.position} />,
}

function MediaDemo({ position }: { position?: ToasterPosition }) {
  useDismissOnUnmount()
  const deployWithMedia = (fail: boolean) =>
    toast
      .promise(
        wait(2200).then(() => {
          if (fail) throw new Error('2 type errors in app/search/page.tsx')
          return 'orion.acme.dev'
        }),
        {
          loading: { title: 'Deploying orion…', description: 'Building main at 4f2a91c', media: <LoaderBuild label={null} /> },
          success: (url) => ({ title: 'Deployed to production', description: `${url} is live`, media: <IllustrationDeploy /> }),
          error: (error) => ({ title: 'Deployment failed', description: (error as Error).message, media: <IllustrationLightning /> }),
        },
      )
      .catch(() => {})
  return (
    <div className="flex max-w-[30rem] flex-wrap justify-center gap-2">
      <Button onClick={() => deployWithMedia(false)}>
        <RocketIcon />
        Deploy
      </Button>
      <Button variant="outline" onClick={() => deployWithMedia(true)}>
        Deploy a failing build
      </Button>
      <Button variant="outline" onClick={() => toast('Backup complete', { description: '12.4 GB of orion saved to eu-west.', media: <IllustrationBackups /> })}>
        Illustration
      </Button>
      <Button variant="outline" onClick={() => toast('Indexing orion…', { description: '1,204 issues, 38 projects', media: <LoaderWinnow label={null} /> })}>
        Loader
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.success('Reminder set', { description: 'We’ll nudge you about ORI-830 at 9:00 tomorrow.', media: <BellIcon trigger="mount" /> })}
      >
        Animated icon
      </Button>
      <Toaster position={position} />
    </div>
  )
}

/** `media`: an illustration, a loader or an animated icon on a small stage in place of the status icon. A promise toast's steps each bring their own, crossfading from the loader to the scene; a typed toast keeps its status as a pip on the stage's corner. */
export const Media: Story = {
  tags: ['!autodocs'],
  render: (args) => <MediaDemo position={args.position} />,
}
