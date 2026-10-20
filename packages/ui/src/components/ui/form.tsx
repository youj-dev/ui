'use client'

import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from 'react'
import {
  Controller,
  FormProvider,
  useFormContext,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldError as HookFormError,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
  type UseFormReturn,
  type UseFormStateReturn,
} from 'react-hook-form'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { formLabels } from '@youj/core/labels'
import { AsyncButton, type AsyncButtonProps } from './async-button'
import { Field, FieldDescription, FieldError, FieldLabel, type FieldProps } from './field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

/* react-hook-form, wired into the library's Field and AsyncButton. Validate
 * with any resolver (zodResolver(schema) is the usual one); Form owns
 * submission. The parts are shadcn's, so a shadcn form moves over by changing
 * its imports:
 *
 * - FormField is one controlled value. With `render` it only provides the
 *   field to its parts, as shadcn's does; with a `children` function (and
 *   `label` / `description`) it is the shorthand that lays the parts out for
 *   you.
 * - FormItem is a Field: it groups a label, control, description and message,
 *   marks the control invalid and wires the ids. FormLabel names the control,
 *   FormControl marks it invalid, FormDescription describes it and FormMessage
 *   shows the field's error, growing in and out under it (Field's Collapse).
 * - FormSelect is a FormField around a Select built from `options`, with
 *   the field's value, change, blur and focus target wired to it.
 * - FormSubmit is an AsyncButton: pressing it (or Enter in a field, which
 *   presses it) validates, then runs `onSubmit` with the label morphing to a
 *   spinner and on to a drawn check (`successLabel`), or shaking to a cross:
 *   `invalidLabel` when fields need attention, `errorLabel` when `onSubmit`
 *   throws. A second press while it runs is ignored, so a form never submits
 *   twice.
 * - On an invalid submit, focus moves to the first invalid control in
 *   document order and scrolls it to the middle of the view (smoothly, or at
 *   once under reduced motion). The same happens when `onSubmit` sets field
 *   errors (form.setError) and throws, e.g. for a server-side "name taken". */

class FormInvalidError extends Error {
  constructor() {
    super('The form has invalid fields.')
    this.name = 'FormInvalidError'
  }
}

interface FormContextValue {
  /** Validates and submits; rejects with FormInvalidError when fields are invalid. */
  submit: () => Promise<void>
  /** The FormSubmit, so Enter and requestSubmit() go through its states. */
  submitter: { current: HTMLButtonElement | null }
}

const FormSubmitContext = createContext<FormContextValue | null>(null)

interface FormProps<T extends FieldValues, Context = unknown, Output extends FieldValues = T>
  extends Omit<ComponentProps<'form'>, 'onSubmit'> {
  /** The useForm() return value. */
  form: UseFormReturn<T, Context, Output>
  /** Runs with the resolver's output (a zod schema's parsed values). Resolve for success; reject (or throw) for failure. */
  onSubmit: (values: Output) => unknown
}

function Form<T extends FieldValues, Context = unknown, Output extends FieldValues = T>({
  form,
  onSubmit,
  children,
  ...props
}: FormProps<T, Context, Output>) {
  const k = useYouj()
  const element = useRef<HTMLFormElement>(null)
  const submitter = useRef<HTMLButtonElement | null>(null)

  const focusFirstInvalid = useCallback(() => {
    // Two frames: the errors render, then the controls carry aria-invalid.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const target = element.current?.querySelector<HTMLElement>('[aria-invalid="true"]:not([disabled])')
        if (!target) return
        target.focus({ preventScroll: true, focusVisible: true } as FocusOptions)
        target.scrollIntoView?.({ block: 'center', behavior: k.reduced ? 'auto' : 'smooth' })
      }),
    )
  }, [k.reduced])

  const submit = useCallback(async () => {
    let valid = false
    try {
      await form.handleSubmit(
        async (values) => {
          valid = true
          await onSubmit(values)
        },
        () => focusFirstInvalid(),
      )()
    } catch (error) {
      // A server-side field error set during onSubmit (form.setError) gets the same focus.
      focusFirstInvalid()
      throw error
    }
    if (!valid) throw new FormInvalidError()
  }, [form, onSubmit, focusFirstInvalid])

  const context = useMemo(() => ({ submit, submitter }), [submit])

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const from = (event.nativeEvent as SubmitEvent).submitter
    // The FormSubmit already runs the submission from its own press.
    if (from && from === submitter.current) return
    if (submitter.current) submitter.current.click()
    else submit().catch(() => {})
  }

  return (
    <FormProvider {...form}>
      <FormSubmitContext.Provider value={context}>
        <form ref={element} noValidate data-slot="form" onSubmit={onFormSubmit} {...props}>
          {children}
        </form>
      </FormSubmitContext.Provider>
    </FormProvider>
  )
}

/** What the parts of one FormField read. */
interface FormFieldContextValue {
  name: string
  invalid: boolean
  error: HookFormError | undefined
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null)

/** The surrounding FormField's name, validity and error, for a part of your own. */
function useFormField(): FormFieldContextValue {
  const field = useContext(FormFieldContext)
  if (!field) throw new Error('useFormField must be used inside a FormField.')
  return field
}

interface FormFieldRenderProps<T extends FieldValues, N extends FieldPath<T>> {
  field: ControllerRenderProps<T, N>
  fieldState: ControllerFieldState
  formState: UseFormStateReturn<T>
}

interface FormFieldBase<T extends FieldValues, N extends FieldPath<T>> {
  name: N
  /** For type inference from useForm(); defaults to the surrounding Form's. */
  control?: Control<T>
}

