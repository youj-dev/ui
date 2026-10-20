'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from 'react'
import { Field as FieldPrimitive } from '@base-ui/react/field'
import { Fieldset as FieldsetPrimitive } from '@base-ui/react/fieldset'
import { useFieldRootContext } from '@base-ui/react/internals/field-root-context'
import { useLabelableContext, useLabelableId } from '@base-ui/react/internals/labelable-provider'
import { cva, type VariantProps } from 'class-variance-authority'
import { Collapse } from '@youj/motion'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'
import { labelClass, RequiredMark } from './label'
import { Separator } from './separator'

/* Field is Base UI's Field.Root, so the wiring is correct by construction:
 * FieldLabel names the control (aria-labelledby, and htmlFor where the control
 * is labelable), FieldDescription and a rendered FieldError are added to the
 * control's aria-describedby, and `invalid` / `disabled` reach the control's
 * data attributes. `required` is youj's addition: set it once on the Field
 * and the label shows the mark while the control gets `required`.
 *
 * Base UI's label/description/error parts throw outside a Field.Root, but
 * shadcn composes them freely (a description under a legend, a label that
 * wraps a whole Field as a choice card). Outside a Field they render as plain
 * elements with the same look. */

const FieldContext = createContext<{
  required: boolean
  /** True once the Field has mounted: a FieldError mounting after that grows in. */
  mounted: RefObject<boolean>
} | null>(null)

/** The surrounding Field's `required`, as the default for a control's own. */
function useFieldRequired(): boolean | undefined {
  return useContext(FieldContext)?.required || undefined
}

/**
 * Wires a control Base UI doesn't know (a popover trigger, a row of time
 * segments) into the surrounding Field the way Base UI wires its own: `id` is
 * what the FieldLabel's htmlFor points at, `labelId` is the label's id (for
 * aria-labelledby on roles a native label can't name), `describedBy` lists the
 * Field's description and error, and `invalid` / `disabled` / `required` are
 * the Field's. Outside a Field it returns a stable id and nothing else.
 * With `labelable: false` the control doesn't claim the label's htmlFor (a
 * group whose first input already does, which reads `labelId` instead).
 */
function useFieldControl(id?: string, { labelable = true }: { labelable?: boolean } = {}) {
  const controlId = useLabelableId({ id, enabled: labelable })
  const { labelId, getDescriptionProps } = useLabelableContext()
  const root = useFieldRootContext(true)
  const required = useFieldRequired()
  return {
    id: controlId,
    labelId,
    describedBy: getDescriptionProps({})['aria-describedby'] as string | undefined,
    invalid: root.invalid === true || root.state.valid === false,
    disabled: root.disabled === true,
    required,
  }
}

function FieldSet({ className, ...props }: FieldsetPrimitive.Root.Props) {
  return (
    <FieldsetPrimitive.Root
      data-slot="field-set"
      className={cn(
        'own:flex own:min-w-0 flex-col own:gap-[calc(var(--spacing)*(4_-_var(--ui--compact,0)))] own:has-[>[data-slot=checkbox-group]]:gap-3 own:has-[>[data-slot=radio-group]]:gap-3',
        className,
      )}
      {...props}
    />
  )
}

function FieldLegend({
  className,
  variant = 'legend',
  ...props
}: FieldsetPrimitive.Legend.Props & { variant?: 'legend' | 'label' }) {
  return (
    <FieldsetPrimitive.Legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        'own:font-medium own:text-fg own:data-[variant=label]:text-ui own:data-[variant=legend]:text-ui-lg',
        // A description right under a legend tucks up to it.
        '[&+[data-slot=field-description]]:-mt-2.5',
        className,
      )}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        'group/field-group @container/field-group own:flex own:w-full flex-col own:gap-[calc(var(--spacing)*(6_-_2*var(--ui--compact,0)))] *:data-[slot=field-group]:gap-4',
        className,
      )}
      {...props}
    />
  )
}

