// Fixture for scripts/props.test.ts: a shadcn-style file that exports at the foot.
import type { ComponentProps, HTMLAttributes } from 'react'

interface ChipProps extends ComponentProps<'span'> {
  /** Shows a remove button. Default false. */
  removable?: boolean
}

function Chip({ removable = false, ...props }: ChipProps) {
  return <span data-removable={removable} {...props} />
}

/** No props of its own: everything passes through to the input. */
function TextInput(props: ComponentProps<'input'>) {
  return <input {...props} />
}

/** Two external bases and nothing declared here. */
function Group(props: HTMLAttributes<HTMLDivElement> & ComponentProps<'fieldset'>) {
  return <div {...(props as HTMLAttributes<HTMLDivElement>)} />
}

type PanelProps = ComponentProps<'section'> & Pick<HTMLAttributes<HTMLElement>, 'title'>

/** Typed by a local alias that only names external types. */
function Panel(props: PanelProps) {
  return <section {...props} />
}

function Count(value: number) {
  return <span>{value}</span>
}

export { Chip, TextInput, Group, Panel, Count, type ChipProps }
// A re-export is documented where it's declared, not twice.
export { Badge } from './badge'