/** The shorthand: the label, control, description and message laid out for you. */
interface FormFieldShorthandProps<T extends FieldValues, N extends FieldPath<T>>
  extends FormFieldBase<T, N>,
    Omit<FieldProps, 'children' | 'invalid' | 'name'> {
  render?: never
  label?: ReactNode
  description?: ReactNode
  /** Renders the control inside the shorthand's label, description and message. Spread `field` onto an Input; map it (`value`, `onValueChange={field.onChange}`, `onBlur`, `ref`) onto the pickers. */
  children: (field: ControllerRenderProps<T, N>, state: ControllerFieldState) => ReactNode
}

/** shadcn's form: you render the parts (FormItem, FormLabel, FormControl, FormMessage…) around the control. */
interface FormFieldRenderingProps<T extends FieldValues, N extends FieldPath<T>> extends FormFieldBase<T, N> {
  render: (props: FormFieldRenderProps<T, N>) => ReactNode
  label?: never
  description?: never
  children?: never
}

type FormFieldProps<T extends FieldValues, N extends FieldPath<T>> = FormFieldShorthandProps<T, N> | FormFieldRenderingProps<T, N>

function FormField<T extends FieldValues, N extends FieldPath<T>>({ name, control, render, label, description, children, ...props }: FormFieldProps<T, N>) {
  const context = useFormContext<T>()
  return (
    <Controller<T, N>
      name={name}
      control={control ?? context.control}
      render={({ field, fieldState, formState }) => (
        <FormFieldContext.Provider value={{ name, invalid: fieldState.invalid, error: fieldState.error }}>
          {render ? (
            render({ field, fieldState, formState })
          ) : (
            <FormItem data-slot="form-field" {...props}>
              {label !== undefined && <FormLabel>{label}</FormLabel>}
              {children?.(field, fieldState)}
              {description !== undefined && <FormDescription>{description}</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        </FormFieldContext.Provider>
      )}
    />
  )
}

/** A Field for one FormField: groups the label, control, description and message, and marks the control invalid. */
function FormItem({ ...props }: Omit<FieldProps, 'invalid'>) {
  const { invalid } = useFormField()
  return <Field data-slot="form-item" invalid={invalid} {...props} />
}

function FormLabel(props: ComponentProps<typeof FieldLabel>) {
  return <FieldLabel data-slot="form-label" {...props} />
}

/** Marks its one child (an Input, a trigger) `aria-invalid` while the field has an error; the Field already wires its id and description. */
function FormControl({ children }: { children: ReactNode }) {
  const { invalid } = useFormField()
  return invalid && isValidElement<{ 'aria-invalid'?: boolean }>(children) ? cloneElement(children, { 'aria-invalid': true }) : children
}

function FormDescription(props: ComponentProps<typeof FieldDescription>) {
  return <FieldDescription data-slot="form-description" {...props} />
}

/** The field's error message; children replace it. */
function FormMessage({ children, ...props }: Omit<ComponentProps<typeof FieldError>, 'errors'>) {
  const { error } = useFormField()
  return <FieldError data-slot="form-message" errors={error ? [error] : []} {...props}>{children}</FieldError>
}

interface FormSelectOption<V> {
  value: V
  label: ReactNode
  disabled?: boolean
}

interface FormSelectProps<T extends FieldValues, N extends FieldPath<T>> extends Omit<FormFieldShorthandProps<T, N>, 'children'> {
  /** The choices, in order. The trigger shows the chosen one's label. */
  options: ReadonlyArray<FormSelectOption<NonNullable<FieldPathValue<T, N>>>>
  /** Shown while the value is empty (`null`). */
  placeholder?: ReactNode
  /** Trigger height. Default `default`. */
  size?: 'sm' | 'default'
}

/**
 * A FormField with a Select in it, for the common case: a list of options.
 * The field's value, onValueChange, onBlur and ref (the control an invalid
 * submit focuses) are wired to the Select and its trigger. An empty Select
 * holds `null`, so a required one refines it away in the schema. For grouped
 * or custom items, compose a Select inside FormField instead.
 */
function FormSelect<T extends FieldValues, N extends FieldPath<T>>({ options, placeholder, size, ...props }: FormSelectProps<T, N>) {
  return (
    <FormField<T, N> {...props}>
      {(field) => (
        <Select items={options} value={field.value ?? null} onValueChange={field.onChange}>
          <SelectTrigger ref={field.ref} onBlur={field.onBlur} size={size} className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={String(option.value)} value={option.value} disabled={option.disabled}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  )
}

interface FormSubmitProps extends Omit<AsyncButtonProps, 'onAction' | 'status' | 'type'> {
  /** Shown beside the cross when fields need attention. Default "Check the form". */
  invalidLabel?: string
}

/** The Form's submit button: validates, then runs `onSubmit` through AsyncButton's states. */
function FormSubmit({ invalidLabel, errorLabel, ref, ...props }: FormSubmitProps) {
  const labels = useComponentLabels(formLabels)
  const form = useContext(FormSubmitContext)
  const [invalid, setInvalid] = useState(false)
  if (!form) throw new Error('FormSubmit must be inside a Form.')
  return (
    <AsyncButton
      {...props}
      ref={(node: HTMLButtonElement | null) => {
        form.submitter.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      type="submit"
      data-slot="form-submit"
      errorLabel={invalid ? (invalidLabel ?? labels.checkForm) : (errorLabel ?? labels.failed)}
      onAction={async () => {
        setInvalid(false)
        try {
          await form.submit()
        } catch (error) {
          setInvalid(error instanceof FormInvalidError)
          throw error
        }
      }}
    />
  )
}

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormInvalidError,
  FormItem,
  FormLabel,
  FormMessage,
  FormSelect,
  FormSubmit,
  useFormField,
  type FormFieldProps,
  type FormFieldRenderProps,
  type FormProps,
  type FormSelectOption,
  type FormSelectProps,
  type FormSubmitProps,
}