const fieldVariants = cva('group/field own:flex own:w-full own:gap-[calc(var(--spacing)*(2_-_0.5*var(--ui--compact,0)))]', {
  variants: {
    orientation: {
      vertical: 'flex-col *:w-full [&>.sr-only]:w-auto',
      horizontal: [
        'flex-row items-center own:gap-2.5 has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto',
        'has-[>[data-slot=field-content]]:[&>:is([role=checkbox],[role=radio])]:mt-0.5 has-[>[data-slot=field-content]]:[&>[role=switch]]:mt-px',
      ],
      responsive:
        'flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
})

interface FieldProps extends FieldPrimitive.Root.Props, VariantProps<typeof fieldVariants> {
  /** Marks the label and makes the control required. */
  required?: boolean
}

function Field({ className, orientation = 'vertical', required = false, ...props }: FieldProps) {
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
  }, [])
  const context = useMemo(() => ({ required, mounted }), [required])
  return (
    <FieldContext.Provider value={context}>
      <FieldPrimitive.Root
        data-slot="field"
        data-orientation={orientation}
        data-required={required || undefined}
        className={cn(fieldVariants({ orientation }), className)}
        {...props}
      />
    </FieldContext.Provider>
  )
}

function FieldContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-content"
      className={cn('group/field-content own:flex flex-1 flex-col own:gap-1 own:leading-snug', className)}
      {...props}
    />
  )
}

/* A FieldLabel that wraps a whole Field becomes a choice card: the entire
 * card is the hit target, its edge doubles in the accent when its control is
 * checked (no fill, so a monochrome accent never reads gray on gray), and it
 * takes the focus ring from the control inside (which then drops its own). */
const choiceCardClass = cn(
  'has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:items-stretch *:data-[slot=field]:p-3',
  'has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border has-[>[data-slot=field]]:border-line own:has-[>[data-slot=field]]:font-normal',
  'has-[>[data-slot=field]]:transition-[background-color,border-color,box-shadow] has-[>[data-slot=field]]:yj-duration-fast has-[>[data-slot=field]]:ease-standard',
  'has-[>[data-slot=field]]:hover:bg-hover has-[>[data-slot=field]]:focus-ring-within',
  'has-[>[data-slot=field]]:has-data-checked:border-accent has-[>[data-slot=field]]:has-data-checked:inset-ring has-[>[data-slot=field]]:has-data-checked:inset-ring-accent has-[>[data-slot=field]]:has-data-checked:hover:bg-transparent',
  'has-[>[data-slot=field]]:has-data-disabled:pointer-events-none has-[>[data-slot=field]]:has-data-disabled:opacity-50',
)

interface FieldLabelProps extends FieldPrimitive.Label.Props {
  /** Shows the required mark. Defaults to the surrounding Field's `required`. */
  required?: boolean
}

function FieldLabel({ className, required, children, ...props }: FieldLabelProps) {
  const field = useContext(FieldContext)
  const classes = cn(labelClass, 'own:w-fit group-data-disabled/field:opacity-50', choiceCardClass, className)
  const content = (
    <>
      {children}
      {(required ?? field?.required) && <RequiredMark />}
    </>
  )
  if (!field) {
    return (
      <label data-slot="field-label" className={classes} {...(props as ComponentProps<'label'>)}>
        {content}
      </label>
    )
  }
  return (
    <FieldPrimitive.Label data-slot="field-label" className={classes} {...props}>
      {content}
    </FieldPrimitive.Label>
  )
}

function FieldTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        'own:flex own:w-fit items-center own:gap-2 own:text-ui own:leading-5 own:font-medium own:text-fg group-data-disabled/field:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

const descriptionClass = cn(
  'own:text-ui-sm own:leading-normal own:text-fg-muted group-data-[orientation=horizontal]/field:text-balance',
  '[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-fg',
)

function FieldDescription({ className, ...props }: FieldPrimitive.Description.Props) {
  const field = useContext(FieldContext)
  if (!field) {
    return <p data-slot="field-description" className={cn(descriptionClass, className)} {...(props as ComponentProps<'p'>)} />
  }
  return <FieldPrimitive.Description data-slot="field-description" className={cn(descriptionClass, className)} {...props} />
}

