'use client'

import { useEffect, useState } from 'react'
import {
  Button,
  Field,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
  Toaster,
  type ToasterPosition,
} from '@youj/react'
import { ArchiveIcon, LinkIcon, RocketIcon } from '@youj/icons'
import { IllustrationDeploy, IllustrationLightning } from '@youj/illustrations'
import { LoaderBuild } from '@youj/loaders/build'

const POSITIONS: Record<ToasterPosition, string> = {
  'top-start': 'Top start',
  'top-center': 'Top center',
  'top-end': 'Top end',
  'bottom-start': 'Bottom start',
  'bottom-center': 'Bottom center',
  'bottom-end': 'Bottom end',
}

// Stands in for a deployment.
const build = () => new Promise<{ url: string; seconds: number }>((resolve) => setTimeout(() => resolve({ url: 'orion.acme.dev', seconds: 41 }), 1800))

function deploy() {
  toast
    .promise(build(), {
      // Each step brings its own media: a loader while it builds, then the scene once it's live.
      loading: { title: 'Deploying orion…', description: 'Building main at 4f2a91c', media: <LoaderBuild label={null} /> },
      success: (result) => ({
        title: 'Deployed to production',
        description: `${result.url} is live, built in ${result.seconds}s`,
        media: <IllustrationDeploy />,
        action: { label: 'Visit', onClick: () => {} },
      }),
      error: { title: 'Deployment failed', media: <IllustrationLightning /> },
    })
    .catch(() => {})
}

function archive() {
  toast('Archived 3 issues', {
    description: 'ORI-812, ORI-815 and ORI-821 moved to the archive.',
    action: { label: 'Undo', onClick: () => toast.success('Restored 3 issues') },
  })
}

export default function ToastDemo() {
  const [position, setPosition] = useState<ToasterPosition>('bottom-end')
  // The queue behind toast() is app-wide. This demo's Toaster leaves with the page, so its toasts do too.
  useEffect(() => () => toast.dismiss(), [])

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-line bg-surface p-5 shadow-xs">
      <div className="flex flex-col gap-1">
        <span className="text-ui-lg font-semibold text-fg">orion</span>
        <span className="text-ui-sm text-fg-muted">Toasts appear in the corner of the window.</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={deploy}>
          <RocketIcon />
          Deploy
        </Button>
        <Button variant="outline" onClick={archive}>
          <ArchiveIcon />
          Archive 3 issues
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.success('Invite link copied', {
              description: 'Anyone at Acme with the link can join orion.',
              media: <LinkIcon trigger="mount" />,
            })
          }
        >
          <LinkIcon />
          Copy invite link
        </Button>
      </div>
      <Field orientation="horizontal" className="justify-between border-t border-line pt-4">
        <FieldLabel>Position</FieldLabel>
        <Select items={POSITIONS} value={position} onValueChange={(value) => value && setPosition(value)}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(POSITIONS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {/* One Toaster renders every toast() in the app, so it belongs in your root layout. */}
      <Toaster position={position} />
    </div>
  )
}
