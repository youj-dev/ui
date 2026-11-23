'use client'

import { useState } from 'react'
import { InlineEdit } from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const ADDRESS = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export default function InlineEditDemo() {
  const [name, setName] = useState('Apollo')
  const [description, setDescription] = useState('Mission control for the launch-week dashboards.\nOwned by the platform team.')
  const [address, setAddress] = useState('apollo-launch')

  return (
    <div className="w-full max-w-lg rounded-xl border border-line bg-surface p-2">
      <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-x-2 gap-y-1">
        <dt className="py-1.5 ps-2 text-ui leading-5 text-fg-muted">Name</dt>
        <dd className="min-w-0">
          <InlineEdit
            label="Name"
            value={name}
            onValueChange={setName}
            validate={(next) => (next.trim() ? null : 'A project needs a name.')}
            onSave={() => wait(700)}
          />
        </dd>
        <dt className="pt-2.25 ps-2 text-ui leading-5 text-fg-muted">Description</dt>
        <dd className="min-w-0">
          <InlineEdit
            label="Description"
            multiline
            placeholder="Add a description…"
            value={description}
            onValueChange={setDescription}
            onSave={() => wait(900)}
          />
        </dd>
        <dt className="py-1.5 ps-2 text-ui leading-5 text-fg-muted">Address</dt>
        <dd className="min-w-0">
          <InlineEdit
            label="Address"
            value={address}
            onValueChange={setAddress}
            validate={(next) => (ADDRESS.test(next) ? null : 'Use lowercase letters, numbers and single dashes.')}
            onSave={async (next) => {
              await wait(800)
              if (next === 'apollo') throw new Error('apollo is taken. Try another address.')
            }}
          />
        </dd>
      </dl>
    </div>
  )
}
