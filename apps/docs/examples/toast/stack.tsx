'use client'

import { Button, toast } from '@youj/react'
import { BellIcon } from '@youj/icons'

const BURST = [
  () => toast.success('orion deployed', { description: 'orion.acme.dev, built in 38s' }),
  () => toast('Grace commented on ORI-812', { description: '“Ship it once the flag is on.”' }),
  () => toast.warning('Build minutes at 90%'),
  () => toast('Ana assigned you ORI-830', { description: 'Stream search results from the edge' }),
  () => toast.info('New region: Tokyo (hnd1)'),
]

// Five in quick succession, as a busy morning would send them.
function sendBurst() {
  BURST.forEach((send, i) => setTimeout(send, i * 180))
}

// No Toaster here: the app's one Toaster renders these. On this page, that's the one in the first preview.
export default function ToastStack() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button onClick={sendBurst}>
        <BellIcon />
        Send 5 notifications
      </Button>
      <Button variant="outline" onClick={() => toast.dismiss()}>
        Dismiss all
      </Button>
    </div>
  )
}
