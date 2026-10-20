import type { MultiStepFormCopy, ApplicationOption, ApplicationStepId, ApplicationValues } from './data'

/* What each step needs, as [field path, message] in the order the fields
 * appear, so the step's error summary lists them top to bottom and each
 * links to its field. Messages say what to do, the way the GOV.UK pattern
 * writes them: "Date of birth must include a year", not "Invalid input". */

export type Problem = [path: string, message: string]

interface Context {
  copy: MultiStepFormCopy
  now: Date
  /** Documents that finished uploading, and whether any are still going. */
  documents: { done: number; uploading: boolean }
  /** The roles, for which hold a share. */
  roles: ApplicationOption[]
  /** The youngest age that may apply. */
  minAge: number
}

const blank = (value: string) => !value.trim()

export function problems(values: ApplicationValues, step: ApplicationStepId, { copy, now, documents, roles, minAge }: Context): Problem[] {
  const found: Problem[] = []
  const say = (path: string, message: string) => found.push([path, message])

  if (step === 'business') {
    if (!values.type) say('type', copy.typeMissing)
    if (blank(values.name)) say('name', copy.nameMissing)
    if (!values.industry) say('industry', copy.industryMissing)
  }

  if (step === 'company') {
    const registration = values.registration.replace(/\s/g, '')
    if (!registration && values.type !== 'partnership') say('registration', copy.registrationMissing)
    else if (registration && !/^[A-Z0-9]{6,12}$/i.test(registration)) say('registration', copy.registrationInvalid)
    const year = Number(values.founded)
    if (values.founded && (!/^\d{4}$/.test(values.founded) || year < 1800 || year > now.getFullYear())) say('founded', copy.foundedInvalid(now.getFullYear()))
    if (values.website && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(values.website.trim())) say('website', copy.websiteInvalid)
  }

  if (step === 'people') {
    let total = 0
    values.people.forEach((person, index) => {
      if (blank(person.name)) say(`people.${index}.name`, copy.personNameMissing)
      if (!person.role) say(`people.${index}.role`, copy.roleMissing)
      if (roles.find((role) => role.value === person.role)?.share) {
        const share = Number(person.share)
        if (!/^\d{1,3}$/.test(person.share) || share < 1 || share > 100) say(`people.${index}.share`, copy.shareMissing)
        else total += share
      }
    })
    if (total > 100) say('people.root', copy.sharesOver(total))
  }

  if (step === 'you') {
    if (blank(values.you.name)) say('you.name', copy.yourNameMissing)
    const { day, month, year } = values.you
    const missing = (['day', 'month', 'year'] as const).find((part) => blank(values.you[part]))
    if (missing) say(`you.${missing}`, copy.birthMissing(copy[missing]))
    else {
      const date = new Date(Number(year), Number(month) - 1, Number(day))
      const real = /^\d{1,2}$/.test(day) && /^\d{1,2}$/.test(month) && /^\d{4}$/.test(year) && date.getDate() === Number(day) && date.getMonth() === Number(month) - 1
      const adult = new Date(Number(year) + minAge, Number(month) - 1, Number(day)) <= now
      if (!real) say('you.day', copy.birthInvalid)
      else if (date > now) say('you.day', copy.birthFuture)
      else if (!adult) say('you.day', copy.birthAge)
    }
  }

  if (step === 'documents') {
    if (documents.uploading) say('documents', copy.documentsUploading)
    else if (!documents.done) say('documents', copy.documentsMissing)
  }

  if (step === 'review' && !values.declaration) say('declaration', copy.declarationMissing)
  return found
}

/** Problems as the nested errors react-hook-form's resolver returns (`people.0.name` → `{ people: [{ name }] }`). */
export function nested(list: Problem[]) {
  const errors: Record<string, unknown> = {}
  for (const [path, message] of list) {
    const keys = path.split('.')
    let node = errors as Record<string, unknown>
    keys.forEach((key, i) => {
      if (i === keys.length - 1) node[key] = { type: 'validate', message }
      else {
        node[key] ??= /^\d+$/.test(keys[i + 1]!) ? [] : {}
        node = node[key] as Record<string, unknown>
      }
    })
  }
  return errors
}
