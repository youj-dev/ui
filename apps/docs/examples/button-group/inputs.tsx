'use client'

import { MinusIcon, PlusIcon, SearchIcon } from '@youj/icons'
import { Button, ButtonGroup, ButtonGroupText, Input } from '@youj/react'

export default function ButtonGroupInputs() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <ButtonGroup aria-label="Search" className="w-full">
        <Input placeholder="Search issues…" aria-label="Search issues" />
        <Button variant="outline" aria-label="Search">
          <SearchIcon />
        </Button>
      </ButtonGroup>

      {/* ButtonGroupText renders as a label, so the prefix names the input. */}
      <ButtonGroup className="w-full">
        <ButtonGroupText render={<label htmlFor="project-url" />}>https://</ButtonGroupText>
        <Input id="project-url" defaultValue="acme.dev" />
      </ButtonGroup>

      <ButtonGroup orientation="vertical" aria-label="Zoom">
        <Button variant="outline" size="icon" aria-label="Zoom in">
          <PlusIcon />
        </Button>
        <Button variant="outline" size="icon" aria-label="Zoom out">
          <MinusIcon />
        </Button>
      </ButtonGroup>
    </div>
  )
}
