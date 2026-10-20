import type { ComponentProps } from 'react'
import { ChevronDownIcon } from '@youj/icons'
import { cn } from '../../lib/utils'
import { fieldControlClass } from './input'

/* The browser's own <select>, dressed as a Youj field: Input's border,
 * hover and focus, the control heights, and Select's chevron. Reach for it
 * when the platform picker is the better tool: long option lists on phones
 * (the OS wheel or sheet), forms that must work before hydration, or plain
 * server-rendered forms. The popup is the operating system's, so it takes
 * no Youj motion; only the field's colors ease on the fast token. */

type NativeSelectProps = Omit<ComponentProps<'select'>, 'size'> & {
  /** The control height. Default `default`. */
  size?: 'sm' | 'default' | 'lg'
}

function NativeSelect({ className, size = 'default', ...props }: NativeSelectProps) {
  return (
    <div
      data-slot="native-select-wrapper"
      data-size={size}
      className={cn('group/native-select relative own:w-fit has-[select:disabled]:opacity-50', className)}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className={cn(
          fieldControlClass,
          'h-control appearance-none truncate ps-2.5 pe-8 disabled:opacity-100',
          // An empty value is a placeholder ("Choose a plan"), so it reads as one.
          "has-[option[value='']:checked]:text-fg-muted",
          'data-[size=sm]:h-control-sm own:data-[size=sm]:rounded-field-sm data-[size=sm]:ps-2 data-[size=sm]:pe-7',
          'data-[size=lg]:h-control-lg own:data-[size=lg]:rounded-field-lg data-[size=lg]:ps-3 data-[size=lg]:pe-9 data-[size=lg]:text-ui-lg',
        )}
        {...props}
      />
      <span
        aria-hidden
        data-slot="native-select-icon"
        className={cn(
          'pointer-events-none absolute end-2.5 top-1/2 own:flex -translate-y-1/2 own:text-fg-muted',
          'group-data-[size=sm]/native-select:end-2 group-data-[size=lg]/native-select:end-3',
        )}
      >
        <ChevronDownIcon trigger="none" size={16} strokeWidth={1.75} />
      </span>
    </div>
  )
}

function NativeSelectOption({ className, ...props }: ComponentProps<'option'>) {
  return (
    <option
      data-slot="native-select-option"
      className={cn('own:bg-overlay own:text-fg', className)}
      {...props}
    />
  )
}

function NativeSelectOptGroup({ className, ...props }: ComponentProps<'optgroup'>) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn('own:bg-overlay own:text-fg', className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
export type { NativeSelectProps }
