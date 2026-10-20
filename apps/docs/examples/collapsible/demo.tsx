'use client'

import {
  Button,
  Collapsible,
  CollapsibleChevron,
  CollapsibleContent,
  CollapsibleTrigger,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  Switch,
} from '@youj/react'

export default function CollapsibleDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-line bg-surface p-5">
      <Field>
        <FieldLabel>Build command</FieldLabel>
        <Input defaultValue="pnpm build" className="font-mono" />
      </Field>
      <Collapsible>
        {/* The trigger is a Button, composed through `render`. The chevron reads its aria-expanded. */}
        <CollapsibleTrigger render={<Button variant="ghost" size="sm" className="-ms-2.5" />}>
          Advanced settings
          <CollapsibleChevron />
        </CollapsibleTrigger>
        <CollapsibleContent>
          {/* The panel clips while it moves, so padding and focus rings live inside it. */}
          <div className="flex flex-col gap-4 px-0.5 pt-3 pb-0.5">
            <Field>
              <FieldLabel>Output directory</FieldLabel>
              <Input defaultValue=".next" className="font-mono" />
              <FieldDescription>Relative to the project root.</FieldDescription>
            </Field>
            <Field orientation="horizontal">
              <Switch defaultChecked />
              <FieldLabel>Skip the build when nothing changed</FieldLabel>
            </Field>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
