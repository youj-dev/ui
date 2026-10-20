'use client'

import { useEffect, type Ref } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ArrowRightIcon, PartyPopperIcon, SparkleIcon } from '@youj/icons'
import { DatePicker } from '@youj/react/components/ui/date-picker'
import { Form, FormField, FormSubmit } from '@youj/react/components/ui/form'
import { Input } from '@youj/react/components/ui/input'
import { NumberInput } from '@youj/react/components/ui/number-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@youj/react/components/ui/select'
import { Separator } from '@youj/react/components/ui/separator'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@youj/react/components/ui/sheet'
import { Textarea } from '@youj/react/components/ui/textarea'
import { Timeline } from '@youj/react/components/ui/timeline'
import { PEOPLE, PERSON, type PersonId, type Status } from '../data'
import { dateOf, dayOf, rangeLabel } from '../days'
import type { Tandem } from '../use-tandem'

/* A task, opened: its form (react-hook-form + zod, saved through FormSubmit)
 * and everything that happened to it, including the moves made on the
 * runway. */

const schema = z.object({
  title: z.string().trim().min(3, 'Give the task a title of at least 3 characters.'),
  owner: z.enum(['noor', 'jun', 'ines', 'theo', 'mara']),
  status: z.enum(['todo', 'doing', 'done']),
  start: z.date(),
  days: z.number().int().min(1, 'At least a day.').max(10, 'Split anything longer than two weeks.'),
  brief: z.string(),
})
type Values = z.infer<typeof schema>

const STATUS: Record<Status, string> = { todo: 'To do', doing: 'Doing', done: 'Done' }
const OWNERS = Object.fromEntries(PEOPLE.map((p) => [p.id, p.name])) as Record<PersonId, string>
const ACTIVITY = {
  create: { icon: SparkleIcon, label: 'Created' },
  move: { icon: ArrowRightIcon, tone: 'accent' as const, label: 'Moved' },
  ship: { icon: PartyPopperIcon, tone: 'success' as const, label: 'Handed off' },
}

function Choice<T extends string>({ field, items }: { field: { value: T; onChange: (v: T) => void; ref: Ref<HTMLButtonElement> }; items: Record<T, string> }) {
  return (
    <Select items={items} value={field.value} onValueChange={(v) => v && field.onChange(v as T)}>
      <SelectTrigger ref={field.ref} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(items) as [T, string][]).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function TaskSheet({ tandem }: { tandem: Tandem }) {
  const { project, openId, today } = tandem
  const task = project.tasks.find((t) => t.id === openId) ?? null
  const placed = task ? tandem.settled.get(task.id) : undefined
  const form = useForm<Values>({ resolver: zodResolver(schema), mode: 'onTouched' })
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are chosen by hand
  useEffect(() => {
    if (task) form.reset({ title: task.title, owner: task.owner, status: task.status, start: dateOf(today, task.start), days: task.days, brief: task.brief })
    // Only when another task opens: saving mustn't reset the form under you.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are chosen by hand
  }, [task?.id, form, today])

  return (
    <Sheet open={task !== null} onOpenChange={(open) => !open && tandem.setOpenId(null)}>
      <SheetContent className="w-[min(34rem,calc(100vw-2.5rem))]">
        {task && placed && (
          <Form
            form={form}
            onSubmit={async (values) => {
              await new Promise((resolve) => setTimeout(resolve, 450))
              tandem.save(task.id, { ...values, start: dayOf(today, values.start) })
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <SheetHeader>
              <SheetDescription>
                {PERSON[task.owner].name} · {rangeLabel(today, placed.start, placed.end)}
                {placed.late && ' · lands after launch'}
              </SheetDescription>
              <SheetTitle className="text-balance">{task.title}</SheetTitle>
            </SheetHeader>
            <SheetBody className="flex flex-col gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField name="title" label="Title" required className="sm:col-span-2">
                  {(field) => <Input {...field} />}
                </FormField>
                <FormField name="owner" label="Who">
                  {(field) => <Choice field={field} items={OWNERS} />}
                </FormField>
                <FormField name="status" label="Status">
                  {(field) => <Choice field={field} items={STATUS} />}
                </FormField>
                <FormField name="start" label="Starts">
                  {(field) => <DatePicker ref={field.ref} value={field.value} onValueChange={(date) => date && field.onChange(date)} />}
                </FormField>
                <FormField name="days" label="Days">
                  {(field) => <NumberInput ref={field.ref} value={field.value} onValueChange={(v) => field.onChange(v ?? 1)} min={1} max={10} onBlur={field.onBlur} />}
                </FormField>
                <FormField name="brief" label="Brief" className="sm:col-span-2">
                  {(field) => <Textarea {...field} rows={4} />}
                </FormField>
              </div>
              <Separator />
              <section aria-labelledby="task-activity" className="flex flex-col gap-3">
                <h3 id="task-activity" className="text-ui font-medium text-fg">
                  Activity
                </h3>
                <Timeline types={ACTIVITY} events={[...task.activity].sort((a, b) => Number(b.time) - Number(a.time))} />
              </section>
            </SheetBody>
            <SheetFooter className="border-t border-line">
              <FormSubmit successLabel="Saved" pendingLabel="Saving…">
                Save changes
              </FormSubmit>
            </SheetFooter>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  )
}
