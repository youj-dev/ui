'use client'

import { useState } from 'react'
import { AvatarUpload } from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function AvatarUploadDemo() {
  const [src, setSrc] = useState<string | null>(null)

  return (
    <AvatarUpload
      src={src}
      name="Ada Lovelace"
      fallback="AL"
      size={72}
      onSave={async (file) => {
        // Upload the cropped square here; this demo keeps it in the page.
        await wait(900)
        setSrc(URL.createObjectURL(file))
      }}
      onRemove={() => setSrc(null)}
    />
  )
}
