'use client'

import { Button, toast } from '@youj/react'

// No Toaster here: the app's one Toaster renders these. On this page, that's the one in the first preview.
export default function ToastTypes() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button variant="outline" onClick={() => toast('Grace commented on ORI-812', { description: '“Ship it once the flag is on.”' })}>
        Default
      </Button>
      <Button variant="outline" onClick={() => toast.success('orion deployed', { description: 'orion.acme.dev, built in 38s' })}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.info('Maintenance tonight', { description: 'From 02:00 to 02:30 UTC, deploys wait in a queue.' })}>
        Info
      </Button>
      <Button variant="outline" onClick={() => toast.warning('Build minutes at 90%', { description: 'Upgrade to keep deploying this month.' })}>
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error('Couldn’t reach the build server', {
            description: 'We’ll retry in 30 seconds.',
            action: { label: 'Retry now', onClick: () => toast.success('Build server reached') },
          })
        }
      >
        Error
      </Button>
    </div>
  )
}