function FieldSeparator({ children, className, ...props }: ComponentProps<'div'> & { children?: ReactNode }) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn('relative own:-my-2 own:h-5 own:text-ui-sm', className)}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="relative own:mx-auto own:block w-fit bg-canvas px-2 own:text-fg-muted"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  )
}

interface FieldErrorProps extends FieldPrimitive.Error.Props {
  /** react-hook-form style errors. Duplicates collapse; several become a list. */
  errors?: Array<{ message?: string } | undefined>
}

/* The message grows the layout instead of pushing it: motion's Collapse
 * eases the height from 0 while the text fades in, and closes over the last
 * message on the way out. The Field's flex gap is folded into the animated
 * height (the panel cancels it with a negative margin, the message re-adds it
 * as padding), so nothing around it jumps when the panel mounts or unmounts. */
const errorPanelClass = '[[data-slot=field]>&]:-mt-2 [[data-slot=field-content]>&]:-mt-1'
const errorGapClass = '[[data-slot=field]>*>&]:pt-2 [[data-slot=field-content]>*>&]:pt-1'

/**
 * With children or `errors`, it shows them (app-controlled validation, e.g.
 * `<Field invalid>`); with neither, it shows the control's native validation
 * message once the field is invalid. It is an alert: a message that appears
 * after a submit attempt has to interrupt.
 */
function FieldError({ className, children, errors, match, ...props }: FieldErrorProps) {
  const k = useYouj()
  const field = useContext(FieldContext)
  const content = useMemo(() => {
    if (children) return children
    if (!errors?.length) return null
    const unique = [...new Map(errors.map((error) => [error?.message, error])).values()]
    if (unique.length === 1) return unique[0]?.message ?? null
    return (
      <ul className="ms-4 flex list-disc flex-col gap-1">
        {unique.map((error, index) => error?.message && <li key={index}>{error.message}</li>)}
      </ul>
    )
  }, [children, errors])

  // An error rendered with its Field is simply there; one mounted later (a
  // conditionally rendered message) starts closed for a frame, then grows in.
  // The ref is read once, at mount: "did the Field exist before me?"
  const [armed, setArmed] = useState(() => !field?.mounted.current)
  useEffect(() => {
    if (!armed) setArmed(true)
  }, [armed])

  const appControlled = children !== undefined || errors !== undefined
  const effectiveMatch = match ?? (appControlled ? true : undefined)

  const classes = cn(
    'own:text-ui-sm own:font-medium own:text-danger',
    errorGapClass,
    // Base UI unmounts the message once its own transitions finish; a fade as
    // long as the collapse keeps the last message in place while it closes.
    'transition-opacity yj-duration-base own:ease-standard data-ending-style:opacity-0',
    className,
  )

  if (!field) {
    // Outside a Field there is no native validity to show.
    return (
      <Collapse open={armed && appControlled && !!content} data-slot="field-error-panel" className={errorPanelClass}>
        <div role="alert" data-slot="field-error" className={classes} {...(props as ComponentProps<'div'>)}>
          {content}
        </div>
      </Collapse>
    )
  }

  const error = (
    <FieldPrimitive.Error
      role="alert"
      data-slot="field-error"
      data-reduced-motion={k.reduced || undefined}
      match={effectiveMatch}
      className={classes}
      {...props}
      // Only app-controlled content is passed: an explicit children prop,
      // even null, would replace the native validation message.
      {...(appControlled ? { children: content } : {})}
    />
  )

  // One tree for every mode, so a message that comes and goes (children
  // toggling between a string and undefined) animates instead of remounting.
  // The panel opens exactly when Base UI shows the message: the control's
  // validity, `invalid`, or a Form error for this field.
  return (
    <FieldPrimitive.Validity>
      {({ validity }) => {
        let shown: boolean
        if (typeof effectiveMatch === 'string') shown = Boolean(validity[effectiveMatch]) && (!appControlled || !!content)
        else if (effectiveMatch === true) shown = !appControlled || !!content
        else shown = validity.valid === false
        return (
          <Collapse open={armed && shown} data-slot="field-error-panel" className={errorPanelClass}>
            {error}
          </Collapse>
        )
      }}
    </FieldPrimitive.Validity>
  )
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
  useFieldControl,
  useFieldRequired,
  type FieldProps,
}
